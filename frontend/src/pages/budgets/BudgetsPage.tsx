import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  DatePicker, 
  message, 
  Popconfirm, 
  Space,
  Tag,
  Progress,
  Row,
  Col,
  Statistic,
  Alert,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  WalletOutlined,
  TargetOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../services/api';

const { RangePicker } = DatePicker;

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  period: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  alertThreshold: number;
  accountId?: string;
  account?: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

const BudgetsPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [form] = Form.useForm();

  const periodOptions = [
    { value: 'WEEKLY', label: '每周' },
    { value: 'MONTHLY', label: '每月' },
    { value: 'QUARTERLY', label: '每季度' },
    { value: 'YEARLY', label: '每年' },
    { value: 'CUSTOM', label: '自定义' }
  ];

  useEffect(() => {
    fetchBudgets();
    fetchAccounts();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/budgets');
      if (response.data.success) {
        setBudgets(response.data.data);
      }
    } catch (error) {
      message.error('获取预算列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/api/accounts');
      if (response.data.success) {
        setAccounts(response.data.data);
      }
    } catch (error) {
      console.error('获取账户列表失败', error);
    }
  };

  const handleAddBudget = () => {
    setEditingBudget(null);
    form.resetFields();
    form.setFieldsValue({
      period: 'MONTHLY',
      alertThreshold: 0.8,
      isActive: true
    });
    setModalVisible(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    form.setFieldsValue({
      ...budget,
      dateRange: [dayjs(budget.startDate), dayjs(budget.endDate)]
    });
    setModalVisible(true);
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const response = await api.delete(`/api/budgets/${id}`);
      if (response.data.success) {
        message.success('预算删除成功');
        fetchBudgets();
      }
    } catch (error) {
      message.error('删除预算失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        ...values,
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString(),
        dateRange: undefined
      };

      if (editingBudget) {
        const response = await api.put(`/api/budgets/${editingBudget.id}`, submitData);
        if (response.data.success) {
          message.success('预算更新成功');
        }
      } else {
        const response = await api.post('/api/budgets', submitData);
        if (response.data.success) {
          message.success('预算创建成功');
        }
      }
      setModalVisible(false);
      fetchBudgets();
    } catch (error) {
      message.error(editingBudget ? '更新预算失败' : '创建预算失败');
    }
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.amount) * 100;
    const remaining = budget.amount - budget.spent;
    const isOverBudget = percentage > 100;
    const isNearLimit = percentage >= (budget.alertThreshold * 100);
    
    return {
      percentage,
      remaining,
      isOverBudget,
      isNearLimit,
      status: isOverBudget ? 'exception' : isNearLimit ? 'warning' : 'success'
    };
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const getDaysRemaining = (endDate: string) => {
    const end = dayjs(endDate);
    const now = dayjs();
    return end.diff(now, 'day');
  };

  const columns: ColumnsType<Budget> = [
    {
      title: '预算名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.account && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              关联账户：{record.account.name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '预算金额',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 'bold' }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: '已使用',
      dataIndex: 'spent',
      key: 'spent',
      align: 'right',
      render: (spent, record) => {
        const status = getBudgetStatus(record);
        return (
          <div>
            <div style={{ 
              fontWeight: 'bold',
              color: status.isOverBudget ? '#f5222d' : '#52c41a'
            }}>
              {formatCurrency(spent)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              剩余：{formatCurrency(status.remaining)}
            </div>
          </div>
        );
      },
    },
    {
      title: '进度',
      key: 'progress',
      render: (_, record) => {
        const status = getBudgetStatus(record);
        return (
          <div style={{ width: '120px' }}>
            <Progress
              percent={Math.min(status.percentage, 100)}
              status={status.status as any}
              size="small"
              format={(percent) => `${percent?.toFixed(1)}%`}
            />
            {status.isOverBudget && (
              <div style={{ fontSize: '12px', color: '#f5222d' }}>
                超支 {formatCurrency(Math.abs(status.remaining))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '周期',
      dataIndex: 'period',
      key: 'period',
      render: (period, record) => {
        const periodLabel = periodOptions.find(p => p.value === period)?.label || period;
        const daysRemaining = getDaysRemaining(record.endDate);
        return (
          <div>
            <Tag color="blue">{periodLabel}</Tag>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {daysRemaining > 0 ? `剩余 ${daysRemaining} 天` : '已结束'}
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const status = getBudgetStatus(record);
        const daysRemaining = getDaysRemaining(record.endDate);
        
        if (!record.isActive) {
          return <Badge status="default" text="已禁用" />;
        }
        
        if (daysRemaining < 0) {
          return <Badge status="error" text="已结束" />;
        }
        
        if (status.isOverBudget) {
          return <Badge status="error" text="超支" />;
        }
        
        if (status.isNearLimit) {
          return <Badge status="warning" text="接近限额" />;
        }
        
        return <Badge status="success" text="正常" />;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEditBudget(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个预算吗？"
            onConfirm={() => handleDeleteBudget(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 计算统计数据
  const activeBudgets = budgets.filter(budget => budget.isActive);
  const totalBudgetAmount = activeBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = activeBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const overBudgetCount = activeBudgets.filter(budget => {
    const status = getBudgetStatus(budget);
    return status.isOverBudget;
  }).length;
  const nearLimitCount = activeBudgets.filter(budget => {
    const status = getBudgetStatus(budget);
    return status.isNearLimit && !status.isOverBudget;
  }).length;

  // 预警提醒
  const alertBudgets = activeBudgets.filter(budget => {
    const status = getBudgetStatus(budget);
    return status.isOverBudget || status.isNearLimit;
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>预算管理</h1>
        <p>设置和监控您的支出预算，合理规划财务支出</p>
      </div>

      {/* 预警提醒 */}
      {alertBudgets.length > 0 && (
        <Alert
          message="预算预警"
          description={
            <div>
              {alertBudgets.map(budget => {
                const status = getBudgetStatus(budget);
                return (
                  <div key={budget.id} style={{ marginBottom: '4px' }}>
                    <WarningOutlined style={{ color: status.isOverBudget ? '#f5222d' : '#faad14' }} />
                    {' '}
                    <strong>{budget.name}</strong>
                    {status.isOverBudget 
                      ? ` 已超支 ${formatCurrency(Math.abs(status.remaining))}`
                      : ` 已使用 ${status.percentage.toFixed(1)}%，接近预算限额`
                    }
                  </div>
                );
              })}
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总预算金额"
              value={totalBudgetAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已使用金额"
              value={totalSpent}
              precision={2}
              prefix="¥"
              valueStyle={{ color: totalSpent > totalBudgetAmount ? '#f5222d' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="超支预算"
              value={overBudgetCount}
              prefix={<WarningOutlined />}
              valueStyle={{ color: overBudgetCount > 0 ? '#f5222d' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="接近限额"
              value={nearLimitCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: nearLimitCount > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 预算使用率总览 */}
      <Card style={{ marginBottom: '24px' }}>
        <h3>预算使用率总览</h3>
        <div style={{ marginTop: '16px' }}>
          <Progress
            percent={(totalSpent / totalBudgetAmount) * 100}
            status={totalSpent > totalBudgetAmount ? 'exception' : 'success'}
            strokeWidth={20}
            format={(percent) => (
              <span style={{ color: 'white' }}>
                {formatCurrency(totalSpent)} / {formatCurrency(totalBudgetAmount)}
              </span>
            )}
          />
        </div>
      </Card>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3>预算列表</h3>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddBudget}
          >
            添加预算
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={budgets}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingBudget ? '编辑预算' : '添加预算'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="预算名称"
            rules={[{ required: true, message: '请输入预算名称' }]}
          >
            <Input placeholder="例如：餐饮预算" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="预算金额"
                rules={[{ required: true, message: '请输入预算金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  precision={2}
                  min={0}
                  placeholder="0.00"
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="period"
                label="预算周期"
                rules={[{ required: true, message: '请选择预算周期' }]}
              >
                <Select placeholder="选择预算周期">
                  {periodOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dateRange"
            label="预算时间范围"
            rules={[{ required: true, message: '请选择预算时间范围' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="alertThreshold"
                label="预警阈值"
                rules={[{ required: true, message: '请输入预警阈值' }]}
                initialValue={0.8}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={1}
                  step={0.1}
                  precision={1}
                  formatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
                  parser={(value) => Number(value!.replace('%', '')) / 100}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="accountId"
                label="关联账户"
              >
                <Select placeholder="选择关联账户（可选）" allowClear>
                  {accounts.map(account => (
                    <Select.Option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingBudget ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BudgetsPage; 