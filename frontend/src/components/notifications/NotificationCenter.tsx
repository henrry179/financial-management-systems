import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Avatar,
  Badge,
  Button,
  Space,
  Typography,
  Tabs,
  Tag,
  Modal,
  Form,
  Select,
  Switch,
  Input,
  message,
  Empty,
  Popconfirm
} from 'antd';
import {
  BellOutlined,
  DollarOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  MailOutlined,
  SettingOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface Notification {
  id: string;
  type: 'budget_alert' | 'bill_reminder' | 'system' | 'transaction_alert';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
  relatedId?: string; // 关联的预算ID、账单ID等
  actionUrl?: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  budgetAlerts: boolean;
  billReminders: boolean;
  transactionAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    pushEnabled: true,
    budgetAlerts: true,
    billReminders: true,
    transactionAlerts: false,
    weeklyReports: true,
    monthlyReports: true
  });
  const [form] = Form.useForm();

  // 模拟通知数据
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'budget_alert',
        title: '预算超支提醒',
        content: '您的餐饮预算已超支15%，建议控制支出',
        isRead: false,
        createdAt: dayjs().subtract(1, 'hour').toISOString(),
        priority: 'high',
        relatedId: 'budget-1'
      },
      {
        id: '2',
        type: 'bill_reminder',
        title: '账单到期提醒',
        content: '您的信用卡账单将在3天后到期，请及时还款',
        isRead: false,
        createdAt: dayjs().subtract(2, 'hours').toISOString(),
        priority: 'medium',
        relatedId: 'account-1'
      },
      {
        id: '3',
        type: 'system',
        title: '系统更新通知',
        content: '财务管理系统已更新到最新版本，新增了智能分类功能',
        isRead: true,
        createdAt: dayjs().subtract(1, 'day').toISOString(),
        priority: 'low'
      },
      {
        id: '4',
        type: 'transaction_alert',
        title: '大额交易提醒',
        content: '检测到一笔大额支出：¥2500.00（购物）',
        isRead: false,
        createdAt: dayjs().subtract(30, 'minutes').toISOString(),
        priority: 'medium',
        relatedId: 'transaction-123'
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget_alert':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'bill_reminder':
        return <DollarOutlined style={{ color: '#1890ff' }} />;
      case 'system':
        return <InfoCircleOutlined style={{ color: '#52c41a' }} />;
      case 'transaction_alert':
        return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'default';
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
    message.success('已标记为已读');
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    message.success('通知已删除');
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    message.success('全部标记为已读');
  };

  const handleClearAllRead = () => {
    setNotifications(prev => prev.filter(n => !n.isRead));
    message.success('已清除所有已读通知');
  };

  const handleSettingsSubmit = (values: any) => {
    setSettings(values);
    setSettingsVisible(false);
    message.success('通知设置已保存');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  const notificationList = (items: Notification[]) => (
    <List
      itemLayout="horizontal"
      dataSource={items}
      renderItem={(item) => (
        <List.Item
          actions={[
            !item.isRead && (
              <Button
                type="link"
                size="small"
                onClick={() => handleMarkAsRead(item.id)}
              >
                标记已读
              </Button>
            ),
            <Popconfirm
              title="确定删除这条通知吗？"
              onConfirm={() => handleDeleteNotification(item.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          ].filter(Boolean)}
        >
          <List.Item.Meta
            avatar={
              <Badge dot={!item.isRead}>
                <Avatar icon={getNotificationIcon(item.type)} />
              </Badge>
            }
            title={
              <Space>
                <span style={{ fontWeight: item.isRead ? 'normal' : 'bold' }}>
                  {item.title}
                </span>
                <Tag size="small" color={getPriorityColor(item.priority)}>
                  {item.priority === 'high' ? '高' :
                   item.priority === 'medium' ? '中' : '低'}
                </Tag>
              </Space>
            }
            description={
              <div>
                <div style={{
                  color: item.isRead ? '#666' : '#000',
                  marginBottom: '4px'
                }}>
                  {item.content}
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                </Text>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BellOutlined style={{ marginRight: '8px' }} />
          通知中心
        </Title>
        <Text type="secondary">
          管理您的财务提醒和系统通知
        </Text>
      </div>

      {/* 统计卡片 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space size="large">
          <div>
            <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>
              {unreadCount}
            </Text>
            <br />
            <Text type="secondary">未读通知</Text>
          </div>
          <div>
            <Text strong style={{ fontSize: '24px', color: '#52c41a' }}>
              {notifications.length}
            </Text>
            <br />
            <Text type="secondary">总通知数</Text>
          </div>
          <div>
            <Text strong style={{ fontSize: '24px', color: '#faad14' }}>
              {unreadNotifications.filter(n => n.priority === 'high').length}
            </Text>
            <br />
            <Text type="secondary">高优先级</Text>
          </div>
        </Space>
      </Card>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space>
          <Button onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            全部标记已读
          </Button>
          <Button onClick={handleClearAllRead} disabled={readNotifications.length === 0}>
            清除已读通知
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setSettingsVisible(true)}
          >
            通知设置
          </Button>
        </Space>
      </Card>

      {/* 通知列表 */}
      <Card>
        <Tabs defaultActiveKey="unread">
          <TabPane
            tab={
              <span>
                <Badge count={unreadCount} size="small">
                  未读通知
                </Badge>
              </span>
            }
            key="unread"
          >
            {unreadNotifications.length > 0 ? (
              notificationList(unreadNotifications)
            ) : (
              <Empty description="暂无未读通知" />
            )}
          </TabPane>
          <TabPane
            tab={
              <span>
                <CheckCircleOutlined />
                全部通知 ({notifications.length})
              </span>
            }
            key="all"
          >
            {notifications.length > 0 ? (
              notificationList(notifications)
            ) : (
              <Empty description="暂无通知" />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* 通知设置模态框 */}
      <Modal
        title="通知设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
          onFinish={handleSettingsSubmit}
        >
          <Title level={4}>通知方式</Title>
          <Form.Item label="启用邮件通知" name="emailEnabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="启用推送通知" name="pushEnabled" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Divider />

          <Title level={4}>通知类型</Title>
          <Form.Item label="预算超支提醒" name="budgetAlerts" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="账单到期提醒" name="billReminders" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="大额交易提醒" name="transactionAlerts" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="周报" name="weeklyReports" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="月报" name="monthlyReports" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSettingsVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存设置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationCenter;
