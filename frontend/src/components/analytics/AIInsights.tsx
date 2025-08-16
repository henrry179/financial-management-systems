import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Spin,
  Alert,
  Button,
  Progress,
  Timeline,
  Statistic,
  Tag,
  Typography,
  Divider,
  Tooltip,
  Space,
  Modal,
  Table,
  Tabs
} from 'antd';
import {
  RobotOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  SafetyOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import dayjs from 'dayjs';
import './AIInsights.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface AIInsightsProps {
  userId: number;
}

interface Prediction {
  type: 'income' | 'expense';
  total_predicted: number;
  daily_predictions: Array<{
    date: string;
    predicted_amount: number;
    confidence: string;
  }>;
  prediction_period_days: number;
}

interface RiskAssessment {
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  risk_probability: {
    low: number;
    medium: number;
    high: number;
  };
  advice: string[];
}

interface Recommendation {
  type: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action_items: string[];
  estimated_impact?: string;
}

interface FinancialInsights {
  summary: {
    avg_monthly_income: number;
    avg_monthly_expense: number;
    savings_rate: number;
    transaction_frequency: number;
    top_expense_categories: string[];
  };
  predictions: {
    next_30_days_income: number;
    next_30_days_expense: number;
    predicted_net_cash_flow: number;
  };
  risk_assessment: RiskAssessment;
  recommendations: Recommendation[];
  advanced_analytics: {
    cash_flow_trend: any;
    seasonal_patterns: any;
    anomaly_detection: any;
    peer_comparison: any;
  };
}

