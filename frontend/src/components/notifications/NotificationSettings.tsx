import React, { useState } from 'react';
import {
  Card,
  Form,
  Switch,
  InputNumber,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Row,
  Col,
  Alert
} from 'antd';
import {
  MailOutlined,
  BellOutlined,
  WarningOutlined,
  DollarOutlined,
  FileTextOutlined,
  SaveOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface NotificationSettingsData {
  // 通知方式
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;

  // 预算提醒
  budgetAlertEnabled: boolean;
  budgetAlertThreshold: number; // 百分比，如80表示80%
  budgetAlertFrequency: 'daily' | 'weekly' | 'monthly';

  // 账单提醒
  billReminderEnabled: boolean;
  billReminderDays: number; // 提前几天提醒

  // 大额交易提醒
  largeTransactionEnabled: boolean;
  largeTransactionThreshold: number; // 金额阈值

  // 定期报告
  weeklyReportEnabled: boolean;
  monthlyReportEnabled: boolean;
  quarterlyReportEnabled: boolean;

  // 异常检测提醒
  anomalyDetectionEnabled: boolean;
  anomalyThreshold: number; // 异常百分比
}

const NotificationSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const initialValues: NotificationSettingsData = {
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    budgetAlertEnabled: true,
    budgetAlertThreshold: 80,
    budgetAlertFrequency: 'weekly',
    billReminderEnabled: true,
    billReminderDays: 3,
    largeTransactionEnabled: false,
    largeTransactionThreshold: 1000,
    weeklyReportEnabled: true,
    monthlyReportEnabled: true,
    quarterlyReportEnabled: false,
    anomalyDetectionEnabled: true,
    anomalyThreshold: 50
  };

  const handleSubmit = async (values: NotificationSettingsData) => {
    setLoading(true);
    try {
      // 这里可以调用API保存设置
      console.log('保存通知设置:', values);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      message.success('通知设置保存成功');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    message.info('已重置为默认设置');
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BellOutlined style={{ marginRight: '8px' }} />
          通知设置
        </Title>
        <Text type="secondary">
          配置您的财务提醒和通知偏好设置
        </Text>
      </div>

      <Alert
        message="通知设置说明"
        description="您可以在这里自定义各种财务提醒的通知方式和阈值。启用相应的通知类型后，系统会在满足条件时自动发送提醒。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSubmit}
      >
        {/* 通知方式设置 */}
        <Card title="通知方式" style={{ marginBottom: '24px' }}>
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label={
                  <Space>
                    <MailOutlined />
                    邮件通知
                  </Space>
                }
                name="emailEnabled"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label={
                  <Space>
                    <BellOutlined />
                    推送通知
                  </Space>
                }
                name="pushEnabled"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label={
                  <Space>
                    📱
                    短信通知
                  </Space>
                }
                name="smsEnabled"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 预算提醒设置 */}
        <Card
          title={
            <Space>
              <WarningOutlined />
              预算提醒
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Form.Item
            label="启用预算提醒"
            name="budgetAlertEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="提醒阈值 (%)"
                name="budgetAlertThreshold"
                rules={[
                  { required: true, message: '请输入提醒阈值' },
                  { type: 'number', min: 1, max: 100, message: '阈值必须在1-100之间' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={100}
                  formatter={(value) => `${value}%`}
                  parser={(value) => value!.replace('%', '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="提醒频率"
                name="budgetAlertFrequency"
                rules={[{ required: true, message: '请选择提醒频率' }]}
              >
                <Select style={{ width: '100%' }}>
                  <Option value="daily">每日</Option>
                  <Option value="weekly">每周</Option>
                  <Option value="monthly">每月</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Alert
            message="预算提醒说明"
            description={`当预算使用超过 ${form.getFieldValue('budgetAlertThreshold') || 80}% 时，系统会发送提醒通知。`}
            type="info"
            showIcon
          />
        </Card>

        {/* 账单提醒设置 */}
        <Card
          title={
            <Space>
              <DollarOutlined />
              账单提醒
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Form.Item
            label="启用账单到期提醒"
            name="billReminderEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="提前提醒天数"
            name="billReminderDays"
            rules={[
              { required: true, message: '请输入提醒天数' },
              { type: 'number', min: 1, max: 30, message: '天数必须在1-30之间' }
            ]}
          >
            <InputNumber
              min={1}
              max={30}
              formatter={(value) => `${value} 天`}
              parser={(value) => value!.replace(' 天', '')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Alert
            message="账单提醒说明"
            description={`系统会在账单到期前 ${form.getFieldValue('billReminderDays') || 3} 天发送提醒通知。`}
            type="info"
            showIcon
          />
        </Card>

        {/* 大额交易提醒设置 */}
        <Card
          title={
            <Space>
              💰
              大额交易提醒
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Form.Item
            label="启用大额交易提醒"
            name="largeTransactionEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="交易金额阈值 (元)"
            name="largeTransactionThreshold"
            rules={[
              { required: true, message: '请输入金额阈值' },
              { type: 'number', min: 100, message: '金额不能小于100元' }
            ]}
          >
            <InputNumber
              min={100}
              step={100}
              formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/¥\s?|(,*)/g, '')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Alert
            message="大额交易提醒说明"
            description={`单笔交易超过 ¥${(form.getFieldValue('largeTransactionThreshold') || 1000).toLocaleString()} 时，系统会发送提醒通知。`}
            type="warning"
            showIcon
          />
        </Card>

        {/* 定期报告设置 */}
        <Card
          title={
            <Space>
              <FileTextOutlined />
              定期报告
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Form.Item
            label="每周财务报告"
            name="weeklyReportEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="每月财务报告"
            name="monthlyReportEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="每季度财务报告"
            name="quarterlyReportEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Alert
            message="定期报告说明"
            description="系统会在指定周期结束时自动生成并发送财务报告，帮助您及时了解财务状况。"
            type="info"
            showIcon
          />
        </Card>

        {/* 异常检测设置 */}
        <Card
          title={
            <Space>
              🔍
              异常检测提醒
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Form.Item
            label="启用异常检测提醒"
            name="anomalyDetectionEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="异常阈值 (%)"
            name="anomalyThreshold"
            rules={[
              { required: true, message: '请输入异常阈值' },
              { type: 'number', min: 10, max: 200, message: '阈值必须在10-200之间' }
            ]}
          >
            <InputNumber
              min={10}
              max={200}
              formatter={(value) => `${value}%`}
              parser={(value) => value!.replace('%', '')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Alert
            message="异常检测说明"
            description={`当支出或收入与历史同期相比波动超过 ${form.getFieldValue('anomalyThreshold') || 50}% 时，系统会发送异常提醒。`}
            type="warning"
            showIcon
          />
        </Card>

        {/* 操作按钮 */}
        <Card>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleReset}>
                重置为默认
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存设置
              </Button>
            </Space>
          </Form.Item>
        </Card>
      </Form>
    </div>
  );
};

export default NotificationSettings;
