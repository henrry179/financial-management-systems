import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Space, Typography, Drawer, Tabs, Spin, message } from 'antd';
import { 
  BarChartOutlined, 
  PieChartOutlined, 
  LineChartOutlined,
  MobileOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import * as echarts from 'echarts';
import { useMobile, useOrientation } from '../../hooks/useMobile';
import { MobileCard, MobileTouchButton, MobileActionSheet } from '../mobile/MobileComponents';
import { BIReportData } from '../../services/biApi';
import './MobileBIDashboard.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface MobileBIDashboardProps {
  data?: BIReportData;
  loading?: boolean;
  onRefresh?: () => void;
  onToggleFullscreen?: () => void;
}

const MobileBIDashboard: React.FC<MobileBIDashboardProps> = ({
  data,
  loading = false,
  onRefresh,
  onToggleFullscreen
}) => {
  const { isMobile, isTablet } = useMobile();
  const orientation = useOrientation();
  const [activeTab, setActiveTab] = useState('overview');
  const [chartDrawerVisible, setChartDrawerVisible] = useState(false);
  const [selectedChart, setSelectedChart] = useState<string>('');
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  // 响应式配置
  const isLandscape = orientation === 'landscape';
  const isSmallScreen = isMobile && !isTablet;

  // 图表配置
  const chartConfigs = {
    incomeExpense: {
      title: '收入支出对比',
      type: 'bar',
      data: data?.financialData || [],
      option: {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        legend: {
          data: ['收入', '支出'],
          bottom: 0
        },
        xAxis: {
          type: 'category',
          data: (data?.financialData || []).map(item => item.month),
          axisLabel: {
            rotate: isSmallScreen ? 45 : 0,
            fontSize: isSmallScreen ? 10 : 12
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => `${(value / 1000).toFixed(0)}k`
          }
        },
        series: [
          {
            name: '收入',
            type: 'bar',
            data: (data?.financialData || []).map(item => item.income),
            itemStyle: { color: '#52c41a' }
          },
          {
            name: '支出',
            type: 'bar',
            data: (data?.financialData || []).map(item => item.expense),
            itemStyle: { color: '#ff4d4f' }
          }
        ],
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '10%',
          containLabel: true
        }
      }
    },
    profitTrend: {
      title: '利润趋势',
      type: 'line',
      data: data?.financialData || [],
      option: {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: (data?.financialData || []).map(item => item.month),
          axisLabel: {
            rotate: isSmallScreen ? 45 : 0,
            fontSize: isSmallScreen ? 10 : 12
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => `${(value / 1000).toFixed(0)}k`
          }
        },
        series: [
          {
            name: '利润',
            type: 'line',
            data: (data?.financialData || []).map(item => item.profit),
            smooth: true,
            itemStyle: { color: '#1890ff' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
              ])
            }
          }
        ],
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '10%',
          containLabel: true
        }
      }
    },
    categoryDistribution: {
      title: '支出分类分布',
      type: 'pie',
      data: [
        { name: '餐饮', value: 35 },
        { name: '交通', value: 25 },
        { name: '购物', value: 20 },
        { name: '娱乐', value: 15 },
        { name: '其他', value: 5 }
      ],
      option: {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: isLandscape ? 'horizontal' : 'vertical',
          left: isLandscape ? 'center' : 'left',
          bottom: isLandscape ? 0 : 'auto',
          top: isLandscape ? 'auto' : 'center'
        },
        series: [
          {
            name: '支出分类',
            type: 'pie',
            radius: isSmallScreen ? ['40%', '70%'] : ['50%', '80%'],
            center: isLandscape ? ['50%', '40%'] : ['50%', '50%'],
            data: [
              { name: '餐饮', value: 35, itemStyle: { color: '#ff7875' } },
              { name: '交通', value: 25, itemStyle: { color: '#40a9ff' } },
              { name: '购物', value: 20, itemStyle: { color: '#b37feb' } },
              { name: '娱乐', value: 15, itemStyle: { color: '#73d13d' } },
              { name: '其他', value: 5, itemStyle: { color: '#ffc53d' } }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
    }
  };

  // 渲染图表
  const renderChart = (chartKey: string, containerId: string) => {
    const chartConfig = chartConfigs[chartKey as keyof typeof chartConfigs];
    if (!chartConfig) return;

    const chartContainer = document.getElementById(containerId);
    if (!chartContainer) return;

    const chart = echarts.init(chartContainer);
    chart.setOption(chartConfig.option);

    // 响应式调整
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  };

  // 打开图表详情
  const openChartDetail = (chartKey: string) => {
    setSelectedChart(chartKey);
    setChartDrawerVisible(true);
  };

  // 操作面板
  const actionSheetActions = [
    {
      key: 'refresh',
      text: '刷新数据',
      icon: <ReloadOutlined />,
      onClick: () => {
        onRefresh?.();
        message.success('数据已刷新');
      }
    },
    {
      key: 'fullscreen',
      text: '全屏模式',
      icon: <FullscreenOutlined />,
      onClick: () => {
        onToggleFullscreen?.();
        message.info('切换到全屏模式');
      }
    },
    {
      key: 'settings',
      text: '图表设置',
      icon: <SettingOutlined />,
      onClick: () => {
        message.info('图表设置功能开发中');
      }
    }
  ];

  // 关键指标卡片
  const renderMetricCard = (title: string, value: number, color: string, icon: React.ReactNode) => (
    <Col xs={12} sm={8} md={6} key={title}>
      <MobileCard
        className="metric-card"
        style={{ 
          background: `linear-gradient(135deg, ${color}15, ${color}05)`,
          border: `1px solid ${color}30`
        }}
        onTap={() => message.info(`${title}: ${value.toLocaleString()}`)}
      >
        <div className="metric-content">
          <div className="metric-icon" style={{ color }}>
            {icon}
          </div>
          <div className="metric-info">
            <Text className="metric-title">{title}</Text>
            <Title level={4} className="metric-value" style={{ color, margin: 0 }}>
              ¥{value.toLocaleString()}
            </Title>
          </div>
        </div>
      </MobileCard>
    </Col>
  );

  // 图表卡片
  const renderChartCard = (chartKey: string, title: string, icon: React.ReactNode) => (
    <Col xs={24} sm={12} md={8} key={chartKey}>
      <MobileCard
        title={
          <Space>
            {icon}
            <Text strong>{title}</Text>
          </Space>
        }
        extra={
          <MobileTouchButton
            type="text"
            size="small"
            onClick={() => openChartDetail(chartKey)}
          >
            详情
          </MobileTouchButton>
        }
        className="chart-card"
        onTap={() => openChartDetail(chartKey)}
      >
        <div 
          id={`mobile-chart-${chartKey}`}
          style={{ 
            height: isLandscape ? '200px' : '250px',
            width: '100%'
          }}
        />
      </MobileCard>
    </Col>
  );

  // 初始化图表
  useEffect(() => {
    if (data && !loading) {
      const cleanupFunctions: (() => void)[] = [];
      
      // 渲染所有图表
      Object.keys(chartConfigs).forEach(chartKey => {
        const cleanup = renderChart(chartKey, `mobile-chart-${chartKey}`);
        if (cleanup) cleanupFunctions.push(cleanup);
      });

      return () => {
        cleanupFunctions.forEach(cleanup => cleanup());
      };
    }
  }, [data, loading, isLandscape, isSmallScreen]);

  if (loading) {
    return (
      <div className="mobile-bi-loading">
        <Spin size="large" />
        <Text style={{ marginTop: 16, display: 'block' }}>正在加载数据...</Text>
      </div>
    );
  }

  return (
    <div className="mobile-bi-dashboard">
      {/* 头部操作栏 */}
      <div className="mobile-bi-header">
        <Space>
          <MobileTouchButton
            type="primary"
            icon={<MobileOutlined />}
            onClick={() => setActionSheetVisible(true)}
          >
            操作
          </MobileTouchButton>
          <Text className="last-update">
            最后更新: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '未知'}
          </Text>
        </Space>
      </div>

      {/* 关键指标 */}
      <div className="mobile-bi-metrics">
        <Title level={4}>关键指标</Title>
        <Row gutter={[8, 8]}>
          {renderMetricCard(
            '总收入',
            data?.totalIncome || 0,
            '#52c41a',
            <BarChartOutlined />
          )}
          {renderMetricCard(
            '总支出',
            data?.totalExpense || 0,
            '#ff4d4f',
            <PieChartOutlined />
          )}
          {renderMetricCard(
            '净利润',
            data?.netProfit || 0,
            '#1890ff',
            <LineChartOutlined />
          )}
        </Row>
      </div>

      {/* 图表区域 */}
      <div className="mobile-bi-charts">
        <Title level={4}>数据可视化</Title>
        <Row gutter={[8, 8]}>
          {renderChartCard('incomeExpense', '收入支出对比', <BarChartOutlined />)}
          {renderChartCard('profitTrend', '利润趋势', <LineChartOutlined />)}
          {renderChartCard('categoryDistribution', '支出分类', <PieChartOutlined />)}
        </Row>
      </div>

      {/* 图表详情抽屉 */}
      <Drawer
        title={chartConfigs[selectedChart as keyof typeof chartConfigs]?.title || '图表详情'}
        placement="bottom"
        height="80%"
        open={chartDrawerVisible}
        onClose={() => setChartDrawerVisible(false)}
        className="mobile-chart-drawer"
      >
        <div 
          id={`mobile-detail-chart-${selectedChart}`}
          style={{ height: '100%', width: '100%' }}
        />
      </Drawer>

      {/* 操作面板 */}
      <MobileActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        title="BI看板操作"
        actions={actionSheetActions}
      />
    </div>
  );
};

export default MobileBIDashboard;
