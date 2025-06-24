import React from 'react';
import { Typography } from 'antd';
import { useSafeArea } from '../../hooks/useMobile';
import './MobileHeader.css';

const { Title } = Typography;

interface MobileHeaderProps {
  title?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  backgroundColor?: string;
  fixed?: boolean;
  showBorder?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  leftContent,
  rightContent,
  backgroundColor = '#fff',
  fixed = true,
  showBorder = true,
  className = '',
  style = {},
}) => {
  const safeAreaInsets = useSafeArea();

  const headerStyle: React.CSSProperties = {
    backgroundColor,
    paddingTop: safeAreaInsets.top,
    ...style,
  };

  return (
    <div 
      className={`mobile-header ${fixed ? 'mobile-header-fixed' : ''} ${showBorder ? 'mobile-header-border' : ''} ${className}`}
      style={headerStyle}
    >
      <div className="mobile-header-content">
        <div className="mobile-header-left">
          {leftContent}
        </div>
        
        <div className="mobile-header-center">
          {title && (
            <Title level={5} className="mobile-header-title">
              {title}
            </Title>
          )}
        </div>
        
        <div className="mobile-header-right">
          {rightContent}
        </div>
      </div>
    </div>
  );
};

export default MobileHeader; 