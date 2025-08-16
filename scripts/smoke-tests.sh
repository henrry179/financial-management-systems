#!/bin/bash

# 冒烟测试脚本
# 用于快速验证部署后系统的基本功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
ENVIRONMENT=${1:-staging}
TIMEOUT=30
RETRY_COUNT=3
SLEEP_INTERVAL=5

# 根据环境设置URL
case $ENVIRONMENT in
  staging)
    BASE_URL="https://staging.financial-system.com"
    ;;
  production)
    BASE_URL="https://financial-system.com"
    ;;
  local)
    BASE_URL="http://localhost:8080"
    ;;
  *)
    echo -e "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
    echo "Usage: $0 [staging|production|local]"
    exit 1
    ;;
esac

API_URL="$BASE_URL/api/v1"

# 日志函数
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# HTTP请求函数
make_request() {
  local method=$1
  local url=$2
  local data=$3
  local headers=$4
  local expected_status=${5:-200}
  
  local curl_cmd="curl -s -w '%{http_code}' -X $method '$url'"
  
  if [[ -n "$headers" ]]; then
    curl_cmd="$curl_cmd $headers"
  fi
  
  if [[ -n "$data" ]]; then
    curl_cmd="$curl_cmd -d '$data'"
  fi
  
  local response=$(eval $curl_cmd)
  local status_code=${response: -3}
  local body=${response%???}
  
  if [[ "$status_code" == "$expected_status" ]]; then
    return 0
  else
    log_error "Expected status $expected_status, got $status_code"
    echo "Response: $body"
    return 1
  fi
}

# 重试函数
retry() {
  local command="$1"
  local description="$2"
  local count=0
  
  while [ $count -lt $RETRY_COUNT ]; do
    if eval "$command"; then
      log_success "$description"
      return 0
    else
      count=$((count + 1))
      if [ $count -lt $RETRY_COUNT ]; then
        log_warning "Attempt $count failed, retrying in ${SLEEP_INTERVAL}s..."
        sleep $SLEEP_INTERVAL
      fi
    fi
  done
  
  log_error "$description failed after $RETRY_COUNT attempts"
  return 1
}

# 测试函数
test_health_check() {
  log_info "Testing health check endpoint..."
  retry "make_request GET '$BASE_URL/health'" "Health check"
}

test_api_health() {
  log_info "Testing API health endpoint..."
  retry "make_request GET '$API_URL/health'" "API health check"
}

test_frontend_load() {
  log_info "Testing frontend loading..."
  local response=$(curl -s -w '%{http_code}' "$BASE_URL")
  local status_code=${response: -3}
  
  if [[ "$status_code" == "200" ]]; then
    local body=${response%???}
    if echo "$body" | grep -q "财务管理系统"; then
      log_success "Frontend loads correctly"
    else
      log_error "Frontend content verification failed"
      return 1
    fi
  else
    log_error "Frontend loading failed with status $status_code"
    return 1
  fi
}

test_api_endpoints() {
  log_info "Testing API endpoints accessibility..."
  
  # Test public endpoints
  retry "make_request GET '$API_URL/auth/status'" "Auth status endpoint"
  
  # Test if authentication is required
  local auth_response=$(curl -s -w '%{http_code}' -X GET "$API_URL/auth/profile")
  local auth_status=${auth_response: -3}
  
  if [[ "$auth_status" == "401" ]]; then
    log_success "Authentication protection working"
  else
    log_error "Authentication protection failed - expected 401, got $auth_status"
    return 1
  fi
}

test_database_connection() {
  log_info "Testing database connection..."
  
  # Try to access an endpoint that requires database
  local db_response=$(curl -s -w '%{http_code}' -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"invalid"}')
  local db_status=${db_response: -3}
  
  # We expect either 401 (auth failed) or 400 (validation error)
  # but not 500 (database error)
  if [[ "$db_status" == "401" || "$db_status" == "400" ]]; then
    log_success "Database connection working"
  else
    log_error "Database connection issue - got status $db_status"
    return 1
  fi
}

test_redis_connection() {
  log_info "Testing Redis connection..."
  
  # Test cache-dependent endpoint
  local cache_response=$(curl -s -w '%{http_code}' -X GET "$API_URL/system/stats")
  local cache_status=${cache_response: -3}
  
  if [[ "$cache_status" == "200" || "$cache_status" == "401" ]]; then
    log_success "Redis connection working"
  else
    log_error "Redis connection issue - got status $cache_status"
    return 1
  fi
}

test_security_headers() {
  log_info "Testing security headers..."
  
  local headers=$(curl -s -I "$BASE_URL")
  
  local security_checks=(
    "X-Frame-Options"
    "X-Content-Type-Options"
    "X-XSS-Protection"
    "Strict-Transport-Security"
  )
  
  local missing_headers=()
  
  for header in "${security_checks[@]}"; do
    if echo "$headers" | grep -qi "$header"; then
      log_success "Security header present: $header"
    else
      missing_headers+=("$header")
    fi
  done
  
  if [[ ${#missing_headers[@]} -gt 0 ]]; then
    log_warning "Missing security headers: ${missing_headers[*]}"
  else
    log_success "All security headers present"
  fi
}

test_ssl_certificate() {
  if [[ "$BASE_URL" == https* ]]; then
    log_info "Testing SSL certificate..."
    
    local ssl_info=$(echo | openssl s_client -servername "${BASE_URL#https://}" -connect "${BASE_URL#https://}":443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
      log_success "SSL certificate is valid"
      
      # Check expiration
      local not_after=$(echo "$ssl_info" | grep "notAfter" | cut -d= -f2)
      local expiry_timestamp=$(date -d "$not_after" +%s 2>/dev/null)
      local current_timestamp=$(date +%s)
      local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
      
      if [[ $days_until_expiry -gt 30 ]]; then
        log_success "SSL certificate expires in $days_until_expiry days"
      elif [[ $days_until_expiry -gt 7 ]]; then
        log_warning "SSL certificate expires in $days_until_expiry days"
      else
        log_error "SSL certificate expires in $days_until_expiry days - renewal needed!"
      fi
    else
      log_error "SSL certificate validation failed"
      return 1
    fi
  else
    log_info "Skipping SSL test for HTTP endpoint"
  fi
}

test_performance_basic() {
  log_info "Testing basic performance..."
  
  local start_time=$(date +%s%N)
  local response=$(curl -s -w '%{http_code}' "$BASE_URL")
  local end_time=$(date +%s%N)
  
  local duration_ms=$(( (end_time - start_time) / 1000000 ))
  local status_code=${response: -3}
  
  if [[ "$status_code" == "200" ]]; then
    if [[ $duration_ms -lt 2000 ]]; then
      log_success "Response time: ${duration_ms}ms (Good)"
    elif [[ $duration_ms -lt 5000 ]]; then
      log_warning "Response time: ${duration_ms}ms (Acceptable)"
    else
      log_error "Response time: ${duration_ms}ms (Too slow)"
      return 1
    fi
  else
    log_error "Performance test failed with status $status_code"
    return 1
  fi
}

test_api_rate_limiting() {
  log_info "Testing API rate limiting..."
  
  local rate_limit_hit=false
  
  for i in {1..20}; do
    local response=$(curl -s -w '%{http_code}' -X GET "$API_URL/health")
    local status_code=${response: -3}
    
    if [[ "$status_code" == "429" ]]; then
      rate_limit_hit=true
      break
    fi
    
    sleep 0.1
  done
  
  if [[ "$rate_limit_hit" == true ]]; then
    log_success "Rate limiting is working"
  else
    log_warning "Rate limiting may not be configured or threshold is high"
  fi
}

# 主测试函数
run_smoke_tests() {
  local start_time=$(date +%s)
  local failed_tests=0
  local total_tests=0
  
  echo -e "${BLUE}🔥 Starting smoke tests for $ENVIRONMENT environment${NC}"
  echo -e "${BLUE}📍 Base URL: $BASE_URL${NC}"
  echo ""
  
  # 运行所有测试
  local tests=(
    "test_health_check"
    "test_api_health"
    "test_frontend_load"
    "test_api_endpoints"
    "test_database_connection"
    "test_redis_connection"
    "test_security_headers"
    "test_ssl_certificate"
    "test_performance_basic"
    "test_api_rate_limiting"
  )
  
  for test in "${tests[@]}"; do
    total_tests=$((total_tests + 1))
    echo ""
    if ! $test; then
      failed_tests=$((failed_tests + 1))
    fi
  done
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  echo ""
  echo "======================================"
  if [[ $failed_tests -eq 0 ]]; then
    echo -e "${GREEN}🎉 All smoke tests passed! ($total_tests/$total_tests)${NC}"
    echo -e "${GREEN}✨ System is ready for use${NC}"
  else
    echo -e "${RED}💥 Some tests failed: $failed_tests/$total_tests${NC}"
    echo -e "${RED}⚠️  System may have issues${NC}"
  fi
  echo -e "${BLUE}⏱️  Total time: ${duration}s${NC}"
  echo "======================================"
  
  # 返回退出码
  if [[ $failed_tests -eq 0 ]]; then
    exit 0
  else
    exit 1
  fi
}

# 检查依赖
check_dependencies() {
  local deps=("curl" "openssl" "date")
  
  for dep in "${deps[@]}"; do
    if ! command -v "$dep" &> /dev/null; then
      log_error "Required dependency not found: $dep"
      exit 1
    fi
  done
}

# 主执行
main() {
  echo -e "${BLUE}🚀 Financial System Smoke Tests${NC}"
  echo ""
  
  check_dependencies
  run_smoke_tests
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi