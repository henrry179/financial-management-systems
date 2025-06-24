import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from 'antd';
import {
  DashboardOutlined,
  TransactionOutlined,
  PlusOutlined,
  FileTextOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSafeArea } from '../../hooks/useMobile';
import './MobileTabBar.css';

interface TabItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
}

interface MobileTabBarProps {
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  showLabels?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({
  backgroundColor = '#fff',
  activeColor = '#1890ff',
  inactiveColor = '#999',
  showLabels = true,
  className = '',
  style = {},
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const safeAreaInsets = useSafeArea();

  // 底部导航项配置
  const tabItems: TabItem[] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '首页',
      path: '/',
    },
    {
      key: 'transactions',
      icon: <TransactionOutlined />,
      label: '交易',
      path: '/transactions',
      badge: 0, // 可以根据实际需要显示未读数量
    },
    {
      key: 'add',
      icon: <PlusOutlined />,
      label: '添加',
      path: '/transactions/add',
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: '报表',
      path: '/reports',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '我的',
      path: '/profile',
    },
  ];

  const handleTabClick = (path: string, key: string) => {
    if (key === 'add') {
      // 对于添加按钮，可能需要特殊处理，比如显示底部弹窗
      // 这里简单跳转到添加页面
      navigate('/transactions/add');
    } else {
      navigate(path);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const tabBarStyle: React.CSSProperties = {
    backgroundColor,
    paddingBottom: safeAreaInsets.bottom,
    ...style,
  };

  return (
    <div className={`mobile-tab-bar ${className}`} style={tabBarStyle}>
      <div className="mobile-tab-bar-content">
        {tabItems.map((item) => {
          const active = isActive(item.path);
          const isAddButton = item.key === 'add';
          
          return (
            <div
              key={item.key}
              className={`mobile-tab-item ${active ? 'mobile-tab-item-active' : ''} ${isAddButton ? 'mobile-tab-item-add' : ''}`}
              onClick={() => handleTabClick(item.path, item.key)}
            >
              <div 
                className="mobile-tab-icon"
                style={{ 
                  color: active ? activeColor : inactiveColor,
                  backgroundColor: isAddButton ? activeColor : 'transparent',
                }}
              >
                {item.badge !== undefined && item.badge > 0 ? (
                  <Badge count={item.badge} size="small">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </div>
              
              {showLabels && (
                <div 
                  className="mobile-tab-label"
                  style={{ 
                    color: active ? activeColor : inactiveColor 
                  }}
                >
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabBar; 