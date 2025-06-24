import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  tip = '加载中...',
  spinning = true,
  children,
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 32 : 24 }} spin />;

  if (children) {
    return (
      <Spin indicator={antIcon} tip={tip} spinning={spinning}>
        {children}
      </Spin>
    );
  }

  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <Spin indicator={antIcon} size={size} />
        <div className="loading-text">{tip}</div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 