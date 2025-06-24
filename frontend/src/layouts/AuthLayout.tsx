import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';

const AuthLayout: React.FC = () => {
  return (
    <Layout className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">💰</div>
          <h1 className="auth-title">智能财务管理系统</h1>
          <p className="auth-subtitle">让财务管理变得简单高效</p>
        </div>
        <div className="auth-form">
          <Outlet />
        </div>
      </div>
    </Layout>
  );
};

export default AuthLayout; 