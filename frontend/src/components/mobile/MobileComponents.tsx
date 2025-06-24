import React, { useRef } from 'react';
import { Button, Card, Input, Space, Typography } from 'antd';
import { SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTouchGesture } from '../../hooks/useMobile';
import './MobileComponents.css';

const { Title, Text } = Typography;

// 移动端触摸按钮
interface MobileTouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  size?: 'large' | 'middle' | 'small';
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export const MobileTouchButton: React.FC<MobileTouchButtonProps> = ({
  children,
  onClick,
  onLongPress,
  type = 'default',
  size = 'middle',
  className = '',
  style = {},
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout>();

  useTouchGesture(buttonRef, {
    onTouchStart: () => {
      if (onLongPress && !disabled) {
        longPressTimerRef.current = setTimeout(() => {
          onLongPress();
        }, 500); // 500ms 长按
      }
    },
    onTouchEnd: () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    },
  });

  return (
    <Button
      ref={buttonRef}
      type={type}
      size={size}
      className={`mobile-touch-button ${className}`}
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

// 移动端卡片
interface MobileCardProps {
  children: React.ReactNode;
  title?: string;
  extra?: React.ReactNode;
  onTap?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  style?: React.CSSProperties;
  hoverable?: boolean;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  title,
  extra,
  onTap,
  onSwipeLeft,
  onSwipeRight,
  className = '',
  style = {},
  hoverable = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useTouchGesture(cardRef, {
    onSwipeLeft,
    onSwipeRight,
  });

  return (
    <Card
      ref={cardRef}
      title={title}
      extra={extra}
      className={`mobile-card ${className}`}
      style={style}
      hoverable={hoverable}
      onClick={onTap}
    >
      {children}
    </Card>
  );
};

// 移动端搜索框
interface MobileSearchProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const MobileSearch: React.FC<MobileSearchProps> = ({
  placeholder = '搜索...',
  onSearch,
  onFocus,
  onBlur,
  className = '',
  style = {},
}) => {
  return (
    <Input
      prefix={<SearchOutlined />}
      placeholder={placeholder}
      className={`mobile-search ${className}`}
      style={style}
      onPressEnter={(e) => onSearch?.(e.currentTarget.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      size="large"
    />
  );
};

// 移动端导航栏
interface MobileNavBarProps {
  title: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  title,
  onBack,
  rightContent,
  backgroundColor = '#fff',
  className = '',
  style = {},
}) => {
  return (
    <div 
      className={`mobile-nav-bar ${className}`}
      style={{ backgroundColor, ...style }}
    >
      <div className="mobile-nav-left">
        {onBack && (
          <MobileTouchButton 
            type="text" 
            onClick={onBack}
            className="mobile-nav-back"
          >
            <ArrowLeftOutlined />
          </MobileTouchButton>
        )}
      </div>
      
      <div className="mobile-nav-center">
        <Title level={5} className="mobile-nav-title">
          {title}
        </Title>
      </div>
      
      <div className="mobile-nav-right">
        {rightContent}
      </div>
    </div>
  );
};

// 移动端列表项
interface MobileListItemProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
  onClick?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const MobileListItem: React.FC<MobileListItemProps> = ({
  title,
  description,
  icon,
  extra,
  onClick,
  onSwipeLeft,
  onSwipeRight,
  className = '',
  style = {},
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useTouchGesture(itemRef, {
    onSwipeLeft,
    onSwipeRight,
  });

  return (
    <div
      ref={itemRef}
      className={`mobile-list-item ${className}`}
      style={style}
      onClick={onClick}
    >
      {icon && (
        <div className="mobile-list-item-icon">
          {icon}
        </div>
      )}
      
      <div className="mobile-list-item-content">
        <div className="mobile-list-item-title">{title}</div>
        {description && (
          <div className="mobile-list-item-description">{description}</div>
        )}
      </div>
      
      {extra && (
        <div className="mobile-list-item-extra">
          {extra}
        </div>
      )}
    </div>
  );
};

// 移动端步骤条
interface MobileStepsProps {
  current: number;
  steps: Array<{
    title: string;
    description?: string;
  }>;
  className?: string;
  style?: React.CSSProperties;
}

export const MobileSteps: React.FC<MobileStepsProps> = ({
  current,
  steps,
  className = '',
  style = {},
}) => {
  return (
    <div className={`mobile-steps ${className}`} style={style}>
      {steps.map((step, index) => (
        <div 
          key={index}
          className={`mobile-step ${index === current ? 'active' : ''} ${index < current ? 'completed' : ''}`}
        >
          <div className="mobile-step-indicator">
            <span className="mobile-step-number">{index + 1}</span>
          </div>
          <div className="mobile-step-content">
            <div className="mobile-step-title">{step.title}</div>
            {step.description && (
              <div className="mobile-step-description">{step.description}</div>
            )}
          </div>
          {index < steps.length - 1 && (
            <div className="mobile-step-connector" />
          )}
        </div>
      ))}
    </div>
  );
};

// 移动端操作面板
interface MobileActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    key: string;
    text: string;
    icon?: React.ReactNode;
    color?: string;
    onClick: () => void;
  }>;
  className?: string;
  style?: React.CSSProperties;
}

export const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  visible,
  onClose,
  title,
  actions,
  className = '',
  style = {},
}) => {
  if (!visible) return null;

  return (
    <div className={`mobile-action-sheet-overlay ${className}`}>
      <div className="mobile-action-sheet" style={style}>
        {title && (
          <div className="mobile-action-sheet-header">
            <Text className="mobile-action-sheet-title">{title}</Text>
          </div>
        )}
        
        <div className="mobile-action-sheet-body">
          {actions.map((action) => (
            <div
              key={action.key}
              className="mobile-action-sheet-item"
              style={{ color: action.color }}
              onClick={() => {
                action.onClick();
                onClose();
              }}
            >
              {action.icon && (
                <span className="mobile-action-sheet-icon">{action.icon}</span>
              )}
              <span className="mobile-action-sheet-text">{action.text}</span>
            </div>
          ))}
        </div>
        
        <div className="mobile-action-sheet-footer">
          <MobileTouchButton 
            type="default" 
            size="large"
            onClick={onClose}
            className="mobile-action-sheet-cancel"
          >
            取消
          </MobileTouchButton>
        </div>
      </div>
    </div>
  );
}; 