import React, { useState, useEffect } from 'react';
import { Badge, Tooltip, Space, Typography, Drawer, Card, Progress } from 'antd';
import {
  WifiOutlined,
  DisconnectOutlined,
  InfoCircleOutlined,
  SignalFilled,
  ReloadOutlined,
} from '@ant-design/icons';
import { usePWA } from '../../utils/pwa';
import { useNetworkStatus } from '../../hooks/useMobile';
import './NetworkStatus.css';

const { Text } = Typography;

interface NetworkStatusProps {
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({
  showDetails = false,
  position = 'top-right',
}) => {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  const [connectionHistory, setConnectionHistory] = useState<Array<{
    time: Date;
    status: 'online' | 'offline';
    type?: string;
  }>>([]);

  const { networkInfo } = usePWA();
  const { isOnline, connectionType } = useNetworkStatus();

  // 记录连接状态变化
  useEffect(() => {
    if (isOnline) {
      setLastOnlineTime(new Date());
    }

    setConnectionHistory(prev => [
      {
        time: new Date(),
        status: isOnline ? 'online' : 'offline',
        type: connectionType,
      },
      ...prev.slice(0, 9), // 保留最近10条记录
    ]);
  }, [isOnline, connectionType]);

  // 获取网络质量等级
  const getNetworkQuality = () => {
    if (!isOnline) return 'offline';
    
    const { effectiveType, downlink, rtt } = networkInfo;
    
    if (effectiveType === '4g' && (downlink || 0) > 5 && (rtt || 0) < 100) {
      return 'excellent';
    } else if (effectiveType === '4g' || effectiveType === '3g') {
      return 'good';
    } else if (effectiveType === 'slow-2g') {
      return 'poor';
    } else {
      return 'fair';
    }
  };

  const networkQuality = getNetworkQuality();

  // 获取状态图标和颜色
  const getStatusConfig = () => {
    switch (networkQuality) {
      case 'excellent':
        return {
          icon: <WifiOutlined />,
          color: '#52c41a',
          text: '优秀',
          description: '网络连接状态良好',
        };
      case 'good':
        return {
          icon: <WifiOutlined />,
          color: '#1890ff',
          text: '良好',
          description: '网络连接正常',
        };
      case 'fair':
        return {
          icon: <WifiOutlined />,
          color: '#faad14',
          text: '一般',
          description: '网络连接较慢',
        };
      case 'poor':
        return {
          icon: <SignalFilled />,
          color: '#ff4d4f',
          text: '较差',
          description: '网络连接很慢',
        };
      case 'offline':
      default:
        return {
          icon: <DisconnectOutlined />,
          color: '#ff4d4f',
          text: '离线',
          description: '无网络连接',
        };
    }
  };

  const statusConfig = getStatusConfig();

  // 获取网络速度显示
  const getSpeedDisplay = () => {
    const { downlink, rtt } = networkInfo;
    
    if (!isOnline) return null;
    
    return (
      <Space direction="vertical" size="small">
        {downlink && (
          <div>
            <Text type="secondary">下载速度: </Text>
            <Text strong>{downlink.toFixed(1)} Mbps</Text>
          </div>
        )}
        {rtt && (
          <div>
            <Text type="secondary">延迟: </Text>
            <Text strong>{rtt} ms</Text>
          </div>
        )}
      </Space>
    );
  };

  // 获取网络质量进度条
  const getQualityProgress = () => {
    switch (networkQuality) {
      case 'excellent': return { percent: 100, status: 'success' as const };
      case 'good': return { percent: 75, status: 'normal' as const };
      case 'fair': return { percent: 50, status: 'active' as const };
      case 'poor': return { percent: 25, status: 'exception' as const };
      case 'offline': return { percent: 0, status: 'exception' as const };
      default: return { percent: 0, status: 'exception' as const };
    }
  };

  const qualityProgress = getQualityProgress();

  const statusIndicator = (
    <div className={`network-status-indicator ${position} ${networkQuality}`}>
      <Badge
        status={isOnline ? 'success' : 'error'}
        dot
        className="network-status-badge"
      >
        <div 
          className="network-status-icon"
          style={{ color: statusConfig.color }}
          onClick={() => showDetails && setDetailsVisible(true)}
        >
          {statusConfig.icon}
        </div>
      </Badge>
    </div>
  );

  if (!showDetails) {
    return (
      <Tooltip 
        title={`${statusConfig.text} - ${statusConfig.description}`}
        placement="bottom"
      >
        {statusIndicator}
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip 
        title="点击查看网络详情"
        placement="bottom"
      >
        {statusIndicator}
      </Tooltip>

      <Drawer
        title={
          <Space>
            <span style={{ color: statusConfig.color }}>
              {statusConfig.icon}
            </span>
            网络状态详情
          </Space>
        }
        placement="right"
        onClose={() => setDetailsVisible(false)}
        open={detailsVisible}
        width={320}
        className="network-status-drawer"
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 当前状态 */}
          <Card size="small" title="当前状态">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div className="network-status-current">
                <Space>
                  <span style={{ color: statusConfig.color }}>
                    {statusConfig.icon}
                  </span>
                  <Text strong>{statusConfig.text}</Text>
                </Space>
                <Text type="secondary">{statusConfig.description}</Text>
              </div>
              
              <Progress 
                {...qualityProgress}
                showInfo={false}
                size="small"
              />
              
              {isOnline && (
                <>
                  <div>
                    <Text type="secondary">连接类型: </Text>
                    <Text>{connectionType || '未知'}</Text>
                  </div>
                  {getSpeedDisplay()}
                </>
              )}
            </Space>
          </Card>

          {/* 连接信息 */}
          <Card size="small" title="连接信息">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">在线状态: </Text>
                <Text strong style={{ color: isOnline ? '#52c41a' : '#ff4d4f' }}>
                  {isOnline ? '已连接' : '已断开'}
                </Text>
              </div>
              
              {lastOnlineTime && (
                <div>
                  <Text type="secondary">最后在线: </Text>
                  <Text>{lastOnlineTime.toLocaleString()}</Text>
                </div>
              )}
              
              <div>
                <Text type="secondary">有效类型: </Text>
                <Text>{networkInfo.effectiveType || '未知'}</Text>
              </div>
            </Space>
          </Card>

          {/* 连接历史 */}
          <Card size="small" title="连接历史">
            <div className="network-history">
              {connectionHistory.map((record, index) => (
                <div key={index} className="network-history-item">
                  <div className="network-history-time">
                    {record.time.toLocaleTimeString()}
                  </div>
                  <div className="network-history-status">
                    <Badge
                      status={record.status === 'online' ? 'success' : 'error'}
                      text={record.status === 'online' ? '上线' : '离线'}
                    />
                    {record.type && (
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        ({record.type})
                      </Text>
                    )}
                  </div>
                </div>
              ))}
              
              {connectionHistory.length === 0 && (
                <Text type="secondary">暂无记录</Text>
              )}
            </div>
          </Card>

          {/* 操作按钮 */}
          <Card size="small" title="操作">
            <Space>
              <button
                className="network-action-button"
                onClick={() => window.location.reload()}
              >
                <ReloadOutlined /> 刷新页面
              </button>
              
              {!isOnline && (
                <button
                  className="network-action-button secondary"
                  onClick={() => {
                    // 尝试重新连接
                    if ('navigator' in window && 'serviceWorker' in navigator) {
                      navigator.serviceWorker.ready.then(registration => {
                        registration.update();
                      });
                    }
                  }}
                >
                  <WifiOutlined /> 重试连接
                </button>
              )}
            </Space>
          </Card>

          {/* 提示信息 */}
          <div className="network-tips">
            <Space align="start">
              <InfoCircleOutlined style={{ color: '#1890ff', marginTop: 2 }} />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {isOnline ? 
                    '当前网络连接正常，数据将实时同步。' : 
                    '当前处于离线状态，部分功能可能受限。您可以继续使用已缓存的功能。'
                  }
                </Text>
              </div>
            </Space>
          </div>
        </Space>
      </Drawer>
    </>
  );
};

export default NetworkStatus;