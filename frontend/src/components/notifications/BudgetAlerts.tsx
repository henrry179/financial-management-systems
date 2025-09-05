import React, { useState, useEffect } from 'react';
import {
  Card,
  Alert,
  List,
  Avatar,
  Button,
  Space,
  Typography,
  Progress,
  Tag,
  Modal,
  Form,
  InputNumber,
  message
} from 'antd';
import {
  WarningOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface BudgetAlert {
  id: string;
  budgetId: string;
  budgetName: string;
  currentAmount: number;
  budgetAmount: number;
  percentage: number;
  alertType: 'warning' | 'danger' | 'info';
  message: string;
  createdAt: string;
  isResolved: boolean;
  resolvedAt?: string;
}

interface BudgetAlertsProps {
  onAlertClick?: (budgetId: string) => void;
}

const BudgetAlerts: React.FC<BudgetAlertsProps> = ({ onAlertClick }) => {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<BudgetAlert | null>(null);
  const [form] = Form.useForm();

  // 模拟预算提醒数据
  useEffect(() => {
    const mockAlerts: BudgetAlert[] = [
      {
        id: '1',
        budgetId: 'budget-1',
        budgetName: '餐饮预算',
        currentAmount: 680,
        budgetAmount: 600,
        percentage: 113.3,
        alertType: 'danger',
        message: '餐饮预算已超支13.3%，建议立即调整支出',
        createdAt: dayjs().subtract(2, 'hours').toISOString(),
        isResolved: false
      },
      {
        id: '2',
        budgetId: 'budget-2',
        budgetName: '交通预算',
        currentAmount: 480,
        budgetAmount: 500,
        percentage: 96.0,
        alertType: 'warning',
        message: '交通预算已使用96%，接近预算限额',
        createdAt: dayjs().subtract(1, 'day').toISOString(),
        isResolved: false
      },
      {
        id: '3',
        budgetId: 'budget-3',
        budgetName: '娱乐预算',
        currentAmount: 50,
        budgetAmount: 300,
        percentage: 16.7,
        alertType: 'info',
        message: '娱乐预算使用率较低，还有较大调整空间',
        createdAt: dayjs().subtract(3, 'days').toISOString(),
        isResolved: false
      }
    ];
    setAlerts(mockAlerts);
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'red';
      case 'warning':
        return 'orange';
      case 'info':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getProgressStatus = (percentage: number) => {
    if (percentage > 100) return 'exception';
    if (percentage > 80) return 'warning';
    return 'success';
  };

  const handleAlertClick = (alert: BudgetAlert) => {
    if (onAlertClick) {
      onAlertClick(alert.budgetId);
    }
  };

  const handleAdjustBudget = (alert: BudgetAlert) => {
    setSelectedAlert(alert);
    form.setFieldsValue({
      newAmount: alert.budgetAmount
    });
    setAdjustModalVisible(true);
  };

  const handleAdjustSubmit = async (values: any) => {
    try {
      // 这里可以调用API调整预算
      console.log('调整预算:', {
        budgetId: selectedAlert?.budgetId,
        newAmount: values.newAmount
      });

      // 更新本地状态
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === selectedAlert?.id
            ? {
                ...alert,
                budgetAmount: values.newAmount,
                percentage: (alert.currentAmount / values.newAmount) * 100,
                isResolved: (alert.currentAmount / values.newAmount) * 100 <= 80
              }
            : alert
        )
      );

      setAdjustModalVisible(false);
      setSelectedAlert(null);
      message.success('预算调整成功');
    } catch (error) {
      message.error('预算调整失败');
    }
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, isResolved: true, resolvedAt: dayjs().toISOString() }
          : alert
      )
    );
    message.success('提醒已标记为已解决');
  };

  const activeAlerts = alerts.filter(alert => !alert.isResolved);
  const resolvedAlerts = alerts.filter(alert => alert.isResolved);

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div>
      {/* 活跃提醒 */}
      {activeAlerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          {activeAlerts.map(alert => (
            <Alert
              key={alert.id}
              message={
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <Space>
                      <Text strong>{alert.budgetName}</Text>
                      <Tag color={getAlertColor(alert.alertType)}>
                        {alert.alertType === 'danger' ? '超支' :
                         alert.alertType === 'warning' ? '预警' : '提示'}
                      </Tag>
                    </Space>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    {alert.message}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <Progress
                      percent={Math.min(alert.percentage, 100)}
                      status={getProgressStatus(alert.percentage)}
                      size="small"
                      format={(percent) => `${percent?.toFixed(1)}%`}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    已使用: {formatCurrency(alert.currentAmount)} / 预算: {formatCurrency(alert.budgetAmount)}
                  </div>
                </div>
              }
              description={
                <Space>
                  <Button
                    size="small"
                    onClick={() => handleAlertClick(alert)}
                  >
                    查看详情
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleAdjustBudget(alert)}
                  >
                    调整预算
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    标记已解决
                  </Button>
                </Space>
              }
              type={alert.alertType === 'danger' ? 'error' :
                   alert.alertType === 'warning' ? 'warning' : 'info'}
              showIcon
              style={{ marginBottom: '12px' }}
            />
          ))}
        </div>
      )}

      {/* 提醒历史 */}
      <Card title="预算提醒历史">
        <List
          itemLayout="horizontal"
          dataSource={alerts}
          renderItem={(alert) => (
            <List.Item
              actions={[
                alert.isResolved ? (
                  <Tag color="green">
                    <CheckCircleOutlined />
                    已解决
                  </Tag>
                ) : (
                  <Space>
                    <Button
                      size="small"
                      onClick={() => handleAlertClick(alert)}
                    >
                      查看
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      解决
                    </Button>
                  </Space>
                )
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={getAlertIcon(alert.alertType)}
                    style={{
                      backgroundColor: alert.alertType === 'danger' ? '#fff2f0' :
                                     alert.alertType === 'warning' ? '#fffbe6' : '#f6ffed'
                    }}
                  />
                }
                title={
                  <Space>
                    <span>{alert.budgetName}</span>
                    <Tag size="small" color={getAlertColor(alert.alertType)}>
                      {alert.alertType === 'danger' ? '超支' :
                       alert.alertType === 'warning' ? '预警' : '提示'}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <div>{alert.message}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {dayjs(alert.createdAt).format('YYYY-MM-DD HH:mm')}
                      {alert.resolvedAt && (
                        <span style={{ marginLeft: '12px' }}>
                          解决时间: {dayjs(alert.resolvedAt).format('YYYY-MM-DD HH:mm')}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <Progress
                        percent={Math.min(alert.percentage, 100)}
                        status={getProgressStatus(alert.percentage)}
                        size="small"
                        format={(percent) => `${percent?.toFixed(1)}%`}
                      />
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />

        {alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
            <div>
              <Text strong>暂无预算提醒</Text>
            </div>
            <div style={{ color: '#666', marginTop: '8px' }}>
              您的预算使用情况正常，无需特别关注
            </div>
          </div>
        )}
      </Card>

      {/* 调整预算模态框 */}
      <Modal
        title={`调整预算 - ${selectedAlert?.budgetName}`}
        open={adjustModalVisible}
        onCancel={() => {
          setAdjustModalVisible(false);
          setSelectedAlert(null);
        }}
        footer={null}
        width={400}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAdjustSubmit}
        >
          <Form.Item
            label="当前使用金额"
            style={{ marginBottom: '8px' }}
          >
            <Text strong style={{ fontSize: '16px' }}>
              {selectedAlert && formatCurrency(selectedAlert.currentAmount)}
            </Text>
          </Form.Item>

          <Form.Item
            label="当前预算金额"
            style={{ marginBottom: '16px' }}
          >
            <Text style={{ color: '#666' }}>
              {selectedAlert && formatCurrency(selectedAlert.budgetAmount)}
            </Text>
          </Form.Item>

          <Form.Item
            name="newAmount"
            label="新的预算金额"
            rules={[
              { required: true, message: '请输入新的预算金额' },
              {
                type: 'number',
                min: selectedAlert?.currentAmount || 0,
                message: '新预算金额不能小于当前使用金额'
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={selectedAlert?.currentAmount || 0}
              step={50}
              formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/¥\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAdjustModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                调整预算
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BudgetAlerts;
