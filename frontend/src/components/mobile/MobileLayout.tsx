import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Button,
  Drawer,
  Space,
  Typography,
  Avatar,
  Dropdown,
  Badge,
} from 'antd';
import {
  MenuOutlined,
  BellOutlined,
  UserOutlined,
  DashboardOutlined,
  TransactionOutlined,
  BankOutlined,
  TagsOutlined,
  FundOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import { useMobile, useSafeArea } from '../../hooks/useMobile';
import MobileTabBar from './MobileTabBar';
import MobileHeader from './MobileHeader';
import './MobileLayout.css';

const { Content } = Layout;
const { Text } = Typography;

interface MobileLayoutProps {
  children?: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isMobile } = useMobile();
  const safeAreaInsets = useSafeArea();

  // 菜单项配置
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表板',
      path: '/',
    },
    {
      key: '/transactions',
      icon: <TransactionOutlined />,
      label: '交易记录',
      path: '/transactions',
    },
    {
      key: '/accounts',
      icon: <BankOutlined />,
      label: '账户管理',
      path: '/accounts',
    },
    {
      key: '/categories',
      icon: <TagsOutlined />,
      label: '分类管理',
      path: '/categories',
    },
    {
      key: '/budgets',
      icon: <FundOutlined />,
      label: '预算管理',
      path: '/budgets',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '报告分析',
      path: '/reports',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      path: '/settings',
    },
  ];

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/auth/login');
      },
    },
  ];

  const handleMenuClick = (path: string) => {
    navigate(path);
    setDrawerVisible(false);
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem?.label || '财务管理';
  };

  if (!isMobile) {
    // 如果不是移动端，显示子组件（通常是桌面端布局）
    return <>{children || <Outlet />}</>;
  }

  return (
    <Layout className="mobile-layout" style={{
      paddingTop: safeAreaInsets.top,
      paddingBottom: safeAreaInsets.bottom,
    }}>
      {/* 移动端头部 */}
      <MobileHeader
        title={getCurrentPageTitle()}
        leftContent={
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
            className="mobile-header-button"
          />
        }
        rightContent={
          <Space>
            <Button
              type="text"
              icon={<Badge count={5} size="small"><BellOutlined /></Badge>}
              className="mobile-header-button"
            />
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div className="mobile-header-user">
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={user?.avatar}
                />
              </div>
            </Dropdown>
          </Space>
        }
      />

      {/* 侧边抽屉菜单 */}
      <Drawer
        title={
          <div className="mobile-drawer-header">
            <div className="mobile-drawer-logo">
              <span className="logo-icon">💰</span>
              <span className="logo-text">财务管理</span>
            </div>
            <div className="mobile-drawer-user">
              <Avatar
                size="small"
                icon={<UserOutlined />}
                src={user?.avatar}
              />
              <Text className="username">
                {user?.firstName || user?.username || '用户'}
              </Text>
            </div>
          </div>
        }
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        className="mobile-drawer"
        width={280}
      >
        <div className="mobile-menu">
          {menuItems.map((item) => (
            <div
              key={item.key}
              className={`mobile-menu-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.path)}
            >
              <span className="mobile-menu-icon">{item.icon}</span>
              <span className="mobile-menu-label">{item.label}</span>
            </div>
          ))}
        </div>
      </Drawer>

      {/* 主内容区域 */}
      <Content className="mobile-content">
        <div className="mobile-content-inner">
          {children || <Outlet />}
        </div>
      </Content>

      {/* 底部导航栏 */}
      <MobileTabBar />
    </Layout>
  );
};

export default MobileLayout; 