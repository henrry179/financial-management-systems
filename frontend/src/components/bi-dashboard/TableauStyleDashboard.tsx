import React, { useMemo } from 'react';
import { Card, Row, Col, Select, DatePicker, Space, Typography, Tooltip } from 'antd';
import { InfoCircleOutlined, FullscreenOutlined, DownloadOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { DashboardProps } from './types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const TableauStyleDashboard: React.FC<DashboardProps> = ({ 
  data, 
  title = 'Financial Analytics Dashboard',
  theme = 'light',
  height = 400 
}) => {
  // Tableau 经典配色方案
  const tableauColors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ];

  // 收入趋势图表配置 - Tableau风格
  const revenueChartOption = useMemo(() => ({
    color: tableauColors,
    backgroundColor: '#ffffff',
    title: {
      text: '收入趋势分析',
      left: 'left',
      textStyle: {
        color: '#333333',
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#cccccc',
      borderWidth: 1,
      textStyle: {
        color: '#333333'
      }
    },
    legend: {
      data: ['月收入', '年同比'],
      top: '10%',
      right: '10%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: {
        lineStyle: {
          color: '#cccccc'
        }
      },
      axisTick: {
        show: false
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
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [
      {
        name: '月收入',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3
        },
        data: [32000, 45000, 38000, 52000, 48000, 55000]
      },
      {
        name: '年同比',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          type: 'dashed'
        },
        data: [28000, 41000, 35000, 49000, 44000, 51000]
      }
    ]
  }), []);

  // 支出分类饼图 - Tableau风格
  const expensePieOption = useMemo(() => ({
    color: tableauColors,
    backgroundColor: '#ffffff',
    title: {
      text: '支出分类分析',
      left: 'left',
      textStyle: {
        color: '#333333',
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#cccccc',
      borderWidth: 1,
      textStyle: {
        color: '#333333'
      }
    },
    legend: {
      orient: 'vertical',
      left: 'right',
      top: 'middle'
    },
    series: [
      {
        name: '支出分类',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 15000, name: '餐饮' },
          { value: 8000, name: '交通' },
          { value: 12000, name: '购物' },
          { value: 6000, name: '娱乐' },
          { value: 9000, name: '其他' }
        ]
      }
    ]
  }), []);

  // 资产配置柱状图 - Tableau风格
  const assetBarOption = useMemo(() => ({
    color: tableauColors,
    backgroundColor: '#ffffff',
    title: {
      text: '资产配置分析',
      left: 'left',
      textStyle: {
        color: '#333333',
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#cccccc',
      borderWidth: 1,
      textStyle: {
        color: '#333333'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['现金', '定期存款', '基金', '股票', '债券', '其他'],
      axisLine: {
        lineStyle: {
          color: '#cccccc'
        }
      },
      axisTick: {
        show: false
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
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [
      {
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        data: [50000, 120000, 80000, 45000, 30000, 15000]
      }
    ]
  }), []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fa' }}>
      {/* 头部操作栏 */}
      <Card 
        bordered={false} 
        style={{ marginBottom: '16px', borderRadius: '8px' }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0, color: '#333333' }}>
              {title}
              <Tooltip title="Tableau风格的交互式数据分析看板，提供直观的财务数据洞察">
                <InfoCircleOutlined style={{ marginLeft: 8, color: '#1f77b4' }} />
              </Tooltip>
            </Title>
            <Text type="secondary">采用Tableau经典设计风格 • 交互式数据探索</Text>
          </Col>
          <Col>
            <Space>
              <Select
                defaultValue="month"
                style={{ width: 120 }}
                options={[
                  { value: 'day', label: '按日' },
                  { value: 'week', label: '按周' },
                  { value: 'month', label: '按月' },
                  { value: 'year', label: '按年' }
                ]}
              />
              <RangePicker />
              <Tooltip title="全屏显示">
                <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
              </Tooltip>
              <Tooltip title="导出数据">
                <DownloadOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 主要图表区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            bordered={false} 
            style={{ borderRadius: '8px' }}
            bodyStyle={{ padding: '20px' }}
          >
            <ReactECharts 
              option={revenueChartOption} 
              style={{ height: `${height}px` }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            bordered={false} 
            style={{ borderRadius: '8px' }}
            bodyStyle={{ padding: '20px' }}
          >
            <ReactECharts 
              option={expensePieOption} 
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
            bodyStyle={{ padding: '20px' }}
          >
            <ReactECharts 
              option={assetBarOption} 
              style={{ height: `${height * 0.8}px` }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tableau风格的数据标识 */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px 16px', 
        backgroundColor: '#ffffff', 
        borderRadius: '8px',
        borderLeft: '4px solid #1f77b4'
      }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Powered by Tableau-style Analytics • 数据更新时间: {new Date().toLocaleString()}
        </Text>
      </div>
    </div>
  );
};

export default TableauStyleDashboard; 