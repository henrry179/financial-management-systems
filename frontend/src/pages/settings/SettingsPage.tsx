import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Form, 
  Input, 
  Select, 
  Switch, 
  message, 
  Space,
  Row,
  Col,
  Tabs,
  Upload,
  Avatar,
  Divider,
  List,
  Badge,
  Modal,
  InputNumber,
  TimePicker,
  ColorPicker
} from 'antd';
import { 
  UserOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  BellOutlined,
  CloudUploadOutlined,
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  CameraOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../services/api';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
}

interface SystemConfig {
  currency: string;
  language: string;
  timezone: string;
  dateFormat: string;
  theme: string;
  autoBackup: boolean;
  backupFrequency: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  passwordExpiry: number;
  sessionTimeout: number;
  ipWhitelist: string[];
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  budgetAlerts: boolean;
  transactionAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  
  const [profileForm] = Form.useForm();
  const [systemForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // 模拟获取设置数据
      const mockProfile: UserProfile = {
        id: '1',
        email: 'user@example.com',
        username: 'user',
        firstName: '张',
        lastName: '三',
        phone: '13812345678',
        dateOfBirth: '1990-01-01'
      };

      const mockSystemConfig: SystemConfig = {
        currency: 'CNY',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        dateFormat: 'YYYY-MM-DD',
        theme: 'light',
        autoBackup: true,
        backupFrequency: 'weekly'
      };

      const mockSecuritySettings: SecuritySettings = {
        twoFactorEnabled: false,
        loginNotifications: true,
        passwordExpiry: 90,
        sessionTimeout: 30,
        ipWhitelist: []
      };

      const mockNotificationSettings: NotificationSettings = {
        emailNotifications: true,
        pushNotifications: true,
        budgetAlerts: true,
        transactionAlerts: true,
        weeklyReports: true,
        monthlyReports: true,
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00'
        }
      };

      setProfile(mockProfile);
      setSystemConfig(mockSystemConfig);
      setSecuritySettings(mockSecuritySettings);
      setNotificationSettings(mockNotificationSettings);

