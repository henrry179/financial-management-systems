import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';

interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, isAuthenticated, error, clearError } = useAuthStore();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values: RegisterFormData) => {
    try {
      setLoading(true);
      clearError();
      
      const { confirmPassword, ...registerData } = values;
      await register(registerData);
      
      setSuccess(true);
      form.resetFields();
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ color: '#52c41a', marginBottom: '16px' }}>注册成功！</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          我们已向您的邮箱发送了验证邮件，请查收并完成邮箱验证。
        </p>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            size="large" 
            onClick={() => setSuccess(false)}
            style={{ width: '100%' }}
          >
            继续注册
          </Button>
          <Link to="/auth/login">
            <Button size="large" style={{ width: '100%' }}>
              返回登录
            </Button>
          </Link>
        </Space>
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert
          message="注册失败"
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
        name="register"
        onFinish={handleSubmit}
        size="large"
        autoComplete="off"
        layout="vertical"
      >
        <Form.Item
          name="email"
          label="邮箱地址"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="请输入邮箱地址"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, max: 20, message: '用户名长度为3-20个字符' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="请输入用户名"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          name="firstName"
          label="姓"
          rules={[
            { max: 50, message: '姓不能超过50个字符' },
          ]}
        >
          <Input
            prefix={<IdcardOutlined />}
            placeholder="请输入姓（可选）"
          />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="名"
          rules={[
            { max: 50, message: '名不能超过50个字符' },
          ]}
        >
          <Input
            prefix={<IdcardOutlined />}
            placeholder="请输入名（可选）"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 8, message: '密码至少8位字符' },
            { 
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
              message: '密码必须包含大小写字母、数字和特殊字符'
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入密码"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认密码"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请再次输入密码"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
          >
            注册账户
          </Button>
        </Form.Item>
      </Form>

      <Divider>或</Divider>

      <div style={{ textAlign: 'center' }}>
        已有账户？ <Link to="/auth/login">立即登录</Link>
      </div>

      {/* 注册说明 */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: '#f6f8fa', 
        borderRadius: 6,
        fontSize: 12,
        color: '#666'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>注册说明</div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          <li>用户名长度3-20个字符，只能包含字母、数字和下划线</li>
          <li>密码至少8位，必须包含大小写字母、数字和特殊字符</li>
          <li>注册后需要验证邮箱才能正常使用系统</li>
          <li>我们承诺保护您的隐私，不会泄露您的个人信息</li>
        </ul>
      </div>
    </>
  );
};

export default RegisterPage; 