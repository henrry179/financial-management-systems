import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');
const loginTrend = new Trend('login_duration');
const transactionTrend = new Trend('transaction_duration');

// 测试配置
export const options = {
  stages: [
    // 预热阶段
    { duration: '2m', target: 10 },
    // 负载递增阶段
    { duration: '5m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '5m', target: 200 },
    // 高负载持续阶段
    { duration: '10m', target: 200 },
    // 压力测试阶段
    { duration: '3m', target: 300 },
    { duration: '2m', target: 400 },
    // 降载阶段
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // 响应时间阈值
    http_req_duration: ['p(95)<2000'], // 95% 的请求要在 2s 内完成
    http_req_duration: ['p(99)<5000'], // 99% 的请求要在 5s 内完成
    // 错误率阈值
    errors: ['rate<0.05'], // 错误率要低于 5%
    // 特定接口的响应时间
    login_duration: ['p(95)<1000'], // 登录接口 95% 在 1s 内
    transaction_duration: ['p(95)<1500'], // 交易接口 95% 在 1.5s 内
  },
};

// 测试数据
const BASE_URL = __ENV.BASE_URL || 'https://staging.financial-system.com';
const API_URL = `${BASE_URL}/api/v1`;

const testUsers = [
  { email: 'test1@example.com', password: 'Test123456!' },
  { email: 'test2@example.com', password: 'Test123456!' },
  { email: 'test3@example.com', password: 'Test123456!' },
  { email: 'test4@example.com', password: 'Test123456!' },
  { email: 'test5@example.com', password: 'Test123456!' },
];

const transactionTypes = ['income', 'expense'];
const categories = ['salary', 'food', 'transport', 'entertainment', 'utilities'];

// 辅助函数
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomAmount() {
  return Math.floor(Math.random() * 1000) + 1;
}

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// 用户登录
function login() {
  const user = randomChoice(testUsers);
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const loginStart = Date.now();
  const loginResponse = http.post(
    `${API_URL}/auth/login`,
    loginPayload,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  const loginDuration = Date.now() - loginStart;
  loginTrend.add(loginDuration);

  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token && body.token.length > 0;
      } catch (e) {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    errorRate.add(1);
    return null;
  }

  try {
    const loginData = JSON.parse(loginResponse.body);
    return loginData.token;
  } catch (e) {
    errorRate.add(1);
    return null;
  }
}

// 获取用户信息
function getUserProfile(token) {
  const response = http.get(`${API_URL}/auth/profile`, {
    headers: getAuthHeaders(token),
  });

  const success = check(response, {
    'profile status is 200': (r) => r.status === 200,
    'profile has user data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.user && body.user.id;
      } catch (e) {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
  }

  return response;
}

// 获取交易列表
function getTransactions(token) {
  const params = {
    page: Math.floor(Math.random() * 5) + 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  const queryString = Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const response = http.get(`${API_URL}/transactions?${queryString}`, {
    headers: getAuthHeaders(token),
  });

  const success = check(response, {
    'transactions status is 200': (r) => r.status === 200,
    'transactions response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch (e) {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
  }

  return response;
}

// 创建交易
function createTransaction(token) {
  const transactionPayload = JSON.stringify({
    type: randomChoice(transactionTypes),
    amount: randomAmount(),
    description: `Performance test transaction ${Date.now()}`,
    category: randomChoice(categories),
    date: new Date().toISOString(),
  });

  const transactionStart = Date.now();
  const response = http.post(
    `${API_URL}/transactions`,
    transactionPayload,
    {
      headers: getAuthHeaders(token),
    }
  );
  const transactionDuration = Date.now() - transactionStart;
  transactionTrend.add(transactionDuration);

  const success = check(response, {
    'create transaction status is 201': (r) => r.status === 201,
    'create transaction response has id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.id;
      } catch (e) {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
  }

  return response;
}

// 获取仪表板数据
function getDashboard(token) {
  const response = http.get(`${API_URL}/dashboard/summary`, {
    headers: getAuthHeaders(token),
  });

  const success = check(response, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard has summary data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.summary && typeof body.summary.totalIncome === 'number';
      } catch (e) {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
  }

  return response;
}

// 获取报告数据
function getReports(token) {
  const response = http.get(`${API_URL}/reports/monthly`, {
    headers: getAuthHeaders(token),
  });

  const success = check(response, {
    'reports status is 200': (r) => r.status === 200,
  });

  if (!success) {
    errorRate.add(1);
  }

  return response;
}

// 搜索交易
function searchTransactions(token) {
  const searchPayload = JSON.stringify({
    query: 'test',
    dateFrom: '2024-01-01',
    dateTo: new Date().toISOString().split('T')[0],
    categories: [randomChoice(categories)],
  });

  const response = http.post(
    `${API_URL}/transactions/search`,
    searchPayload,
    {
      headers: getAuthHeaders(token),
    }
  );

  const success = check(response, {
    'search status is 200': (r) => r.status === 200,
  });

  if (!success) {
    errorRate.add(1);
  }

  return response;
}

// 主测试函数
export default function () {
  // 1. 用户登录
  const token = login();
  if (!token) {
    return;
  }

  sleep(1);

  // 2. 获取用户信息 (10% 概率)
  if (Math.random() < 0.1) {
    getUserProfile(token);
    sleep(0.5);
  }

  // 3. 获取仪表板数据 (80% 概率)
  if (Math.random() < 0.8) {
    getDashboard(token);
    sleep(1);
  }

  // 4. 获取交易列表 (90% 概率)
  if (Math.random() < 0.9) {
    getTransactions(token);
    sleep(1);
  }

  // 5. 创建交易 (30% 概率)
  if (Math.random() < 0.3) {
    createTransaction(token);
    sleep(1);
  }

  // 6. 搜索交易 (20% 概率)
  if (Math.random() < 0.2) {
    searchTransactions(token);
    sleep(1);
  }

  // 7. 获取报告 (15% 概率)
  if (Math.random() < 0.15) {
    getReports(token);
    sleep(1);
  }

  // 随机等待时间，模拟真实用户行为
  sleep(Math.random() * 3 + 1);
}

// 设置函数 - 在测试开始前执行
export function setup() {
  console.log('Performance test setup...');
  
  // 健康检查
  const healthResponse = http.get(`${BASE_URL}/health`);
  const isHealthy = check(healthResponse, {
    'application is healthy': (r) => r.status === 200,
  });

  if (!isHealthy) {
    throw new Error('Application is not healthy, aborting test');
  }

  return { baseUrl: BASE_URL };
}

// 清理函数 - 在测试结束后执行
export function teardown(data) {
  console.log('Performance test teardown...');
  console.log(`Test completed for: ${data.baseUrl}`);
}

// 处理汇总统计
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_duration: data.state.testRunDurationMs,
    total_requests: data.metrics.http_reqs.values.count,
    failed_requests: data.metrics.http_req_failed.values.count,
    error_rate: data.metrics.http_req_failed.values.rate,
    avg_response_time: data.metrics.http_req_duration.values.avg,
    p95_response_time: data.metrics.http_req_duration.values['p(95)'],
    p99_response_time: data.metrics.http_req_duration.values['p(99)'],
    max_response_time: data.metrics.http_req_duration.values.max,
    requests_per_second: data.metrics.http_reqs.values.rate,
    virtual_users: data.metrics.vus.values.value,
    max_virtual_users: data.metrics.vus_max.values.value,
  };

  // 输出到文件
  return {
    'performance-summary.json': JSON.stringify(summary, null, 2),
    stdout: `
📊 Performance Test Summary
================================
🕐 Test Duration: ${(data.state.testRunDurationMs / 1000 / 60).toFixed(2)} minutes
📈 Total Requests: ${data.metrics.http_reqs.values.count}
❌ Failed Requests: ${data.metrics.http_req_failed.values.count}
📉 Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
⏱️  Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
📊 95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
📊 99th Percentile: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
🚀 Requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}
👥 Max Virtual Users: ${data.metrics.vus_max.values.value}
================================
    `,
  };
}