import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Badge,
  Row,
  Col,
  Statistic,
  Space,
  Button,
  Typography
} from 'antd';
import {
  BellOutlined,
  SettingOutlined,
  WarningOutlined,
  DollarOutlined
} from '@ant-design/icons';

// 导入通知组件
import NotificationCenter from '../../components/notifications/NotificationCenter';
import NotificationSettings from '../../components/notifications/NotificationSettings';
import BudgetAlerts from '../../components/notifications/BudgetAlerts';

const { Title, Text } = Typography;
const { TabPane } = TabPane;

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('center');

  // 模拟统计数据
  const stats = {
    unreadNotifications: 3,
    activeAlerts: 2,
    totalNotifications: 15,
    resolvedAlerts: 8
  };

  const handleBudgetAlertClick = (budgetId: string) => {
    // 这里可以跳转到预算详情页面
    console.log('跳转到预算详情:', budgetId);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BellOutlined style={{ marginRight: '8px' }} />
          通知与提醒
        </Title>
        <Text type="secondary">
          管理您的财务通知、预算提醒和系统告警
        </Text>
      </div>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="未读通知"
              value={stats.unreadNotifications}
              prefix={<BellOutlined />}
              valueStyle={{ color: stats.unreadNotifications > 0 ? '#1890ff' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃提醒"
              value={stats.activeAlerts}
              prefix={<WarningOutlined />}
              valueStyle={{ color: stats.activeAlerts > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总通知数"
              value={stats.totalNotifications}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已解决问题"
              value={stats.resolvedAlerts}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          tabBarExtraContent={
            <Space>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setActiveTab('settings')}
              >
                通知设置
              </Button>
            </Space>
          }
        >
          <TabPane
            tab={
              <Badge count={stats.unreadNotifications} size="small">
                <span>
                  <BellOutlined />
                  通知中心
                </span>
              </Badge>
            }
            key="center"
          >
            <NotificationCenter />
          </TabPane>

          <TabPane
            tab={
              <Badge count={stats.activeAlerts} size="small">
                <span>
                  <WarningOutlined />
                  预算提醒
                </span>
              </Badge>
            }
            key="alerts"
          >
            <BudgetAlerts onAlertClick={handleBudgetAlertClick} />
          </TabPane>

          <TabPane
            tab={
              <span>
                <SettingOutlined />
                通知设置
              </span>
            }
            key="settings"
          >
            <NotificationSettings />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default NotificationsPage;
