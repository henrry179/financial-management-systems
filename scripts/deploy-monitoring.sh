#!/bin/bash

# 监控系统部署脚本
# 用于部署Prometheus、Grafana、Alertmanager、Fluentd等监控组件

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
NAMESPACE=${1:-monitoring}
ENVIRONMENT=${2:-production}
DRY_RUN=${3:-false}

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

# 检查依赖
check_dependencies() {
  log_info "检查依赖工具..."
  
  local deps=("kubectl" "helm" "envsubst")
  
  for dep in "${deps[@]}"; do
    if ! command -v "$dep" &> /dev/null; then
      log_error "缺少依赖工具: $dep"
      exit 1
    fi
  done
  
  # 检查kubectl连接
  if ! kubectl cluster-info &> /dev/null; then
    log_error "无法连接到Kubernetes集群"
    exit 1
  fi
  
  log_success "依赖检查完成"
}

# 创建命名空间
create_namespace() {
  log_info "创建命名空间: $NAMESPACE"
  
  if kubectl get namespace "$NAMESPACE" &> /dev/null; then
    log_warning "命名空间 $NAMESPACE 已存在"
  else
    kubectl create namespace "$NAMESPACE"
    log_success "命名空间创建完成"
  fi
  
  # 添加标签
  kubectl label namespace "$NAMESPACE" name="$NAMESPACE" --overwrite
  kubectl label namespace "$NAMESPACE" environment="$ENVIRONMENT" --overwrite
}

# 添加Helm仓库
add_helm_repos() {
  log_info "添加Helm仓库..."
  
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm repo add grafana https://grafana.github.io/helm-charts
  helm repo add elastic https://helm.elastic.co
  helm repo add fluent https://fluent.github.io/helm-charts
  
  helm repo update
  
  log_success "Helm仓库添加完成"
}

# 创建ConfigMaps
create_configmaps() {
  log_info "创建配置文件..."
  
  # Prometheus配置
  kubectl create configmap prometheus-config \
    --from-file=./monitoring/prometheus/prometheus.yml \
    --namespace="$NAMESPACE" \
    --dry-run=client -o yaml | kubectl apply -f -
  
  # Prometheus告警规则
  kubectl create configmap prometheus-rules \
    --from-file=./monitoring/prometheus/rules/ \
    --namespace="$NAMESPACE" \
    --dry-run=client -o yaml | kubectl apply -f -
  
  # Alertmanager配置
  kubectl create configmap alertmanager-config \
    --from-file=./monitoring/alertmanager/alertmanager.yml \
    --namespace="$NAMESPACE" \
    --dry-run=client -o yaml | kubectl apply -f -
  
  # Grafana仪表板
  kubectl create configmap grafana-dashboards \
    --from-file=./monitoring/grafana/dashboards/ \
    --namespace="$NAMESPACE" \
    --dry-run=client -o yaml | kubectl apply -f -
  
  # Fluentd配置
  kubectl create configmap fluentd-config \
    --from-file=./monitoring/fluentd/fluent.conf \
    --namespace="$NAMESPACE" \
    --dry-run=client -o yaml | kubectl apply -f -
  
  log_success "配置文件创建完成"
}

# 创建Secrets
create_secrets() {
  log_info "创建密钥..."
  
  # 从环境变量或提示输入敏感信息
  if [[ -z "$SMTP_PASSWORD" ]]; then
    read -s -p "请输入SMTP密码: " SMTP_PASSWORD
    echo
  fi
  
  if [[ -z "$SLACK_WEBHOOK_URL" ]]; then
    read -p "请输入Slack Webhook URL: " SLACK_WEBHOOK_URL
  fi
  
  if [[ -z "$WEBHOOK_TOKEN" ]]; then
    WEBHOOK_TOKEN=$(openssl rand -hex 32)
    log_info "生成的Webhook Token: $WEBHOOK_TOKEN"
  fi
  
  # 创建Alertmanager secrets
  kubectl create secret generic alertmanager-secrets \
    --from-literal=smtp-password="$SMTP_PASSWORD" \
    --from-literal=slack-webhook-url="$SLACK_WEBHOOK_URL" \
    --from-literal=webhook-token="$WEBHOOK_TOKEN" \
    --namespace="$NAMESPACE" \
    --dry-run=client -o yaml | kubectl apply -f -
  
  # 创建Grafana admin密码
  GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-$(openssl rand -base64 32)}
  kubectl create secret generic grafana-secrets \
    --from-literal=admin-user=admin \
    --from-literal=admin-password="$GRAFANA_ADMIN_PASSWORD" \
    --namespace="$NAMESPACE" \
    --dry-run=client -o yaml | kubectl apply -f -
  
  log_success "密钥创建完成"
  log_info "Grafana管理员密码: $GRAFANA_ADMIN_PASSWORD"
}

