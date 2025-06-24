import React from 'react';
import { useMobile } from '../../hooks/useMobile';
import DashboardLayout from '../../layouts/DashboardLayout';
import MobileLayout from '../mobile/MobileLayout';

interface ResponsiveLayoutProps {
  children?: React.ReactNode;
  forceDesktop?: boolean;
  forceMobile?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  forceDesktop = false,
  forceMobile = false,
}) => {
  const { isMobile, isTablet } = useMobile();

  // 强制使用指定布局
  if (forceDesktop) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  if (forceMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  // 根据设备类型自动选择布局
  if (isMobile || isTablet) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default ResponsiveLayout; 