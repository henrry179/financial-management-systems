#!/usr/bin/env node

/**
 * 性能测试结果分析脚本
 * 分析k6测试输出的JSON结果，生成详细的性能报告
 */

const fs = require('fs');
const path = require('path');

// 颜色定义
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// 日志函数
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.cyan}${colors.bright}📊 ${msg}${colors.reset}`),
};

// 性能阈值配置
const thresholds = {
  responseTime: {
    excellent: 500,
    good: 1000,
    acceptable: 2000,
    poor: 5000,
  },
  errorRate: {
    excellent: 0.1,
    good: 1.0,
    acceptable: 5.0,
    poor: 10.0,
  },
  throughput: {
    excellent: 1000,
    good: 500,
    acceptable: 100,
    poor: 50,
  },
};

// 获取性能等级
function getPerformanceLevel(value, metric) {
  const threshold = thresholds[metric];
  if (!threshold) return 'unknown';

  if (metric === 'errorRate') {
    // 错误率越低越好
    if (value <= threshold.excellent) return 'excellent';
    if (value <= threshold.good) return 'good';
    if (value <= threshold.acceptable) return 'acceptable';
    if (value <= threshold.poor) return 'poor';
    return 'critical';
  } else {
    // 响应时间和吞吐量
    if (metric === 'responseTime') {
      // 响应时间越低越好
      if (value <= threshold.excellent) return 'excellent';
      if (value <= threshold.good) return 'good';
      if (value <= threshold.acceptable) return 'acceptable';
      if (value <= threshold.poor) return 'poor';
      return 'critical';
    } else if (metric === 'throughput') {
      // 吞吐量越高越好
      if (value >= threshold.excellent) return 'excellent';
      if (value >= threshold.good) return 'good';
      if (value >= threshold.acceptable) return 'acceptable';
      if (value >= threshold.poor) return 'poor';
      return 'critical';
    }
  }
}

// 获取等级颜色
function getLevelColor(level) {
  switch (level) {
    case 'excellent': return colors.green;
    case 'good': return colors.cyan;
    case 'acceptable': return colors.yellow;
    case 'poor': return colors.magenta;
    case 'critical': return colors.red;
    default: return colors.white;
  }
}

// 格式化数字
function formatNumber(num, decimals = 2) {
  if (typeof num !== 'number') return 'N/A';
  return num.toFixed(decimals);
}

// 格式化持续时间
function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// 分析HTTP指标
function analyzeHttpMetrics(data) {
  const metrics = data.metrics;
  
  if (!metrics.http_req_duration || !metrics.http_reqs) {
    log.error('Invalid metrics data: missing http_req_duration or http_reqs');
    return null;
  }

  const httpDuration = metrics.http_req_duration.values;
  const httpReqs = metrics.http_reqs.values;
  const httpReqFailed = metrics.http_req_failed?.values || { rate: 0 };

  return {
    totalRequests: httpReqs.count || 0,
    requestsPerSecond: httpReqs.rate || 0,
    averageResponseTime: httpDuration.avg || 0,
    medianResponseTime: httpDuration.med || 0,
    p90ResponseTime: httpDuration['p(90)'] || 0,
    p95ResponseTime: httpDuration['p(95)'] || 0,
    p99ResponseTime: httpDuration['p(99)'] || 0,
    minResponseTime: httpDuration.min || 0,
    maxResponseTime: httpDuration.max || 0,
    errorRate: (httpReqFailed.rate || 0) * 100,
    failedRequests: httpReqFailed.count || 0,
  };
}

// 分析自定义指标
function analyzeCustomMetrics(data) {
  const metrics = data.metrics;
  const customMetrics = {};

  // 登录指标
  if (metrics.login_duration) {
    customMetrics.login = {
      average: metrics.login_duration.values.avg || 0,
      p95: metrics.login_duration.values['p(95)'] || 0,
      count: metrics.login_duration.values.count || 0,
    };
  }

  // 交易指标
  if (metrics.transaction_duration) {
    customMetrics.transaction = {
      average: metrics.transaction_duration.values.avg || 0,
      p95: metrics.transaction_duration.values['p(95)'] || 0,
      count: metrics.transaction_duration.values.count || 0,
    };
  }

  // 错误指标
  if (metrics.errors) {
    customMetrics.errors = {
      rate: (metrics.errors.values.rate || 0) * 100,
      count: metrics.errors.values.count || 0,
    };
  }

  return customMetrics;
}

// 分析虚拟用户指标
function analyzeVirtualUsers(data) {
  const metrics = data.metrics;
  
  if (!metrics.vus || !metrics.vus_max) {
    return null;
  }

  return {
    current: metrics.vus.values.value || 0,
    max: metrics.vus_max.values.value || 0,
  };
}

// 生成性能评分
function generatePerformanceScore(httpMetrics, customMetrics) {
  let score = 100;
  const details = [];

  // 响应时间评分 (40%)
  const avgResponseLevel = getPerformanceLevel(httpMetrics.averageResponseTime, 'responseTime');
  const responseScore = {
    excellent: 40,
    good: 32,
    acceptable: 24,
    poor: 16,
    critical: 8,
  }[avgResponseLevel] || 0;
  score -= (40 - responseScore);
  details.push(`响应时间: ${avgResponseLevel} (${responseScore}/40分)`);

  // 错误率评分 (30%)
  const errorLevel = getPerformanceLevel(httpMetrics.errorRate, 'errorRate');
  const errorScore = {
    excellent: 30,
    good: 24,
    acceptable: 18,
    poor: 12,
    critical: 6,
  }[errorLevel] || 0;
  score -= (30 - errorScore);
  details.push(`错误率: ${errorLevel} (${errorScore}/30分)`);

  // 吞吐量评分 (30%)
  const throughputLevel = getPerformanceLevel(httpMetrics.requestsPerSecond, 'throughput');
  const throughputScore = {
    excellent: 30,
    good: 24,
    acceptable: 18,
    poor: 12,
    critical: 6,
  }[throughputLevel] || 0;
  score -= (30 - throughputScore);
  details.push(`吞吐量: ${throughputLevel} (${throughputScore}/30分)`);

  return {
    score: Math.max(0, score),
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    details,
  };
}

// 生成建议
function generateRecommendations(httpMetrics, customMetrics, score) {
  const recommendations = [];

  // 响应时间建议
  if (httpMetrics.averageResponseTime > thresholds.responseTime.acceptable) {
    recommendations.push({
      priority: 'high',
      category: '性能优化',
      issue: '平均响应时间过长',
      suggestion: '考虑优化数据库查询、增加缓存层、优化API逻辑',
      impact: '用户体验差，可能导致用户流失',
    });
  }

  // 错误率建议
  if (httpMetrics.errorRate > thresholds.errorRate.acceptable) {
    recommendations.push({
      priority: 'high',
      category: '稳定性',
      issue: '错误率过高',
      suggestion: '检查错误日志、修复bug、增强错误处理',
      impact: '系统稳定性差，影响业务正常运行',
    });
  }

  // 吞吐量建议
  if (httpMetrics.requestsPerSecond < thresholds.throughput.acceptable) {
    recommendations.push({
      priority: 'medium',
      category: '性能扩展',
      issue: '吞吐量不足',
      suggestion: '考虑水平扩展、负载均衡优化、资源配置调整',
      impact: '高并发时系统响应慢，用户体验下降',
    });
  }

  // P99响应时间建议
  if (httpMetrics.p99ResponseTime > httpMetrics.averageResponseTime * 3) {
    recommendations.push({
      priority: 'medium',
      category: '性能优化',
      issue: 'P99响应时间与平均值差距过大',
      suggestion: '检查慢查询、优化异常处理、调整超时配置',
      impact: '少数用户体验极差，影响整体满意度',
    });
  }

  // 自定义指标建议
  if (customMetrics.login && customMetrics.login.p95 > 1000) {
    recommendations.push({
      priority: 'medium',
      category: '用户体验',
      issue: '登录响应时间过长',
      suggestion: '优化认证流程、使用缓存、简化登录逻辑',
      impact: '用户登录体验差，可能影响用户留存',
    });
  }

  // 基于评分的总体建议
  if (score.score < 70) {
    recommendations.push({
      priority: 'high',
      category: '系统架构',
      issue: '整体性能评分较低',
      suggestion: '考虑系统架构升级、技术栈优化、基础设施改进',
      impact: '系统整体性能不达标，需要重点优化',
    });
  }

  return recommendations;
}

// 生成报告
function generateReport(data) {
  const httpMetrics = analyzeHttpMetrics(data);
  const customMetrics = analyzeCustomMetrics(data);
  const vuMetrics = analyzeVirtualUsers(data);
  
  if (!httpMetrics) {
    log.error('无法分析HTTP指标');
    return;
  }

  const score = generatePerformanceScore(httpMetrics, customMetrics);
  const recommendations = generateRecommendations(httpMetrics, customMetrics, score);

  // 输出报告
  console.log('\n');
  log.header('性能测试分析报告');
  console.log('='.repeat(60));

  // 测试概览
  console.log(`\n${colors.bright}📋 测试概览${colors.reset}`);
  console.log(`测试开始时间: ${new Date(data.state.testStarted).toLocaleString()}`);
  console.log(`测试持续时间: ${formatDuration(data.state.testRunDurationMs)}`);
  if (vuMetrics) {
    console.log(`最大虚拟用户: ${vuMetrics.max}`);
  }

  // 性能评分
  const gradeColor = getLevelColor(score.grade === 'A' ? 'excellent' : 
                                   score.grade === 'B' ? 'good' : 
                                   score.grade === 'C' ? 'acceptable' : 
                                   score.grade === 'D' ? 'poor' : 'critical');
  console.log(`\n${colors.bright}🏆 性能评分${colors.reset}`);
  console.log(`总分: ${gradeColor}${score.score.toFixed(0)}/100 (${score.grade}级)${colors.reset}`);
  score.details.forEach(detail => console.log(`  • ${detail}`));

  // HTTP指标
  console.log(`\n${colors.bright}🌐 HTTP请求指标${colors.reset}`);
  console.log(`总请求数: ${httpMetrics.totalRequests.toLocaleString()}`);
  console.log(`失败请求: ${httpMetrics.failedRequests.toLocaleString()}`);
  
  const errorColor = getLevelColor(getPerformanceLevel(httpMetrics.errorRate, 'errorRate'));
  console.log(`错误率: ${errorColor}${formatNumber(httpMetrics.errorRate, 2)}%${colors.reset}`);
  
  const throughputColor = getLevelColor(getPerformanceLevel(httpMetrics.requestsPerSecond, 'throughput'));
  console.log(`吞吐量: ${throughputColor}${formatNumber(httpMetrics.requestsPerSecond, 1)} 请求/秒${colors.reset}`);

  // 响应时间指标
  console.log(`\n${colors.bright}⏱️  响应时间指标${colors.reset}`);
  const avgColor = getLevelColor(getPerformanceLevel(httpMetrics.averageResponseTime, 'responseTime'));
  console.log(`平均响应时间: ${avgColor}${formatDuration(httpMetrics.averageResponseTime)}${colors.reset}`);
  console.log(`中位数响应时间: ${formatDuration(httpMetrics.medianResponseTime)}`);
  console.log(`90分位响应时间: ${formatDuration(httpMetrics.p90ResponseTime)}`);
  console.log(`95分位响应时间: ${formatDuration(httpMetrics.p95ResponseTime)}`);
  console.log(`99分位响应时间: ${formatDuration(httpMetrics.p99ResponseTime)}`);
  console.log(`最小响应时间: ${formatDuration(httpMetrics.minResponseTime)}`);
  console.log(`最大响应时间: ${formatDuration(httpMetrics.maxResponseTime)}`);

  // 自定义指标
  if (Object.keys(customMetrics).length > 0) {
    console.log(`\n${colors.bright}🎯 业务指标${colors.reset}`);
    
    if (customMetrics.login) {
      console.log(`登录平均时间: ${formatDuration(customMetrics.login.average)}`);
      console.log(`登录P95时间: ${formatDuration(customMetrics.login.p95)}`);
      console.log(`登录次数: ${customMetrics.login.count.toLocaleString()}`);
    }
    
    if (customMetrics.transaction) {
      console.log(`交易平均时间: ${formatDuration(customMetrics.transaction.average)}`);
      console.log(`交易P95时间: ${formatDuration(customMetrics.transaction.p95)}`);
      console.log(`交易次数: ${customMetrics.transaction.count.toLocaleString()}`);
    }
  }

  // 优化建议
  if (recommendations.length > 0) {
    console.log(`\n${colors.bright}💡 优化建议${colors.reset}`);
    recommendations.forEach((rec, index) => {
      const priorityColor = rec.priority === 'high' ? colors.red : 
                           rec.priority === 'medium' ? colors.yellow : colors.green;
      console.log(`\n${index + 1}. ${priorityColor}[${rec.priority.toUpperCase()}]${colors.reset} ${rec.category}`);
      console.log(`   问题: ${rec.issue}`);
      console.log(`   建议: ${rec.suggestion}`);
      console.log(`   影响: ${rec.impact}`);
    });
  }

  // 总结
  console.log(`\n${colors.bright}📝 总结${colors.reset}`);
  if (score.score >= 80) {
    log.success('系统性能表现良好，可以满足生产环境需求');
  } else if (score.score >= 60) {
    log.warning('系统性能一般，建议进行优化后再部署到生产环境');
  } else {
    log.error('系统性能不达标，需要进行重大优化才能用于生产环境');
  }

  console.log('='.repeat(60));
  console.log('\n');
}

// 保存详细报告到文件
function saveDetailedReport(data, outputPath) {
  const httpMetrics = analyzeHttpMetrics(data);
  const customMetrics = analyzeCustomMetrics(data);
  const score = generatePerformanceScore(httpMetrics, customMetrics);
  const recommendations = generateRecommendations(httpMetrics, customMetrics, score);

  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      testDuration: data.state.testRunDurationMs,
      testStarted: data.state.testStarted,
    },
    performance: {
      score: score.score,
      grade: score.grade,
      details: score.details,
    },
    metrics: {
      http: httpMetrics,
      custom: customMetrics,
      virtualUsers: analyzeVirtualUsers(data),
    },
    recommendations,
    rawData: data,
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  log.success(`详细报告已保存到: ${outputPath}`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log.error('请提供k6测试结果文件路径');
    console.log('用法: node analyze-performance.js <results.json> [output.json]');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace('.json', '-analysis.json');

  if (!fs.existsSync(inputFile)) {
    log.error(`文件不存在: ${inputFile}`);
    process.exit(1);
  }

  try {
    log.info(`正在分析性能测试结果: ${inputFile}`);
    
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const data = JSON.parse(rawData);

    generateReport(data);
    saveDetailedReport(data, outputFile);

  } catch (error) {
    log.error(`分析失败: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  analyzeHttpMetrics,
  analyzeCustomMetrics,
  generatePerformanceScore,
  generateRecommendations,
};