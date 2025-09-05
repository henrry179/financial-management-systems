import React from 'react';
import { Avatar, Dropdown, Button, Space, Typography, Divider, message } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined, 
  BellOutlined,
  CrownOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from './AuthProvider';

const { Text } = Typography;

const AuthStatusIndicator: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
  };

  const handleProfile = () => {
    message.info('个人资料功能开发中...');
  };

  const handleSettings = () => {
    message.info('设置功能开发中...');
  };

  const handleNotifications = () => {
    message.info('通知功能开发中...');
  };

  if (!isAuthenticated) {
    return (
      <Space>
        <Button type="primary" href="/auth/login">
          登录
        </Button>
        <Button href="/auth/register">
          注册
        </Button>
      </Space>
    );
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: handleProfile,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
      onClick: handleSettings,
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '通知中心',
      onClick: handleNotifications,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Space>
      {/* 用户状态指示器 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '8px 12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        color: 'white'
      }}>
        <ThunderboltOutlined style={{ marginRight: '6px', fontSize: '12px' }} />
        <Text style={{ color: 'white', fontSize: '12px' }}>
          {user?.email || '用户'}
        </Text>
      </div>

      {/* 用户头像和下拉菜单 */}
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomRight"
        trigger={['click']}
      >
        <Button
          type="text"
          style={{
            padding: 0,
            height: 'auto',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Avatar
            size="small"
            icon={<UserOutlined />}
            src={user?.avatar}
            style={{
              backgroundColor: '#1890ff',
              marginRight: '8px',
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.2 }}>
              {user?.username || user?.email || '用户'}
            </div>
            <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.2 }}>
              {user?.isVerified ? (
                <Space size={4}>
                  <CrownOutlined style={{ color: '#faad14' }} />
                  <span>已验证</span>
                </Space>
              ) : (
                '未验证'
              )}
            </div>
          </div>
        </Button>
      </Dropdown>
    </Space>
  );
};

export default AuthStatusIndicator;
