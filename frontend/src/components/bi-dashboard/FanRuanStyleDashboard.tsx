import React, { useMemo } from 'react';
import { Card, Row, Col, Button, Space, Typography, Tabs, Tag, Dropdown, Menu } from 'antd';
import { 
  BarChartOutlined, 
  PieChartOutlined,
  LineChartOutlined,
  DotChartOutlined,
  SettingOutlined,
  ExportOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { DashboardProps } from './types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const FanRuanStyleDashboard: React.FC<DashboardProps> = ({ 
  data, 
  title = '财务数据分析中心',
  theme = 'light',
  height = 350 
}) => {
  // 帆软FineBI 配色方案
  const fanruanColors = [
    '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399',
    '#c71c60', '#722ed1', '#fa8c16', '#13c2c2', '#52c41a'
  ];

  // 操作菜单
  const operationMenu = (
    <Menu>
      <Menu.Item key="export" icon={<ExportOutlined />}>导出报表</Menu.Item>
      <Menu.Item key="print" icon={<ExportOutlined />}>打印报表</Menu.Item>
      <Menu.Item key="schedule" icon={<ReloadOutlined />}>定时刷新</Menu.Item>
      <Menu.Item key="share" icon={<EyeOutlined />}>分享链接</Menu.Item>
    </Menu>
  );

  // 收支对比分析 - 帆软风格
  const incomeExpenseOption = useMemo(() => ({
    color: fanruanColors,
    backgroundColor: '#f5f7fa',
    title: {
      text: '收支对比分析',
      left: 20,
      top: 15,
      textStyle: {
        color: '#303133',
        fontSize: 16,
        fontWeight: '600'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: {
        color: '#303133'
      },
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    legend: {
      data: ['收入', '支出', '净利润'],
      top: 45,
      left: 20,
      textStyle: {
        color: '#606266'
      }
    },
    grid: {
      left: '8%',
      right: '8%',
      bottom: '15%',
      top: '25%'
    },
    xAxis: [
      {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        axisPointer: {
          type: 'shadow'
        },
        axisLine: {
          lineStyle: {
            color: '#dcdfe6'
          }
        },
        axisLabel: {
          color: '#909399'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '金额(万元)',
        min: 0,
        max: 80,
        interval: 20,
        axisLabel: {
          color: '#909399',
          formatter: '{value}'
        },
        axisLine: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: '#ebeef5'
          }
        }
      }
    ],
    series: [
      {
        name: '收入',
        type: 'bar',
        barWidth: '20%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        data: [62, 58, 65, 71, 68, 75, 72, 78, 69, 73, 76, 80]
      },
      {
        name: '支出',
        type: 'bar',
        barWidth: '20%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        data: [42, 45, 38, 48, 43, 51, 47, 52, 44, 49, 46, 53]
      },
      {
        name: '净利润',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        },
        data: [20, 13, 27, 23, 25, 24, 25, 26, 25, 24, 30, 27]
      }
    ]
  }), []);

  // 资产分布饼图 - 帆软风格
  const assetPieOption = useMemo(() => ({
    color: fanruanColors,
    backgroundColor: '#f5f7fa',
    title: {
      text: '资产配置分布',
      left: 20,
      top: 15,
      textStyle: {
        color: '#303133',
        fontSize: 16,
        fontWeight: '600'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}万元 ({d}%)',
      backgroundColor: '#ffffff',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: {
        color: '#303133'
      }
    },
    legend: {
      orient: 'vertical',
      right: 30,
      top: 'middle',
      textStyle: {
        color: '#606266'
      }
    },
    series: [
      {
        name: '资产配置',
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['35%', '55%'],
        itemStyle: {
          borderRadius: 8,
          borderColor: '#f5f7fa',
          borderWidth: 4
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 12,
          color: '#606266'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: [
          { value: 180, name: '股票投资' },
          { value: 120, name: '基金理财' },
          { value: 80, name: '银行存款' },
          { value: 60, name: '债券投资' },
          { value: 40, name: '房地产' },
          { value: 20, name: '其他投资' }
        ]
      }
    ]
  }), []);

  // 月度现金流分析 - 帆软风格
  const cashFlowOption = useMemo(() => ({
    color: fanruanColors,
    backgroundColor: '#f5f7fa',
    title: {
      text: '月度现金流分析',
      left: 20,
      top: 15,
      textStyle: {
        color: '#303133',
        fontSize: 16,
        fontWeight: '600'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: {
        color: '#303133'
      }
    },
    legend: {
      data: ['经营现金流', '投资现金流', '筹资现金流'],
      top: 45,
      left: 20,
      textStyle: {
        color: '#606266'
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
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: {
        lineStyle: {
          color: '#dcdfe6'
        }
      },
      axisLabel: {
        color: '#909399'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#909399'
      },
      splitLine: {
        lineStyle: {
          color: '#ebeef5'
        }
      }
    },
    series: [
      {
        name: '经营现金流',
        type: 'line',
        stack: 'Total',
        smooth: true,
        areaStyle: {
          opacity: 0.6
        },
        data: [32, 45, 38, 52, 48, 55]
      },
      {
        name: '投资现金流',
        type: 'line',
        stack: 'Total',
        smooth: true,
        areaStyle: {
          opacity: 0.6
        },
        data: [-12, -8, -15, -10, -18, -12]
      },
      {
        name: '筹资现金流',
        type: 'line',
        stack: 'Total',
        smooth: true,
        areaStyle: {
          opacity: 0.6
        },
        data: [5, -3, 8, 2, -5, 6]
      }
    ]
  }), []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 帆软FineBI 风格头部 */}
      <Card 
        bordered={false}
        style={{ 
          marginBottom: '16px', 
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0, color: '#303133' }}>
              {title}
            </Title>
            <Text style={{ color: '#909399' }}>
              帆软FineBI风格 • 企业级财务数据分析平台
            </Text>
          </Col>
          <Col>
            <Space>
              <Tag color="#409eff">实时数据</Tag>
              <Tag color="#67c23a">已同步</Tag>
              <Button 
                type="primary" 
                icon={<BarChartOutlined />}
                style={{ backgroundColor: '#409eff', borderColor: '#409eff' }}
              >
                图表
              </Button>
              <Dropdown overlay={operationMenu} placement="bottomRight">
                <Button icon={<SettingOutlined />}>
                  操作 
                </Button>
              </Dropdown>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 标签页导航 */}
      <Card 
        bordered={false}
        style={{ borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        bodyStyle={{ padding: '0' }}
      >
        <Tabs 
          defaultActiveKey="overview" 
          tabBarStyle={{ 
            margin: 0, 
            paddingLeft: '20px',
            backgroundColor: '#fafafa'
          }}
        >
          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                总览分析
              </span>
            } 
            key="overview"
          >
            <div style={{ padding: '20px' }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card 
                    bordered={false} 
                    style={{ borderRadius: '4px' }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <ReactECharts 
                      option={incomeExpenseOption} 
                      style={{ height: `${height}px` }}
                      opts={{ renderer: 'svg' }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <PieChartOutlined />
                资产分析
              </span>
            } 
            key="assets"
          >
            <div style={{ padding: '20px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card 
                    bordered={false} 
                    style={{ borderRadius: '4px' }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <ReactECharts 
                      option={assetPieOption} 
                      style={{ height: `${height}px` }}
                      opts={{ renderer: 'svg' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card 
                    bordered={false} 
                    style={{ borderRadius: '4px' }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <ReactECharts 
                      option={cashFlowOption} 
                      style={{ height: `${height}px` }}
                      opts={{ renderer: 'svg' }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <LineChartOutlined />
                趋势预测
              </span>
            } 
            key="trends"
          >
            <div style={{ padding: '20px' }}>
              <Card 
                bordered={false} 
                style={{ borderRadius: '4px' }}
                bodyStyle={{ padding: '16px' }}
              >
                <div style={{ 
                  height: `${height}px`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#909399'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <DotChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <div>趋势预测功能开发中...</div>
                  </div>
                </div>
              </Card>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 帆软风格的页脚信息 */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px 16px', 
        backgroundColor: '#ffffff', 
        borderRadius: '6px',
        borderLeft: '4px solid #409eff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text style={{ color: '#909399', fontSize: '12px' }}>
              Powered by FineBI • 数据更新时间: {new Date().toLocaleString('zh-CN')} • 版本: v2024.1
            </Text>
          </Col>
          <Col>
            <Space>
              <Text style={{ color: '#409eff', fontSize: '12px', cursor: 'pointer' }}>
                技术支持
              </Text>
              <Text style={{ color: '#909399', fontSize: '12px' }}>|</Text>
              <Text style={{ color: '#409eff', fontSize: '12px', cursor: 'pointer' }}>
                用户手册
              </Text>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default FanRuanStyleDashboard; 