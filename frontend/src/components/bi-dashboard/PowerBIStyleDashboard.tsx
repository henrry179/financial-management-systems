import React, { useMemo } from 'react';
import { Card, Row, Col, Button, Space, Typography, Statistic, Progress, Badge } from 'antd';
import { 
  PlayCircleOutlined, 
  SyncOutlined, 
  ShareAltOutlined,
  QuestionCircleOutlined,
  FilterOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { DashboardProps } from './types';

const { Title, Text } = Typography;

const PowerBIStyleDashboard: React.FC<DashboardProps> = ({ 
  data, 
  title = 'Financial Intelligence Dashboard',
  theme = 'light',
  height = 380 
}) => {
  // Power BI 配色方案
  const powerBIColors = [
    '#106ebe', '#f2c811', '#e74c3c', '#2ecc71', '#9b59b6',
    '#34495e', '#f39c12', '#1abc9c', '#e67e22', '#3498db'
  ];

  // KPI卡片数据
  const kpiData = [
    { title: '总收入', value: 325000, prefix: '¥', trend: 12.5, status: 'up' },
    { title: '总支出', value: 198000, prefix: '¥', trend: -3.2, status: 'down' },
    { title: '净收益', value: 127000, prefix: '¥', trend: 8.9, status: 'up' },
    { title: '储蓄率', value: 39.1, suffix: '%', trend: 2.1, status: 'up' }
  ];

  // 月度趋势图表 - Power BI风格
  const monthlyTrendOption = useMemo(() => ({
    color: powerBIColors,
    backgroundColor: '#faf9f8',
    title: {
      text: 'Monthly Financial Trends',
      left: 20,
      top: 15,
      textStyle: {
        color: '#323130',
        fontSize: 16,
        fontWeight: '600'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#d1d1d1',
      borderWidth: 1,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      textStyle: {
        color: '#323130'
      }
    },
    legend: {
      data: ['收入', '支出', '净收益'],
      top: 50,
      left: 20,
      textStyle: {
        color: '#323130'
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
      data: ['一月', '二月', '三月', '四月', '五月', '六月'],
      axisLine: {
        lineStyle: {
          color: '#d1d1d1'
        }
      },
      axisLabel: {
        color: '#605e5c'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#605e5c'
      },
      splitLine: {
        lineStyle: {
          color: '#f3f2f1'
        }
      }
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        barWidth: '25%',
        itemStyle: {
          borderRadius: [2, 2, 0, 0]
        },
        data: [52000, 48000, 55000, 61000, 58000, 64000]
      },
      {
        name: '支出',
        type: 'bar',
        barWidth: '25%',
        itemStyle: {
          borderRadius: [2, 2, 0, 0]
        },
        data: [32000, 35000, 31000, 38000, 33000, 36000]
      },
      {
        name: '净收益',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        },
        data: [20000, 13000, 24000, 23000, 25000, 28000]
      }
    ]
  }), []);

  // 分类支出环形图 - Power BI风格
  const categoryDonutOption = useMemo(() => ({
    color: powerBIColors,
    backgroundColor: '#faf9f8',
    title: {
      text: 'Expense Categories',
      left: 20,
      top: 15,
      textStyle: {
        color: '#323130',
        fontSize: 16,
        fontWeight: '600'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: '#ffffff',
      borderColor: '#d1d1d1',
      borderWidth: 1,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      textStyle: {
        color: '#323130'
      }
    },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'middle',
      textStyle: {
        color: '#323130'
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['40%', '55%'],
        itemStyle: {
          borderRadius: 8,
          borderColor: '#faf9f8',
          borderWidth: 3
        },
        label: {
          show: false
        },
        data: [
          { value: 35000, name: '住房' },
          { value: 18000, name: '餐饮' },
          { value: 12000, name: '交通' },
          { value: 8000, name: '娱乐' },
          { value: 15000, name: '购物' },
          { value: 10000, name: '其他' }
        ]
      }
    ]
  }), []);

  // 预算执行仪表盘
  const budgetGaugeOption = useMemo(() => ({
    backgroundColor: '#faf9f8',
    title: {
      text: 'Budget Execution',
      left: 20,
      top: 15,
      textStyle: {
        color: '#323130',
        fontSize: 16,
        fontWeight: '600'
      }
    },
    series: [
      {
        type: 'gauge',
        center: ['50%', '60%'],
        startAngle: 200,
        endAngle: -40,
        min: 0,
        max: 100,
        splitNumber: 5,
        itemStyle: {
          color: '#106ebe'
        },
        progress: {
          show: true,
          width: 30
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 30,
            color: [
              [0.3, '#e74c3c'],
              [0.7, '#f2c811'],
              [1, '#2ecc71']
            ]
          }
        },
        axisTick: {
          distance: -45,
          splitNumber: 5,
          lineStyle: {
            width: 2,
            color: '#323130'
          }
        },
        axisLabel: {
          distance: -20,
          color: '#323130',
          fontSize: 12
        },
        anchor: {
          show: false
        },
        title: {
          show: false
        },
        detail: {
          valueAnimation: true,
          width: '60%',
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, '-15%'],
          fontSize: 20,
          fontWeight: 'bold',
          formatter: '{value}%',
          color: 'inherit'
        },
        data: [{ value: 73.6 }]
      }
    ]
  }), []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f3f2f1', minHeight: '100vh' }}>
      {/* Power BI 风格头部 */}
      <Card 
        bordered={false}
        style={{ 
          marginBottom: '20px', 
          borderRadius: '4px',
          background: 'linear-gradient(135deg, #106ebe 0%, #f2c811 100%)'
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0, color: '#ffffff' }}>
              {title}
            </Title>
            <Text style={{ color: '#ffffff', opacity: 0.9 }}>
              Power BI Intelligence • Real-time Analytics
            </Text>
          </Col>
          <Col>
            <Space size="large">
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                style={{ backgroundColor: '#ffffff', color: '#106ebe', border: 'none' }}
              >
                Play
              </Button>
              <Button 
                icon={<SyncOutlined />} 
                style={{ backgroundColor: 'transparent', color: '#ffffff', border: '1px solid #ffffff' }}
              >
                Refresh
              </Button>
              <Button 
                icon={<ShareAltOutlined />} 
                style={{ backgroundColor: 'transparent', color: '#ffffff', border: '1px solid #ffffff' }}
              >
                Share
              </Button>
              <Button 
                icon={<FilterOutlined />} 
                style={{ backgroundColor: 'transparent', color: '#ffffff', border: '1px solid #ffffff' }}
              >
                Filter
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* KPI 指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        {kpiData.map((item, index) => (
          <Col xs={12} lg={6} key={index}>
            <Card 
              bordered={false}
              style={{ borderRadius: '4px' }}
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic
                title={
                  <span style={{ color: '#605e5c', fontSize: '14px' }}>
                    {item.title}
                  </span>
                }
                value={item.value}
                precision={item.suffix === '%' ? 1 : 0}
                prefix={item.prefix}
                suffix={item.suffix}
                valueStyle={{ 
                  color: '#323130', 
                  fontSize: '24px', 
                  fontWeight: '600' 
                }}
              />
              <div style={{ marginTop: '8px' }}>
                <Badge 
                  status={item.status === 'up' ? 'success' : 'error'}
                  text={
                    <span style={{ color: '#605e5c', fontSize: '12px' }}>
                      {item.status === 'up' ? '↗' : '↘'} {Math.abs(item.trend)}% vs last period
                    </span>
                  }
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 主要图表区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            bordered={false} 
            style={{ borderRadius: '4px' }}
            bodyStyle={{ padding: '16px' }}
          >
            <ReactECharts 
              option={monthlyTrendOption} 
              style={{ height: `${height}px` }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Row gutter={[0, 16]}>
            <Col span={24}>
              <Card 
                bordered={false} 
                style={{ borderRadius: '4px' }}
                bodyStyle={{ padding: '16px' }}
              >
                <ReactECharts 
                  option={categoryDonutOption} 
                  style={{ height: `${height * 0.6}px` }}
                  opts={{ renderer: 'svg' }}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card 
                bordered={false} 
                style={{ borderRadius: '4px' }}
                bodyStyle={{ padding: '16px' }}
              >
                <ReactECharts 
                  option={budgetGaugeOption} 
                  style={{ height: `${height * 0.5}px` }}
                  opts={{ renderer: 'svg' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Power BI 风格的页脚信息 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        backgroundColor: '#ffffff', 
        borderRadius: '4px',
        borderLeft: '4px solid #106ebe'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text style={{ color: '#605e5c', fontSize: '12px' }}>
              Powered by Power BI Analytics Engine • Last updated: {new Date().toLocaleString()}
            </Text>
          </Col>
          <Col>
            <Space>
              <QuestionCircleOutlined style={{ color: '#106ebe', cursor: 'pointer' }} />
              <Text style={{ color: '#605e5c', fontSize: '12px' }}>Need help?</Text>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PowerBIStyleDashboard; 