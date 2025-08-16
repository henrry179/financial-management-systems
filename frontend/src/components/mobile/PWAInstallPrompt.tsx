import React, { useState, useEffect } from 'react';
import { Modal, Button, Typography, Space, Card, Row, Col } from 'antd';
import {
  DownloadOutlined,
  MobileOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { usePWA } from '../../utils/pwa';
import { useMobile } from '../../hooks/useMobile';
import './PWAInstallPrompt.css';

const { Title, Text, Paragraph } = Typography;

interface PWAInstallPromptProps {
  visible?: boolean;
  onClose?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  visible: externalVisible,
  onClose: externalOnClose,
}) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  const { canInstall, isInstalled, install } = usePWA();
  const { isMobile, isIOS, isAndroid } = useMobile();

  const visible = externalVisible !== undefined ? externalVisible : internalVisible;
  const onClose = externalOnClose || (() => setInternalVisible(false));

  // 自动显示安装提示的逻辑
  useEffect(() => {
    if (externalVisible !== undefined) return; // 外部控制时不自动显示

    const shouldShow = canInstall && 
                       !isInstalled && 
                       !dismissed && 
                       localStorage.getItem('pwa-install-dismissed') !== 'true';

    if (shouldShow) {
      // 延迟显示，给用户时间熟悉应用
      const timer = setTimeout(() => {
        setInternalVisible(true);
      }, 10000); // 10秒后显示

      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, dismissed, externalVisible]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await install();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onClose();
  };

  const handleRemindLater = () => {
    // 24小时后再提醒
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    localStorage.setItem('pwa-install-remind-after', tomorrow.toISOString());
    onClose();
  };

  // 获取平台特定的安装说明
  const getInstallInstructions = () => {
    if (isIOS) {
      return {
        icon: '🍎',
        title: 'iOS 安装指南',
        steps: [
          '点击浏览器底部的"分享"按钮',
          '向下滚动找到"添加到主屏幕"',
          '点击"添加"完成安装',
        ],
      };
    } else if (isAndroid) {
      return {
        icon: '🤖',
        title: 'Android 安装指南',
        steps: [
          '点击浏览器菜单（三个点）',
          '选择"添加到主屏幕"',
          '确认添加应用图标',
        ],
      };
    } else {
      return {
        icon: '💻',
        title: '桌面安装指南',
        steps: [
          '点击地址栏右侧的安装图标',
          '在弹出窗口中点击"安装"',
          '应用将添加到您的桌面',
        ],
      };
    }
  };

  const installGuide = getInstallInstructions();

  const features = [
    {
      icon: <RocketOutlined />,
      title: '快速启动',
      description: '像本地应用一样快速启动',
    },
    {
      icon: <MobileOutlined />,
      title: '离线访问',
      description: '无网络时也能查看已缓存的数据',
    },
    {
      icon: <SafetyCertificateOutlined />,
      title: '安全可靠',
      description: '数据安全，隐私保护',
    },
    {
      icon: <StarOutlined />,
      title: '更好体验',
      description: '全屏体验，无浏览器干扰',
    },
  ];

  if (!canInstall || isInstalled) {
    return null;
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '90%' : 480}
      className="pwa-install-modal"
      closeIcon={<CloseOutlined />}
      centered
    >
      <div className="pwa-install-content">
        {/* 头部 */}
        <div className="pwa-install-header">
          <div className="pwa-app-icon">💰</div>
          <Title level={3} className="pwa-install-title">
            安装财务管理应用
          </Title>
          <Text className="pwa-install-subtitle">
            获得更好的使用体验
          </Text>
        </div>

        {/* 特性展示 */}
        <div className="pwa-features">
          <Row gutter={[16, 16]}>
            {features.map((feature, index) => (
              <Col span={12} key={index}>
                <Card size="small" className="pwa-feature-card">
                  <Space direction="vertical" align="center" size="small">
                    <div className="pwa-feature-icon">
                      {feature.icon}
                    </div>
                    <Text strong className="pwa-feature-title">
                      {feature.title}
                    </Text>
                    <Text className="pwa-feature-desc">
                      {feature.description}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 安装按钮 */}
        <div className="pwa-install-actions">
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            loading={installing}
            onClick={handleInstall}
            className="pwa-install-button"
            block
          >
            {installing ? '正在安装...' : '立即安装'}
          </Button>

          <Space className="pwa-secondary-actions">
            <Button onClick={handleRemindLater}>
              稍后提醒
            </Button>
            <Button onClick={handleDismiss}>
              不再提示
            </Button>
          </Space>
        </div>

        {/* 手动安装指南 */}
        {!canInstall && (
          <div className="pwa-manual-install">
            <Title level={5}>
              {installGuide.icon} {installGuide.title}
            </Title>
            <ol className="pwa-install-steps">
              {installGuide.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* 底部说明 */}
        <div className="pwa-install-footer">
          <Paragraph className="pwa-install-note">
            💡 安装后，您可以从主屏幕直接访问应用，享受原生应用般的体验
          </Paragraph>
        </div>
      </div>
    </Modal>
  );
};

export default PWAInstallPrompt;