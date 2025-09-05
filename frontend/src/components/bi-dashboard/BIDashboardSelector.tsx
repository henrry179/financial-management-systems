import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Space, Typography, Radio, Tag, Tooltip, Avatar, message, Spin } from 'antd';
import { 
  TableauStyleDashboard, 
  PowerBIStyleDashboard, 
  FanRuanStyleDashboard, 
  GuanYuanStyleDashboard 
} from './index';
import MobileBIDashboard from './MobileBIDashboard';
import { BIStyle, BI_STYLES } from './types';
import { 
  GlobalOutlined, 
  HomeOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  StarOutlined,
  CrownOutlined,
  MobileOutlined
} from '@ant-design/icons';
import { BIApiService, MockBIDataGenerator, BIReportData } from '../../services/biApi';
import AuthStatusIndicator from '../auth/AuthStatusIndicator';
import DataVisualizationEnhancer from './DataVisualizationEnhancer';
import { useMobile } from '../../hooks/useMobile';

const { Title, Text, Paragraph } = Typography;

interface BIDashboardSelectorProps {
  data?: any[];
  height?: number;
}

const BIDashboardSelector: React.FC<BIDashboardSelectorProps> = ({ 
  data = [], 
  height = 400 
}) => {
  const [selectedStyle, setSelectedStyle] = useState<string>('tableau');
  const [showDemo, setShowDemo] = useState<boolean>(true);
  const [biData, setBiData] = useState<BIReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [useRealData, setUseRealData] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  const { isMobile, isTablet } = useMobile();

  const currentStyle = BI_STYLES.find(style => style.id === selectedStyle);

  // 获取BI数据
  const fetchBIData = async (useReal: boolean = false) => {
    setLoading(true);
    try {
      if (useReal) {
        // 尝试获取真实API数据
        const response = await BIApiService.getBIReportData();
        if (response.success && response.data) {
          setBiData(response.data);
          setUseRealData(true);
          message.success('已加载真实财务数据');
        } else {
          throw new Error('API数据获取失败');
        }
      } else {
        // 使用模拟数据
        const mockData = MockBIDataGenerator.generateBIReportData();
        setBiData(mockData);
        setUseRealData(false);
        message.info('已加载演示数据');
      }
    } catch (error) {
      console.error('获取BI数据失败:', error);
      // 如果真实数据获取失败，回退到模拟数据
      const mockData = MockBIDataGenerator.generateBIReportData();
      setBiData(mockData);
      setUseRealData(false);
      message.warning('API连接失败，已加载演示数据');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    fetchBIData(false); // 默认加载模拟数据
  }, []);

  const renderDashboard = () => {
    const dashboardData = biData ? biData.financialData : data;
    const commonProps = { data: dashboardData, height };
    
    // 移动端使用专门的移动端BI看板
    if (isMobile || isTablet) {
      return (
        <MobileBIDashboard
          data={biData}
          loading={loading}
          onRefresh={() => fetchBIData(useRealData)}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      );
    }
    
    // 桌面端使用原有的BI看板
    switch (selectedStyle) {
      case 'tableau':
        return <TableauStyleDashboard {...commonProps} />;
      case 'powerbi':
        return <PowerBIStyleDashboard {...commonProps} />;
      case 'fanruan':
        return <FanRuanStyleDashboard {...commonProps} />;
      case 'guanyuan':
        return <GuanYuanStyleDashboard {...commonProps} />;
      default:
        return <TableauStyleDashboard {...commonProps} />;
    }
  };

  const getStyleIcon = (category: string) => {
    return category === 'international' ? <GlobalOutlined /> : <HomeOutlined />;
  };

  const getStyleBadge = (id: string) => {
    const badges = {
      tableau: { icon: <StarOutlined />, text: '经典', color: '#1f77b4' },
      powerbi: { icon: <CrownOutlined />, text: '企业级', color: '#106ebe' },
      fanruan: { icon: <RocketOutlined />, text: '本土化', color: '#409eff' },
      guanyuan: { icon: <ThunderboltOutlined />, text: 'AI智能', color: '#722ed1' }
    };
    return badges[id as keyof typeof badges] || badges.tableau;
  };

  return (
    <div style={{ 
      padding: isMobile ? '12px' : '24px', 
      backgroundColor: '#f0f2f5', 
      minHeight: '100vh' 
    }}>
      {/* 移动端简化头部 */}
      {isMobile ? (
        <div style={{ 
          marginBottom: '16px', 
          padding: '16px', 
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <MobileOutlined /> BI看板
              </Title>
            </Col>
            <Col>
              <AuthStatusIndicator />
            </Col>
          </Row>
        </div>
      ) : (
        /* 桌面端头部选择器 */
        <Card 
          bordered={false}
          style={{ 
            marginBottom: '24px', 
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
          bodyStyle={{ padding: '32px' }}
        >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* 认证状态指示器 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div></div>
            <AuthStatusIndicator />
          </div>
          
          <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
            🎨 BI可视化风格选择中心
          </Title>
          <Paragraph style={{ fontSize: '16px', color: '#666666', marginTop: '8px' }}>
            选择您喜欢的BI软件风格，享受专业的数据可视化体验
          </Paragraph>
          
          {/* 数据控制按钮 */}
          <div style={{ marginTop: '16px' }}>
            <Space size="middle">
              <Button 
                type={useRealData ? "primary" : "default"}
                onClick={() => fetchBIData(true)}
                loading={loading}
                icon={<ThunderboltOutlined />}
              >
                加载真实数据
              </Button>
              <Button 
                type={!useRealData ? "primary" : "default"}
                onClick={() => fetchBIData(false)}
                loading={loading}
                icon={<StarOutlined />}
              >
                使用演示数据
              </Button>
              <Button 
                onClick={() => fetchBIData(useRealData)}
                loading={loading}
                icon={<ReloadOutlined />}
              >
                刷新数据
              </Button>
            </Space>
            <div style={{ marginTop: '8px' }}>
              <Tag color={useRealData ? "green" : "blue"}>
                {useRealData ? "真实数据" : "演示数据"}
              </Tag>
              {biData && (
                <Tag color="gray">
                  最后更新: {new Date(biData.lastUpdated).toLocaleString()}
                </Tag>
              )}
            </div>
          </div>
        </div>

        {/* 分类选项 */}
        <Row gutter={[24, 24]} justify="center">
          <Col span={24}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Space size="large">
                <div>
                  <GlobalOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
                  <Text strong style={{ fontSize: '16px' }}>国际主流BI</Text>
                </div>
                <div style={{ width: '1px', height: '24px', backgroundColor: '#d9d9d9' }} />
                <div>
                  <HomeOutlined style={{ fontSize: '24px', color: '#52c41a', marginRight: '8px' }} />
                  <Text strong style={{ fontSize: '16px' }}>国内主流BI</Text>
                </div>
              </Space>
            </div>
          </Col>
        </Row>

        {/* BI风格选择卡片 */}
        <Row gutter={[16, 16]} justify="center">
          {BI_STYLES.map((style) => {
            const badge = getStyleBadge(style.id);
            const isSelected = selectedStyle === style.id;
            
            return (
              <Col xs={24} sm={12} lg={6} key={style.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: '8px',
                    border: isSelected ? `2px solid ${style.colors.primary}` : '1px solid #e8e8e8',
                    background: isSelected ? `linear-gradient(135deg, ${style.colors.primary}15, ${style.colors.secondary}15)` : '#ffffff',
                    transform: isSelected ? 'translateY(-4px)' : 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: isSelected ? `0 8px 24px ${style.colors.primary}30` : '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  bodyStyle={{ padding: '20px' }}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <div style={{ textAlign: 'center' }}>
                    {/* 样式头像 */}
                    <Avatar 
                      size={64} 
                      style={{ 
                        backgroundColor: style.colors.primary,
                        marginBottom: '16px',
                        fontSize: '24px'
                      }}
                      icon={getStyleIcon(style.category)}
                    />
                    
                    {/* 样式名称和徽章 */}
                    <div style={{ marginBottom: '12px' }}>
                      <Title level={4} style={{ margin: 0, color: style.colors.text }}>
                        {style.name}
                      </Title>
                      <div style={{ marginTop: '8px' }}>
                        <Tag 
                          color={style.category === 'international' ? 'blue' : 'green'}
                          style={{ marginRight: '4px' }}
                        >
                          {getStyleIcon(style.category)} {style.category === 'international' ? '国际' : '国内'}
                        </Tag>
                        <Tag color={badge.color}>
                          {badge.icon} {badge.text}
                        </Tag>
                      </div>
                    </div>

                    {/* 样式描述 */}
                    <Paragraph 
                      style={{ 
                        fontSize: '12px', 
                        color: '#888888', 
                        margin: '0 0 16px 0',
                        lineHeight: '1.4'
                      }}
                    >
                      {style.description}
                    </Paragraph>

                    {/* 特性标签 */}
                    <div style={{ marginBottom: '16px' }}>
                      {style.features.slice(0, 2).map((feature, index) => (
                        <Tag 
                          key={index} 
                          size="small" 
                          style={{ 
                            margin: '2px',
                            backgroundColor: `${style.colors.primary}10`,
                            border: `1px solid ${style.colors.primary}30`,
                            color: style.colors.primary
                          }}
                        >
                          {feature}
                        </Tag>
                      ))}
                    </div>

                    {/* 选择状态指示器 */}
                    <Radio 
                      checked={isSelected}
                      style={{ 
                        color: style.colors.primary,
                        fontWeight: isSelected ? 'bold' : 'normal'
                      }}
                    >
                      选择此风格
                    </Radio>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* 当前选择的详细信息 */}
        {currentStyle && (
          <div style={{ 
            marginTop: '32px', 
            padding: '20px', 
            backgroundColor: `${currentStyle.colors.primary}08`,
            border: `1px solid ${currentStyle.colors.primary}30`,
            borderRadius: '8px'
          }}>
            <Row align="middle" justify="space-between">
              <Col>
                <Text strong style={{ fontSize: '16px', color: currentStyle.colors.text }}>
                  当前选择: {currentStyle.name}
                </Text>
                <div style={{ marginTop: '8px' }}>
                  <Space wrap>
                    {currentStyle.features.map((feature, index) => (
                      <Tooltip key={index} title={`${currentStyle.name}的核心特性`}>
                        <Tag 
                          color={currentStyle.colors.primary}
                          style={{ cursor: 'pointer' }}
                        >
                          {feature}
                        </Tag>
                      </Tooltip>
                    ))}
                  </Space>
                </div>
              </Col>
              <Col>
                <Button 
                  type="primary" 
                  size="large"
                  style={{ 
                    backgroundColor: currentStyle.colors.primary,
                    borderColor: currentStyle.colors.primary
                  }}
                  onClick={() => setShowDemo(!showDemo)}
                >
                  {showDemo ? '隐藏预览' : '显示预览'}
                </Button>
              </Col>
            </Row>
          </div>
        )}
        </Card>
      )}

      {/* BI样式演示区域 */}
      {(showDemo || isMobile) && (
        <DataVisualizationEnhancer
          onDataUpdate={(data) => {
            setBiData(data);
            message.success('数据已实时更新');
          }}
          showControls={!isMobile} // 移动端不显示控制按钮，由MobileBIDashboard内部处理
          autoRefresh={useRealData}
          refreshInterval={useRealData ? 30000 : 60000}
        >
          {isMobile ? (
            // 移动端直接渲染看板
            renderDashboard()
          ) : (
            // 桌面端使用卡片包装
            <Card 
              bordered={false}
              style={{ 
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
              bodyStyle={{ padding: 0 }}
            >
              {loading ? (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: height + 100,
                  flexDirection: 'column'
                }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px', color: '#666' }}>
                    正在加载{useRealData ? '真实' : '演示'}数据...
                  </div>
                </div>
              ) : (
                renderDashboard()
              )}
            </Card>
          )}
        </DataVisualizationEnhancer>
      )}
    </div>
  );
};

export default BIDashboardSelector; 