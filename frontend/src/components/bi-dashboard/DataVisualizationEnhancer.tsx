import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Space, Typography, Progress, Tooltip, Badge, Switch } from 'antd';
import { 
  ReloadOutlined, 
  WifiOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { BIReportData } from '../../services/biApi';

const { Title, Text } = Typography;

interface DataVisualizationEnhancerProps {
  children: React.ReactNode;
  onDataUpdate?: (data: BIReportData) => void;
  showControls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const DataVisualizationEnhancer: React.FC<DataVisualizationEnhancerProps> = ({
  children,
  onDataUpdate,
  showControls = true,
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [customInterval, setCustomInterval] = useState(refreshInterval);

  const {
    data,
    loading,
    error,
    lastUpdate,
    isConnected,
    refresh,
    resetConnection,
    timeSinceUpdate,
    isStale
  } = useRealTimeData({
    interval: customInterval,
    autoRefresh,
    onDataUpdate,
    onError: (error) => {
      console.error('Real-time data error:', error);
    }
  });

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const seconds = Math.floor(timestamp / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return `${seconds}秒前`;
    }
  };

  // 获取连接状态颜色
  const getConnectionColor = () => {
    if (!isConnected) return 'red';
    if (isStale) return 'orange';
    return 'green';
  };

  // 获取连接状态文本
  const getConnectionText = () => {
    if (!isConnected) return '连接断开';
    if (isStale) return '数据延迟';
    return '实时连接';
  };

  return (
    <div>
      {/* 数据状态控制栏 */}
      {showControls && (
        <Card 
          size="small" 
          style={{ 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="middle">
                {/* 连接状态 */}
                <Space size="small">
                  <Badge 
                    status={getConnectionColor() as any} 
                    text={
                      <Space size="small">
                        <WifiOutlined />
                        <Text style={{ fontSize: '12px' }}>
                          {getConnectionText()}
                        </Text>
                      </Space>
                    }
                  />
                </Space>

                {/* 最后更新时间 */}
                {lastUpdate && timeSinceUpdate && (
                  <Space size="small">
                    <ClockCircleOutlined />
                    <Text style={{ fontSize: '12px', color: '#666' }}>
                      {formatTime(timeSinceUpdate)}
                    </Text>
                  </Space>
                )}

                {/* 数据状态指示器 */}
                {isStale && (
                  <Tooltip title="数据可能不是最新的">
                    <WarningOutlined style={{ color: '#faad14' }} />
                  </Tooltip>
                )}
              </Space>
            </Col>

            <Col>
              <Space size="small">
                {/* 刷新按钮 */}
                <Tooltip title="手动刷新数据">
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined spin={loading} />}
                    onClick={refresh}
                    loading={loading}
                    style={{ color: '#1890ff' }}
                  />
                </Tooltip>

                {/* 设置按钮 */}
                <Tooltip title="数据设置">
                  <Button
                    type="text"
                    size="small"
                    icon={<SettingOutlined />}
                    onClick={() => setShowSettings(!showSettings)}
                    style={{ color: '#666' }}
                  />
                </Tooltip>

                {/* 重置连接 */}
                {!isConnected && (
                  <Tooltip title="重新连接">
                    <Button
                      type="text"
                      size="small"
                      icon={<ThunderboltOutlined />}
                      onClick={resetConnection}
                      style={{ color: '#ff4d4f' }}
                    />
                  </Tooltip>
                )}
              </Space>
            </Col>
          </Row>

          {/* 设置面板 */}
          {showSettings && (
            <div style={{ 
              marginTop: '12px', 
              padding: '12px', 
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '6px',
              border: '1px solid #e8e8e8'
            }}>
              <Row gutter={[16, 8]} align="middle">
                <Col span={8}>
                  <Text style={{ fontSize: '12px' }}>自动刷新:</Text>
                </Col>
                <Col span={8}>
                  <Switch 
                    size="small" 
                    checked={autoRefresh}
                    onChange={(checked) => {
                      // 这里可以添加切换自动刷新的逻辑
                      console.log('Auto refresh:', checked);
                    }}
                  />
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: '12px', color: '#666' }}>
                    {autoRefresh ? '已启用' : '已禁用'}
                  </Text>
                </Col>
              </Row>
              
              <Row gutter={[16, 8]} align="middle" style={{ marginTop: '8px' }}>
                <Col span={8}>
                  <Text style={{ fontSize: '12px' }}>刷新间隔:</Text>
                </Col>
                <Col span={16}>
                  <Space size="small">
                    <Button
                      size="small"
                      type={customInterval === 10000 ? 'primary' : 'default'}
                      onClick={() => setCustomInterval(10000)}
                    >
                      10秒
                    </Button>
                    <Button
                      size="small"
                      type={customInterval === 30000 ? 'primary' : 'default'}
                      onClick={() => setCustomInterval(30000)}
                    >
                      30秒
                    </Button>
                    <Button
                      size="small"
                      type={customInterval === 60000 ? 'primary' : 'default'}
                      onClick={() => setCustomInterval(60000)}
                    >
                      1分钟
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div style={{ 
              marginTop: '8px',
              padding: '8px 12px',
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: '4px'
            }}>
              <Space size="small">
                <WarningOutlined style={{ color: '#ff4d4f' }} />
                <Text style={{ fontSize: '12px', color: '#ff4d4f' }}>
                  数据加载失败: {error.message}
                </Text>
              </Space>
            </div>
          )}
        </Card>
      )}

      {/* 主要内容区域 */}
      <div style={{ position: 'relative' }}>
        {children}
        
        {/* 加载遮罩 */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255,255,255,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            borderRadius: '8px'
          }}>
            <Space direction="vertical" align="center">
              <Progress type="circle" size="small" percent={75} />
              <Text style={{ fontSize: '12px', color: '#666' }}>
                正在更新数据...
              </Text>
            </Space>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataVisualizationEnhancer;
