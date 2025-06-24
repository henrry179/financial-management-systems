import React, { useMemo } from 'react';
import { Card, Row, Col, Button, Space, Typography, Alert, Progress, Statistic, Timeline } from 'antd';
import { 
  BellOutlined,
  TrophyOutlined,
  RocketOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  StarOutlined,
  SafetyOutlined,
  BulbOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { DashboardProps } from './types';

const { Title, Text } = Typography;

const GuanYuanStyleDashboard: React.FC<DashboardProps> = ({ 
  data, 
  title = '智能财务决策中心',
  theme = 'light',
  height = 360 
}) => {
  // 观远数据配色方案
  const guanyuanColors = [
    '#722ed1', '#13c2c2', '#fa8c16', '#f5222d', '#52c41a',
    '#1890ff', '#eb2f96', '#fadb14', '#a0d911', '#2f54eb'
  ];

  // 智能预警数据
  const alertData = [
    { type: 'warning', message: '本月支出已超预算15%，建议控制可选消费', time: '2小时前' },
    { type: 'success', message: '投资收益率达到8.5%，超过预期目标', time: '1天前' },
    { type: 'info', message: '检测到异常大额支出，请确认交易安全', time: '2天前' }
  ];

  // 业务指标卡片
  const businessMetrics = [
    { 
      title: '财务健康度', 
      value: 85, 
      suffix: '分',
      icon: <HeartOutlined style={{ color: '#52c41a' }} />,
      trend: '+5.2%',
      status: 'good'
    },
    { 
      title: '投资效率', 
      value: 78, 
      suffix: '分',
      icon: <RocketOutlined style={{ color: '#1890ff' }} />,
      trend: '+12.8%',
      status: 'good'
    },
    { 
      title: '风险控制', 
      value: 92, 
      suffix: '分',
      icon: <SafetyOutlined style={{ color: '#722ed1' }} />,
      trend: '+3.1%',
      status: 'excellent'
    },
    { 
      title: '成长潜力', 
      value: 74, 
      suffix: '分',
      icon: <TrophyOutlined style={{ color: '#fa8c16' }} />,
      trend: '+8.9%',
      status: 'good'
    }
  ];

  // 智能洞察雷达图 - 观远风格
  const insightRadarOption = useMemo(() => ({
    backgroundColor: '#ffffff',
    title: {
      text: '智能财务洞察雷达',
      left: 20,
      top: 15,
      textStyle: {
        color: '#262626',
        fontSize: 16,
        fontWeight: '600'
      }
    },
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: '#d9d9d9',
      borderWidth: 1,
      textStyle: {
        color: '#262626'
      }
    },
    radar: {
      center: ['50%', '55%'],
      radius: '65%',
      indicator: [
        { name: '收入稳定性', max: 100 },
        { name: '支出合理性', max: 100 },
        { name: '投资收益率', max: 100 },
        { name: '储蓄增长率', max: 100 },
        { name: '风险控制力', max: 100 },
        { name: '理财规划度', max: 100 }
      ],
      name: {
        textStyle: {
          color: '#595959',
          fontSize: 12
        }
      },
      axisLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(114, 46, 209, 0.1)', 'rgba(255, 255, 255, 0.5)']
        }
      }
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#722ed1'
        },
        areaStyle: {
          color: 'rgba(114, 46, 209, 0.2)'
        },
        lineStyle: {
          width: 3,
          color: '#722ed1'
        },
        data: [
          {
            value: [85, 78, 82, 76, 88, 79],
            name: '当前财务状况'
          }
        ]
      }
    ]
  }), []);

  // 收益趋势预测 - 观远风格
  const profitTrendOption = useMemo(() => ({
    color: guanyuanColors,
    backgroundColor: '#ffffff',
    title: {
      text: '收益趋势与预测',
      left: 20,
      top: 15,
      textStyle: {
        color: '#262626',
        fontSize: 16,
        fontWeight: '600'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#d9d9d9',
      borderWidth: 1,
      textStyle: {
        color: '#262626'
      }
    },
    legend: {
      data: ['实际收益', '预测收益', '目标收益'],
      top: 45,
      left: 20,
      textStyle: {
        color: '#595959'
      }
    },
    grid: {
      left: '8%',
      right: '8%',
      bottom: '15%',
      top: '25%'
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月'],
      axisLine: {
        lineStyle: {
          color: '#d9d9d9'
        }
      },
      axisLabel: {
        color: '#8c8c8c'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#8c8c8c'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '实际收益',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        },
        data: [15, 23, 18, 28, 22, 35, 30, 38, 32]
      },
      {
        name: '预测收益',
        type: 'line',
        smooth: true,
        symbol: 'diamond',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          type: 'dashed'
        },
        data: [null, null, null, null, null, null, 35, 42, 38, 45, 48, 52]
      },
      {
        name: '目标收益',
        type: 'line',
        smooth: true,
        symbol: 'triangle',
        symbolSize: 8,
        lineStyle: {
          width: 2,
          type: 'dotted'
        },
        data: [20, 25, 22, 30, 28, 38, 35, 42, 40, 47, 50, 55]
      }
    ]
  }), []);

  // 消费行为热力图 - 观远风格
  const heatmapOption = useMemo(() => ({
    backgroundColor: '#ffffff',
    title: {
      text: '消费行为热力分析',
      left: 20,
      top: 15,
      textStyle: {
        color: '#262626',
        fontSize: 16,
        fontWeight: '600'
      }
    },
    tooltip: {
      position: 'top',
      backgroundColor: '#ffffff',
      borderColor: '#d9d9d9',
      borderWidth: 1,
      textStyle: {
        color: '#262626'
      }
    },
    grid: {
      height: '60%',
      top: '20%',
      left: '10%',
      right: '10%'
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      splitArea: {
        show: true
      },
      axisLabel: {
        color: '#8c8c8c'
      }
    },
    yAxis: {
      type: 'category',
      data: ['餐饮', '购物', '交通', '娱乐', '医疗', '教育'],
      splitArea: {
        show: true
      },
      axisLabel: {
        color: '#8c8c8c'
      }
    },
    visualMap: {
      min: 0,
      max: 1000,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#ffffff', '#722ed1']
      }
    },
    series: [
      {
        type: 'heatmap',
        data: [
          [0, 0, 300], [0, 1, 200], [0, 2, 150], [0, 3, 400], [0, 4, 100], [0, 5, 80],
          [1, 0, 250], [1, 1, 180], [1, 2, 200], [1, 3, 300], [1, 4, 120], [1, 5, 90],
          [2, 0, 280], [2, 1, 220], [2, 2, 180], [2, 3, 350], [2, 4, 110], [2, 5, 95],
          [3, 0, 320], [3, 1, 240], [3, 2, 160], [3, 3, 380], [3, 4, 130], [3, 5, 85],
          [4, 0, 290], [4, 1, 210], [4, 2, 170], [4, 3, 420], [4, 4, 140], [4, 5, 100],
          [5, 0, 450], [5, 1, 380], [5, 2, 200], [5, 3, 600], [5, 4, 80], [5, 5, 150],
          [6, 0, 400], [6, 1, 350], [6, 2, 180], [6, 3, 550], [6, 4, 90], [6, 5, 120]
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }), []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 观远数据风格头部 */}
      <Card 
        bordered={false}
        style={{ 
          marginBottom: '20px', 
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #722ed1 0%, #13c2c2 100%)',
          boxShadow: '0 4px 20px rgba(114, 46, 209, 0.3)'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0, color: '#ffffff' }}>
              <BulbOutlined style={{ marginRight: 8 }} />
              {title}
            </Title>
            <Text style={{ color: '#ffffff', opacity: 0.9 }}>
              观远数据智能分析 • AI驱动的财务洞察平台
            </Text>
          </Col>
          <Col>
            <Space size="large">
              <Button 
                type="primary" 
                icon={<ThunderboltOutlined />}
                style={{ backgroundColor: '#ffffff', color: '#722ed1', border: 'none' }}
              >
                智能分析
              </Button>
              <Button 
                icon={<BellOutlined />} 
                style={{ backgroundColor: 'transparent', color: '#ffffff', border: '1px solid #ffffff' }}
              >
                预警中心
              </Button>
              <Button 
                icon={<StarOutlined />} 
                style={{ backgroundColor: 'transparent', color: '#ffffff', border: '1px solid #ffffff' }}
              >
                收藏
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 智能预警区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Card 
            title={
              <span>
                <BellOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                智能预警中心
              </span>
            }
            bordered={false}
            style={{ borderRadius: '8px' }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <Row gutter={[16, 16]}>
              {alertData.map((alert, index) => (
                <Col xs={24} lg={8} key={index}>
                  <Alert
                    message={alert.message}
                    description={alert.time}
                    type={alert.type as any}
                    showIcon
                    style={{ borderRadius: '6px' }}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 业务指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        {businessMetrics.map((metric, index) => (
          <Col xs={12} lg={6} key={index}>
            <Card 
              bordered={false}
              style={{ 
                borderRadius: '8px',
                background: metric.status === 'excellent' ? 
                  'linear-gradient(135deg, #722ed1 0%, #9254de 100%)' : 
                  '#ffffff'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic
                title={
                  <span style={{ 
                    color: metric.status === 'excellent' ? '#ffffff' : '#8c8c8c', 
                    fontSize: '14px' 
                  }}>
                    {metric.icon} {metric.title}
                  </span>
                }
                value={metric.value}
                suffix={metric.suffix}
                valueStyle={{ 
                  color: metric.status === 'excellent' ? '#ffffff' : '#262626', 
                  fontSize: '28px', 
                  fontWeight: 'bold' 
                }}
              />
              <div style={{ marginTop: '8px' }}>
                <Progress 
                  percent={metric.value} 
                  showInfo={false} 
                  strokeColor={metric.status === 'excellent' ? '#ffffff' : '#722ed1'}
                  trailColor={metric.status === 'excellent' ? 'rgba(255,255,255,0.3)' : '#f0f0f0'}
                  size="small"
                />
                <Text style={{ 
                  color: metric.status === 'excellent' ? 'rgba(255,255,255,0.8)' : '#13c2c2', 
                  fontSize: '12px' 
                }}>
                  ↗ {metric.trend} 环比上升
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 主要图表区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card 
            bordered={false} 
            style={{ borderRadius: '8px' }}
            bodyStyle={{ padding: '16px' }}
          >
            <ReactECharts 
              option={insightRadarOption} 
              style={{ height: `${height}px` }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card 
            bordered={false} 
            style={{ borderRadius: '8px' }}
            bodyStyle={{ padding: '16px' }}
          >
            <ReactECharts 
              option={profitTrendOption} 
              style={{ height: `${height}px` }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card 
            bordered={false} 
            style={{ borderRadius: '8px' }}
            bodyStyle={{ padding: '16px' }}
          >
            <ReactECharts 
              option={heatmapOption} 
              style={{ height: `${height * 0.8}px` }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 观远风格的页脚信息 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        backgroundColor: '#ffffff', 
        borderRadius: '8px',
        borderLeft: '4px solid #722ed1'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>
              Powered by 观远数据 • AI智能分析引擎 • 数据更新: {new Date().toLocaleString('zh-CN')}
            </Text>
          </Col>
          <Col>
            <Timeline size="small" mode="horizontal">
              <Timeline.Item color="#722ed1">数据采集</Timeline.Item>
              <Timeline.Item color="#13c2c2">智能分析</Timeline.Item>
              <Timeline.Item color="#fa8c16">洞察生成</Timeline.Item>
              <Timeline.Item color="#52c41a">决策支持</Timeline.Item>
            </Timeline>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default GuanYuanStyleDashboard; 