import React from 'react';
import { Spin, Progress, Typography, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import useMobileOptimization from '../../hooks/useMobileOptimization';

const { Title, Text } = Typography;

interface StartupScreenProps {
  progress?: number;
  status?: 'loading' | 'error' | 'success';
  message?: string;
  onRetry?: () => void;
  theme?: 'light' | 'dark';
}

const StartupScreen: React.FC<StartupScreenProps> = ({
  progress = 0,
  status = 'loading',
  message,
  onRetry,
  theme = 'light',
}) => {
  const { isMobile, isTablet } = useMobileOptimization();
  const getStatusMessage = () => {
    if (message) return message;
    
    switch (status) {
      case 'loading':
        return '正在启动财务管理系统...';
      case 'error':
        return '启动失败，请检查网络连接';
      case 'success':
        return '启动完成';
      default:
        return '正在加载...';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'error':
        return '#ff4d4f';
      case 'success':
        return '#52c41a';
      default:
        return '#1890ff';
    }
  };

  const getThemeStyles = () => {
    if (theme === 'dark') {
      return {
        backgroundColor: '#141414',
        textColor: '#ffffff',
        secondaryTextColor: '#bfbfbf',
        logoBackground: '#1890ff',
      };
    }
    
    return {
      backgroundColor: '#f0f2f5',
      textColor: '#262626',
      secondaryTextColor: '#666666',
      logoBackground: '#1890ff',
    };
  };

  const getMobileStyles = () => {
    if (!isMobile && !isTablet) return {};

    return {
      logoSize: isMobile ? 60 : 70,
      titleSize: isMobile ? '18px' : '20px',
      padding: isMobile ? '16px' : '20px',
      spinnerSize: isMobile ? 24 : 32,
      progressWidth: isMobile ? 160 : 200,
      fontSize: isMobile ? '12px' : '14px',
      bottomMargin: isMobile ? '12px' : '20px',
    };
  };

  const themeStyles = getThemeStyles();
  const mobileStyles = getMobileStyles();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: themeStyles.backgroundColor,
        zIndex: 9999,
        padding: mobileStyles.padding || '20px',
      }}
      className="startup-screen"
    >
      {/* Logo and Brand */}
      <Space direction="vertical" size="large" align="center">
        <div
          style={{
            width: mobileStyles.logoSize || 80,
            height: mobileStyles.logoSize || 80,
            borderRadius: '50%',
            backgroundColor: themeStyles.logoBackground,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
          }}
          className="startup-logo"
        >
          <Title level={1} style={{ 
            color: 'white', 
            margin: 0, 
            fontSize: mobileStyles.logoSize ? Math.floor((mobileStyles.logoSize as number) * 0.4) : 32 
          }}>
            ¥
          </Title>
        </div>

        <Title level={3} style={{ 
          margin: 0, 
          color: themeStyles.textColor,
          fontSize: mobileStyles.titleSize 
        }}>
          财务管理系统
        </Title>

        {/* Progress and Status */}
        <Space direction="vertical" size="middle" align="center" style={{ width: '100%' }}>
          {status === 'loading' && (
            <Spin
              indicator={<LoadingOutlined style={{ 
                fontSize: mobileStyles.spinnerSize || 32, 
                color: '#1890ff' 
              }} spin />}
              size="large"
            />
          )}

          {progress > 0 && (
            <Progress
              percent={Math.min(progress, 100)}
              showInfo={false}
              strokeColor={getProgressColor()}
              style={{ width: mobileStyles.progressWidth || 200 }}
            />
          )}

          <Text 
            type={status === 'error' ? 'danger' : 'secondary'}
            style={{ 
              color: status === 'error' ? undefined : themeStyles.secondaryTextColor,
              fontSize: mobileStyles.fontSize 
            }}
          >
            {getStatusMessage()}
          </Text>

          {status === 'error' && onRetry && (
            <Text
              style={{ 
                cursor: 'pointer', 
                textDecoration: 'underline',
                color: themeStyles.secondaryTextColor,
                fontSize: mobileStyles.fontSize 
              }}
              onClick={onRetry}
            >
              点击重试
            </Text>
          )}
        </Space>
      </Space>

      {/* Version Info */}
      <Text
        style={{ 
          position: 'absolute', 
          bottom: mobileStyles.bottomMargin || 20, 
          fontSize: mobileStyles.fontSize ? '10px' : '12px',
          color: themeStyles.secondaryTextColor 
        }}
      >
        v1.0.0 • © 2024 财务管理系统
      </Text>
    </div>
  );
};

export default StartupScreen;