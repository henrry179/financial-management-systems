import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';

interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, error, clearError } = useAuthStore();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values: LoginFormData) => {
    try {
      setLoading(true);
      clearError();
      await login(values.email, values.password);
      
      // Store remember preference
      if (values.remember) {
        localStorage.setItem('rememberLogin', 'true');
      } else {
        localStorage.removeItem('rememberLogin');
      }
    } catch (error) {
      // Error is handled by the store
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Alert
          message="登录失败"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        size="large"
        autoComplete="off"
        initialValues={{
          remember: localStorage.getItem('rememberLogin') === 'true',
        }}
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="邮箱地址"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6位字符' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <Link to="/auth/forgot-password">忘记密码？</Link>
          </Space>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
          >
            登录
          </Button>
        </Form.Item>
      </Form>

      <div className="auth-divider">
        <span>或</span>
      </div>

      <div className="auth-links">
        还没有账户？ <Link to="/auth/register">立即注册</Link>
      </div>

      {/* Demo account info */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: '#f6f8fa', 
        borderRadius: 6,
        fontSize: 12,
        color: '#666'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>演示账户</div>
        <div>邮箱: admin@financial.com</div>
        <div>密码: admin123456</div>
      </div>
    </>
  );
};

export default LoginPage; 