# 部署Prometheus
deploy_prometheus() {
  log_info "部署Prometheus..."
  
  helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
    --namespace="$NAMESPACE" \
    --set prometheus.prometheusSpec.configMaps[0]=prometheus-config \
    --set prometheus.prometheusSpec.ruleSelector.matchLabels.app=prometheus \
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
    --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
    --set prometheus.prometheusSpec.retention=30d \
    --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName=gp2 \
    --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
    --set alertmanager.enabled=true \
    --set alertmanager.alertmanagerSpec.configSecret=alertmanager-secrets \
    --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.storageClassName=gp2 \
    --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.resources.requests.storage=10Gi \
    --set grafana.enabled=true \
    --set grafana.admin.existingSecret=grafana-secrets \
    --set grafana.persistence.enabled=true \
    --set grafana.persistence.storageClassName=gp2 \
    --set grafana.persistence.size=10Gi \
    --set grafana.sidecar.dashboards.enabled=true \
    --set grafana.sidecar.dashboards.searchNamespace="$NAMESPACE" \
    --wait
  
  log_success "Prometheus部署完成"
}

# 部署Elasticsearch
deploy_elasticsearch() {
  log_info "部署Elasticsearch..."
  
  helm upgrade --install elasticsearch elastic/elasticsearch \
    --namespace="$NAMESPACE" \
    --set replicas=3 \
    --set minimumMasterNodes=2 \
    --set esConfig."elasticsearch\.yml"="cluster.name: financial-logs\nnetwork.host: 0.0.0.0\n" \
    --set resources.requests.cpu=500m \
    --set resources.requests.memory=2Gi \
    --set resources.limits.cpu=1000m \
    --set resources.limits.memory=2Gi \
    --set volumeClaimTemplate.storageClassName=gp2 \
    --set volumeClaimTemplate.resources.requests.storage=30Gi \
    --set service.type=ClusterIP \
    --wait
  
  log_success "Elasticsearch部署完成"
}

# 部署Kibana
deploy_kibana() {
  log_info "部署Kibana..."
  
  helm upgrade --install kibana elastic/kibana \
    --namespace="$NAMESPACE" \
    --set elasticsearchHosts="http://elasticsearch-master:9200" \
    --set resources.requests.cpu=200m \
    --set resources.requests.memory=1Gi \
    --set resources.limits.cpu=500m \
    --set resources.limits.memory=1Gi \
    --set service.type=ClusterIP \
    --wait
  
  log_success "Kibana部署完成"
}

# 部署Fluentd
deploy_fluentd() {
  log_info "部署Fluentd..."
  
  helm upgrade --install fluentd fluent/fluentd \
    --namespace="$NAMESPACE" \
    --set image.repository=fluent/fluentd-kubernetes-daemonset \
    --set image.tag=v1.15-debian-elasticsearch7-1 \
    --set env[0].name=FLUENT_ELASTICSEARCH_HOST \
    --set env[0].value=elasticsearch-master \
    --set env[0].name=FLUENT_ELASTICSEARCH_PORT \
    --set env[0].value="9200" \
    --set configMapConfigs[0]=fluentd-config \
    --set resources.requests.cpu=100m \
    --set resources.requests.memory=200Mi \
    --set resources.limits.cpu=200m \
    --set resources.limits.memory=400Mi \
    --wait
  
  log_success "Fluentd部署完成"
}

# 部署Node Exporter
deploy_node_exporter() {
  log_info "部署Node Exporter..."
  
  helm upgrade --install node-exporter prometheus-community/prometheus-node-exporter \
    --namespace="$NAMESPACE" \
    --set hostRootFsMount.enabled=true \
    --set resources.requests.cpu=50m \
    --set resources.requests.memory=50Mi \
    --set resources.limits.cpu=100m \
    --set resources.limits.memory=100Mi \
    --wait
  
  log_success "Node Exporter部署完成"
}

# 部署Blackbox Exporter
deploy_blackbox_exporter() {
  log_info "部署Blackbox Exporter..."
  
  helm upgrade --install blackbox-exporter prometheus-community/prometheus-blackbox-exporter \
    --namespace="$NAMESPACE" \
    --set config.modules.http_2xx.prober=http \
    --set config.modules.http_2xx.timeout=5s \
    --set config.modules.tls_connect.prober=tcp \
    --set config.modules.tls_connect.tcp.tls=true \
    --set config.modules.dns_udp.prober=dns \
    --set config.modules.dns_udp.dns.protocol=udp \
    --wait
  
  log_success "Blackbox Exporter部署完成"
}