      // 填充表单
      profileForm.setFieldsValue(mockProfile);
      systemForm.setFieldsValue(mockSystemConfig);
      securityForm.setFieldsValue(mockSecuritySettings);
      notificationForm.setFieldsValue({
        ...mockNotificationSettings,
        quietHoursStart: dayjs(mockNotificationSettings.quietHours.startTime, 'HH:mm'),
        quietHoursEnd: dayjs(mockNotificationSettings.quietHours.endTime, 'HH:mm')
      });
    } catch (error) {
      message.error('获取设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (values: any) => {
    try {
      // 处理头像上传
      const submitData = {
        ...values,
        dateOfBirth: values.dateOfBirth?.toISOString()
      };

      // API调用
      message.success('个人资料更新成功');
    } catch (error) {
      message.error('更新个人资料失败');
    }
  };

  const handleSystemSubmit = async (values: any) => {
    try {
      // API调用
      message.success('系统设置更新成功');
    } catch (error) {
      message.error('更新系统设置失败');
    }
  };

  const handleSecuritySubmit = async (values: any) => {
    try {
      // API调用
      message.success('安全设置更新成功');
    } catch (error) {
      message.error('更新安全设置失败');
    }
  };

  const handleNotificationSubmit = async (values: any) => {
    try {
      const submitData = {
        ...values,
        quietHours: {
          enabled: values.quietHoursEnabled || false,
          startTime: values.quietHoursStart?.format('HH:mm') || '22:00',
          endTime: values.quietHoursEnd?.format('HH:mm') || '08:00'
        }
      };

      // API调用
      message.success('通知设置更新成功');
    } catch (error) {
      message.error('更新通知设置失败');
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }

      // API调用修改密码
      message.success('密码修改成功');
      setChangePasswordVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error('修改密码失败');
    }
  };

  const uploadProps = {
    name: 'avatar',
    listType: 'picture-card' as const,
    className: 'avatar-uploader',
    showUploadList: false,
    beforeUpload: (file: File) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片!');
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB!');
      }
      return isJpgOrPng && isLt2M;
    },
    onChange: (info: any) => {
      if (info.file.status === 'done') {
        message.success('头像上传成功');
      }
    },
  };

  const profileTab = (
    <Card title="个人资料" style={{ minHeight: '500px' }}>
      <Form
        form={profileForm}
        layout="vertical"
        onFinish={handleProfileSubmit}
      >
        <Row gutter={[24, 24]}>
          <Col span={24} style={{ textAlign: 'center' }}>
            <Upload {...uploadProps}>
              <Avatar
                size={100}
                src={profile?.avatar}
                icon={<UserOutlined />}
                style={{ marginBottom: '16px' }}
              />
              <div>
                <CameraOutlined /> 点击上传头像
              </div>
            </Upload>
          </Col>
          
          <Col xs={24} lg={12}>
            <Form.Item
              name="firstName"
              label="姓"
              rules={[{ required: true, message: '请输入姓' }]}
            >
              <Input placeholder="请输入姓" />
            </Form.Item>
          </Col>
          
          <Col xs={24} lg={12}>
            <Form.Item
              name="lastName"
              label="名"
              rules={[{ required: true, message: '请输入名' }]}
            >
              <Input placeholder="请输入名" />
            </Form.Item>
          </Col>
          
          <Col xs={24} lg={12}>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
            </Form.Item>
          </Col>
          
          <Col xs={24} lg={12}>
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
            </Form.Item>
          </Col>
          
          <Col xs={24} lg={12}>
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
          </Col>
          
          <Col xs={24} lg={12}>
            <Form.Item
              name="dateOfBirth"
              label="出生日期"
            >
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
          <Button type="primary" htmlType="submit">
            保存更改
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const systemTab = (
    <Card title="系统配置" style={{ minHeight: '500px' }}>
      <Form
        form={systemForm}
        layout="vertical"
        onFinish={handleSystemSubmit}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Form.Item
              name="currency"
              label="默认货币"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="CNY">人民币 (¥)</Select.Option>
                <Select.Option value="USD">美元 ($)</Select.Option>
                <Select.Option value="EUR">欧元 (€)</Select.Option>
                <Select.Option value="GBP">英镑 (£)</Select.Option>
                <Select.Option value="JPY">日元 (¥)</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} lg={12}>
            <Form.Item
              name="language"
              label="语言"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="zh-CN">简体中文</Select.Option>
                <Select.Option value="zh-TW">繁体中文</Select.Option>
                <Select.Option value="en-US">English</Select.Option>
                <Select.Option value="ja-JP">日本語</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} lg={12}>
            <Form.Item
              name="timezone"
              label="时区"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="Asia/Shanghai">北京时间 (UTC+8)</Select.Option>
                <Select.Option value="Asia/Tokyo">东京时间 (UTC+9)</Select.Option>
                <Select.Option value="America/New_York">纽约时间 (UTC-5)</Select.Option>
                <Select.Option value="Europe/London">伦敦时间 (UTC+0)</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} lg={12}>
            <Form.Item
              name="dateFormat"
              label="日期格式"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="YYYY-MM-DD">2024-06-29</Select.Option>
                <Select.Option value="DD/MM/YYYY">29/06/2024</Select.Option>
                <Select.Option value="MM/DD/YYYY">06/29/2024</Select.Option>
                <Select.Option value="DD-MM-YYYY">29-06-2024</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} lg={12}>
            <Form.Item
              name="theme"
              label="主题"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="light">浅色主题</Select.Option>
                <Select.Option value="dark">深色主题</Select.Option>
                <Select.Option value="auto">跟随系统</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} lg={12}>
            <Form.Item
              name="backupFrequency"
              label="备份频率"
            >
              <Select>
                <Select.Option value="daily">每日</Select.Option>
                <Select.Option value="weekly">每周</Select.Option>
                <Select.Option value="monthly">每月</Select.Option>
                <Select.Option value="manual">手动</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Form.Item
              name="autoBackup"
              label="自动备份"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
          <Button type="primary" htmlType="submit">
            保存更改
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const securityTab = (
    <Card title="安全设置" style={{ minHeight: '500px' }}>
      <Form
        form={securityForm}
        layout="vertical"
        onFinish={handleSecuritySubmit}
      >
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>修改密码</strong>
                  <div style={{ color: '#666', fontSize: '14px' }}>定期更换密码以保护账户安全</div>
                </div>
                <Button 
                  icon={<KeyOutlined />} 
                  onClick={() => setChangePasswordVisible(true)}
                >
                  修改密码
                </Button>
              </div>
              
              <Divider />
              
              <Form.Item
                name="twoFactorEnabled"
                label="双因子认证"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="loginNotifications"
                label="登录通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="passwordExpiry"
                label="密码过期天数"
              >
                <InputNumber
                  min={30}
                  max={365}
                  style={{ width: '100%' }}
                  addonAfter="天"
                />
              </Form.Item>
              
              <Form.Item
                name="sessionTimeout"
                label="会话超时时间"
              >
                <InputNumber
                  min={5}
                  max={120}
                  style={{ width: '100%' }}
                  addonAfter="分钟"
                />
              </Form.Item>
            </Space>
          </Col>
        </Row>
        
        <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
          <Button type="primary" htmlType="submit">
            保存更改
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const notificationTab = (
    <Card title="通知设置" style={{ minHeight: '500px' }}>
      <Form
        form={notificationForm}
        layout="vertical"
        onFinish={handleNotificationSubmit}
      >
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item
                name="emailNotifications"
                label="邮件通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="pushNotifications"
                label="推送通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Divider orientation="left">交易提醒</Divider>
              
              <Form.Item
                name="budgetAlerts"
                label="预算预警"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="transactionAlerts"
                label="交易提醒"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Divider orientation="left">定期报告</Divider>
              
              <Form.Item
                name="weeklyReports"
                label="周报"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="monthlyReports"
                label="月报"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Divider orientation="left">免打扰时间</Divider>
              
              <Form.Item
                name="quietHoursEnabled"
                label="启用免打扰"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="quietHoursStart"
                    label="开始时间"
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      placeholder="选择开始时间"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="quietHoursEnd"
                    label="结束时间"
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      placeholder="选择结束时间"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Space>
          </Col>
        </Row>
        
        <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
          <Button type="primary" htmlType="submit">
            保存更改
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          个人资料
        </span>
      ),
      children: profileTab,
    },
    {
      key: 'system',
      label: (
        <span>
          <SettingOutlined />
          系统配置
        </span>
      ),
      children: systemTab,
    },
    {
      key: 'security',
      label: (
        <span>
          <SecurityScanOutlined />
          安全设置
        </span>
      ),
      children: securityTab,
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined />
          通知设置
        </span>
      ),
      children: notificationTab,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>系统设置</h1>
        <p>管理您的个人资料、系统配置、安全设置和通知偏好</p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={changePasswordVisible}
        onCancel={() => {
          setChangePasswordVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="currentPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入当前密码" 
            />
          </Form.Item>
          
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码长度至少8位' },
              { 
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: '密码必须包含大小写字母、数字和特殊字符'
              }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入新密码" 
            />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请再次输入新密码" 
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setChangePasswordVisible(false);
                passwordForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage; 