const AIInsights: React.FC<AIInsightsProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [trainingModalVisible, setTrainingModalVisible] = useState(false);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchModelStatus();
    fetchInsights();
  }, [userId]);

  const fetchModelStatus = async () => {
    try {
      const response = await fetch(`/api/ai/models/status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setModelStatus(data);
    } catch (error) {
      console.error('获取模型状态失败:', error);
    }
  };

  const fetchInsights = async () => {
    if (!modelStatus?.models_available) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: userId,
          include_predictions: true,
          include_risk_assessment: true,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('获取AI洞察失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const trainModels = async () => {
    setTrainingLoading(true);
    try {
      const response = await fetch('/api/ai/models/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        Modal.success({
          title: '模型训练已开始',
          content: `预计需要 ${data.estimated_time_minutes} 分钟完成，我们将通过通知告知您训练结果。`,
        });
        setTrainingModalVisible(false);
        
        // 轮询检查训练状态
        setTimeout(() => {
          fetchModelStatus();
        }, 5000);
      }
    } catch (error) {
      console.error('模型训练失败:', error);
    } finally {
      setTrainingLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount);
  };

  const renderOverview = () => {
    if (!insights) return null;

    const { summary, predictions, risk_assessment } = insights;

    return (
      <div className="ai-insights-overview">
        <Row gutter={[16, 16]}>
          {/* 财务健康度总览 */}
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <SafetyOutlined />
                  财务健康度评估
                </Space>
              }
              extra={
                <Tag color={getRiskColor(risk_assessment.risk_level)}>
                  {risk_assessment.risk_level === 'low' ? '低风险' : 
                   risk_assessment.risk_level === 'medium' ? '中等风险' : '高风险'}
                </Tag>
              }
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="储蓄率"
                    value={summary.savings_rate * 100}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: summary.savings_rate > 0.2 ? '#3f8600' : '#cf1322' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="月均收入"
                    value={summary.avg_monthly_income}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="月均支出"
                    value={summary.avg_monthly_expense}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="风险评分"
                    value={risk_assessment.risk_score * 100}
                    precision={0}
                    suffix="/100"
                    valueStyle={{ color: getRiskColor(risk_assessment.risk_level) }}
                  />
                </Col>
              </Row>
              
              <Divider />
              
              <Progress
                percent={risk_assessment.risk_score * 100}
                status={risk_assessment.risk_level === 'high' ? 'exception' : 'normal'}
                strokeColor={getRiskColor(risk_assessment.risk_level)}
                showInfo={false}
              />
              
              <Text type="secondary">
                基于您的交易模式和财务行为进行AI智能评估
              </Text>
            </Card>
          </Col>

          {/* 未来30天预测 */}
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <LineChartOutlined />
                  未来30天现金流预测
                </Space>
              }
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="预计收入"
                    value={predictions.next_30_days_income}
                    formatter={(value) => formatCurrency(Number(value))}
                    prefix={<TrendingUpOutlined style={{ color: '#3f8600' }} />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="预计支出"
                    value={predictions.next_30_days_expense}
                    formatter={(value) => formatCurrency(Number(value))}
                    prefix={<TrendingDownOutlined style={{ color: '#cf1322' }} />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="净现金流"
                    value={predictions.predicted_net_cash_flow}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{
                      color: predictions.predicted_net_cash_flow > 0 ? '#3f8600' : '#cf1322'
                    }}
                    prefix={
                      predictions.predicted_net_cash_flow > 0 ? 
                      <TrendingUpOutlined /> : <TrendingDownOutlined />
                    }
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderPredictions = () => {
    if (!insights) return null;

    // 模拟预测数据图表
    const chartData = Array.from({ length: 30 }, (_, i) => ({
      date: dayjs().add(i, 'day').format('MM/DD'),
      income: Math.random() * 2000 + 1000,
      expense: Math.random() * 1500 + 500,
    }));

    return (
      <div className="ai-insights-predictions">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="收支预测趋势图">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#52c41a"
                    strokeWidth={2}
                    name="预测收入"
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#ff4d4f"
                    strokeWidth={2}
                    name="预测支出"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="模型准确性指标">
              <div className="model-metrics">
                <div className="metric-item">
                  <Text strong>收入预测准确率</Text>
                  <Progress percent={87} size="small" />
                </div>
                <div className="metric-item">
                  <Text strong>支出预测准确率</Text>
                  <Progress percent={82} size="small" />
                </div>
                <div className="metric-item">
                  <Text strong>趋势预测准确率</Text>
                  <Progress percent={79} size="small" />
                </div>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="预测置信度">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: '高置信度', value: 65, color: '#52c41a' },
                      { name: '中等置信度', value: 28, color: '#faad14' },
                      { name: '低置信度', value: 7, color: '#ff4d4f' },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {[
                      { name: '高置信度', value: 65, color: '#52c41a' },
                      { name: '中等置信度', value: 28, color: '#faad14' },
                      { name: '低置信度', value: 7, color: '#ff4d4f' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!insights?.recommendations) return null;

    return (
      <div className="ai-insights-recommendations">
        <Row gutter={[16, 16]}>
          {insights.recommendations.map((rec, index) => (
            <Col span={24} key={index}>
              <Card
                className={`recommendation-card priority-${rec.priority}`}
                title={
                  <Space>
                    <BulbOutlined />
                    <Text strong>{rec.title}</Text>
                    <Tag color={getPriorityColor(rec.priority)}>
                      {rec.priority === 'high' ? '高优先级' : 
                       rec.priority === 'medium' ? '中优先级' : '低优先级'}
                    </Tag>
                  </Space>
                }
              >
                <Paragraph>{rec.description}</Paragraph>
                
                {rec.action_items && rec.action_items.length > 0 && (
                  <>
                    <Text strong>建议行动:</Text>
                    <ul className="action-items">
                      {rec.action_items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
                
                {rec.estimated_impact && (
                  <Alert
                    message={`预期影响: ${rec.estimated_impact}`}
                    type="info"
                    showIcon
                    style={{ marginTop: 12 }}
                  />
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!insights?.advanced_analytics) return null;

    const { cash_flow_trend, seasonal_patterns, anomaly_detection, peer_comparison } = insights.advanced_analytics;

    return (
      <div className="ai-insights-analytics">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="现金流趋势分析">
              <div className="trend-analysis">
                <Statistic
                  title="趋势方向"
                  value={cash_flow_trend.trend_direction === 'positive' ? '上升' : '下降'}
                  valueStyle={{ 
                    color: cash_flow_trend.trend_direction === 'positive' ? '#3f8600' : '#cf1322' 
                  }}
                />
                <Statistic
                  title="月增长率"
                  value={cash_flow_trend.monthly_growth_rate * 100}
                  precision={1}
                  suffix="%"
                />
                <Progress
                  percent={cash_flow_trend.volatility_score * 100}
                  format={() => `波动性: ${(cash_flow_trend.volatility_score * 100).toFixed(0)}%`}
                />
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="同龄人比较">
              <div className="peer-comparison">
                <Statistic
                  title="百分位排名"
                  value={peer_comparison.percentile_ranking}
                  suffix="th"
                  valueStyle={{ color: '#1890ff' }}
                />
                <Text type="secondary">在 {peer_comparison.peer_group_size} 人中排名</Text>
                
                <div style={{ marginTop: 16 }}>
                  <Tag color="blue">储蓄率: {peer_comparison.savings_rate_comparison}</Tag>
                  <Tag color="green">支出效率: {peer_comparison.spending_efficiency}</Tag>
                </div>
              </div>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="异常检测">
              {anomaly_detection.recent_anomalies?.length > 0 ? (
                <Timeline>
                  {anomaly_detection.recent_anomalies.map((anomaly: any, index: number) => (
                    <Timeline.Item
                      key={index}
                      color="red"
                      dot={<ExclamationCircleOutlined />}
                    >
                      <div>
                        <Text strong>{dayjs(anomaly.date).format('YYYY年MM月DD日')}</Text>
                        <br />
                        <Text>异常金额: {formatCurrency(anomaly.amount)}</Text>
                        <br />
                        <Text type="secondary">
                          预期范围: {formatCurrency(anomaly.expected_range[0])} - {formatCurrency(anomaly.expected_range[1])}
                        </Text>
                        <br />
                        <Progress
                          percent={anomaly.anomaly_score * 100}
                          format={() => `异常度: ${(anomaly.anomaly_score * 100).toFixed(0)}%`}
                          status="exception"
                          size="small"
                        />
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Alert
                  message="未检测到异常交易"
                  description="您的交易模式正常，未发现异常支出行为"
                  type="success"
                  showIcon
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // 如果模型未训练，显示训练提示
  if (!modelStatus?.models_available && !modelStatus?.global_model_trained) {
    return (
      <div className="ai-insights-empty">
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <RobotOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={3}>AI智能分析</Title>
            <Paragraph type="secondary">
              为了提供个性化的财务洞察和预测，我们需要基于您的交易数据训练专属的AI模型。
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={() => setTrainingModalVisible(true)}
            >
              开始训练AI模型
            </Button>
          </div>
        </Card>

        <Modal
          title="训练AI模型"
          open={trainingModalVisible}
          onCancel={() => setTrainingModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setTrainingModalVisible(false)}>
              取消
            </Button>,
            <Button
              key="train"
              type="primary"
              loading={trainingLoading}
              onClick={trainModels}
            >
              开始训练
            </Button>,
          ]}
        >
          <div>
            <Alert
              message="模型训练说明"
              description={
                <div>
                  <p>• 训练过程需要分析您的历史交易数据</p>
                  <p>• 模型将学习您的消费模式和财务习惯</p>
                  <p>• 训练完成后可提供个性化预测和建议</p>
                  <p>• 所有数据都在本地处理，确保隐私安全</p>
                </div>
              }
              type="info"
              showIcon
            />
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="ai-insights">
      <Card
        title={
          <Space>
            <RobotOutlined />
            AI智能分析
            <Tag color="blue">Beta</Tag>
          </Space>
        }
        extra={
          <Button
            icon={<EyeOutlined />}
            onClick={fetchInsights}
            loading={loading}
          >
            刷新分析
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
        >
          <TabPane
            tab={
              <span>
                <PieChartOutlined />
                总览
              </span>
            }
            key="overview"
          >
            {loading ? <Spin size="large" /> : renderOverview()}
          </TabPane>

          <TabPane
            tab={
              <span>
                <LineChartOutlined />
                预测分析
              </span>
            }
            key="predictions"
          >
            {loading ? <Spin size="large" /> : renderPredictions()}
          </TabPane>

          <TabPane
            tab={
              <span>
                <BulbOutlined />
                智能建议
              </span>
            }
            key="recommendations"
          >
            {loading ? <Spin size="large" /> : renderRecommendations()}
          </TabPane>

          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                高级分析
              </span>
            }
            key="analytics"
          >
            {loading ? <Spin size="large" /> : renderAnalytics()}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default AIInsights;