# 配置服务监控
configure_service_monitors() {
  log_info "配置服务监控..."
  
  # 为财务系统应用创建ServiceMonitor
  cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: financial-backend
  namespace: $NAMESPACE
  labels:
    app: prometheus
spec:
  selector:
    matchLabels:
      app: financial-backend
  namespaceSelector:
    matchNames:
    - production
    - staging
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
EOF

  cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: financial-frontend
  namespace: $NAMESPACE
  labels:
    app: prometheus
spec:
  selector:
    matchLabels:
      app: financial-frontend
  namespaceSelector:
    matchNames:
    - production
    - staging
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
EOF
  
  log_success "服务监控配置完成"
}

# 配置Ingress
configure_ingress() {
  log_info "配置Ingress..."
  
  # Grafana Ingress
  cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-ingress
  namespace: $NAMESPACE
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - monitoring.financial-system.com
    secretName: monitoring-tls
  rules:
  - host: monitoring.financial-system.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: prometheus-grafana
            port:
              number: 80
EOF

  # Prometheus Ingress
  cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: prometheus-ingress
  namespace: $NAMESPACE
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: prometheus-basic-auth
spec:
  tls:
  - hosts:
    - prometheus.financial-system.com
    secretName: prometheus-tls
  rules:
  - host: prometheus.financial-system.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: prometheus-kube-prometheus-prometheus
            port:
              number: 9090
EOF

  log_success "Ingress配置完成"
}

# 验证部署
verify_deployment() {
  log_info "验证部署状态..."
  
  # 等待所有Pod就绪
  kubectl wait --for=condition=ready pod -l "app.kubernetes.io/name in (prometheus,grafana,alertmanager)" \
    --namespace="$NAMESPACE" --timeout=300s
  
  # 检查服务状态
  local services=(
    "prometheus-kube-prometheus-prometheus"
    "prometheus-grafana"
    "prometheus-kube-prometheus-alertmanager"
    "elasticsearch-master"
    "kibana-kibana"
  )
  
  for service in "${services[@]}"; do
    if kubectl get service "$service" --namespace="$NAMESPACE" &> /dev/null; then
      log_success "服务 $service 部署成功"
    else
      log_error "服务 $service 部署失败"
    fi
  done
  
  # 显示访问信息
  log_info "部署完成！访问信息："
  echo -e "${GREEN}Grafana: https://monitoring.financial-system.com${NC}"
  echo -e "${GREEN}Prometheus: https://prometheus.financial-system.com${NC}"
  echo -e "${GREEN}Grafana管理员: admin / $GRAFANA_ADMIN_PASSWORD${NC}"
}

# 清理部署
cleanup_deployment() {
  log_warning "清理监控系统部署..."
  
  read -p "确定要删除监控系统吗？(y/N): " confirm
  if [[ $confirm =~ ^[Yy]$ ]]; then
    helm uninstall prometheus --namespace="$NAMESPACE" || true
    helm uninstall elasticsearch --namespace="$NAMESPACE" || true
    helm uninstall kibana --namespace="$NAMESPACE" || true
    helm uninstall fluentd --namespace="$NAMESPACE" || true
    helm uninstall node-exporter --namespace="$NAMESPACE" || true
    helm uninstall blackbox-exporter --namespace="$NAMESPACE" || true
    
    kubectl delete namespace "$NAMESPACE" || true
    
    log_success "监控系统清理完成"
  else
    log_info "取消清理操作"
  fi
}

# 显示帮助信息
show_help() {
  cat << EOF
监控系统部署脚本

用法: $0 [命名空间] [环境] [dry-run]

参数:
  命名空间    监控系统部署的命名空间 (默认: monitoring)
  环境        部署环境 (默认: production)
  dry-run     是否为演练模式 (默认: false)

环境变量:
  SMTP_PASSWORD       SMTP服务器密码
  SLACK_WEBHOOK_URL   Slack Webhook URL
  WEBHOOK_TOKEN       Webhook认证令牌
  GRAFANA_ADMIN_PASSWORD  Grafana管理员密码

示例:
  $0                          # 使用默认设置部署
  $0 monitoring staging       # 部署到staging环境
  $0 monitoring production true   # 演练模式

命令:
  cleanup                     # 清理部署
  help                       # 显示帮助
EOF
}

# 主函数
main() {
  case "${1:-deploy}" in
    cleanup)
      cleanup_deployment
      ;;
    help)
      show_help
      ;;
    deploy|*)
      echo -e "${BLUE}🚀 财务系统监控部署脚本${NC}"
      echo -e "${BLUE}命名空间: $NAMESPACE${NC}"
      echo -e "${BLUE}环境: $ENVIRONMENT${NC}"
      echo ""
      
      check_dependencies
      create_namespace
      add_helm_repos
      create_configmaps
      create_secrets
      deploy_prometheus
      deploy_elasticsearch
      deploy_kibana
      deploy_fluentd
      deploy_node_exporter
      deploy_blackbox_exporter
      configure_service_monitors
      configure_ingress
      verify_deployment
      
      log_success "✨ 监控系统部署完成！"
      ;;
  esac
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi