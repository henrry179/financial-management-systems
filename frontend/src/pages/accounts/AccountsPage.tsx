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
  message, 
  Popconfirm, 
  Space,
  Tag,
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  WalletOutlined,
  BankOutlined,
  CreditCardOutlined,
  MoneyCollectOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../services/api';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  description?: string;
  bankName?: string;
  accountNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form] = Form.useForm();

  const accountTypes = [
    { value: 'CASH', label: '现金', icon: <MoneyCollectOutlined /> },
    { value: 'SAVINGS', label: '储蓄账户', icon: <BankOutlined /> },
    { value: 'CHECKING', label: '支票账户', icon: <BankOutlined /> },
    { value: 'CREDIT_CARD', label: '信用卡', icon: <CreditCardOutlined /> },
    { value: 'INVESTMENT', label: '投资账户', icon: <WalletOutlined /> },
    { value: 'LOAN', label: '贷款账户', icon: <BankOutlined /> },
    { value: 'OTHER', label: '其他', icon: <WalletOutlined /> }
  ];

  const currencies = [
    { value: 'CNY', label: '人民币 (¥)' },
    { value: 'USD', label: '美元 ($)' },
    { value: 'EUR', label: '欧元 (€)' },
    { value: 'GBP', label: '英镑 (£)' },
    { value: 'JPY', label: '日元 (¥)' }
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/accounts');
      if (response.data.success) {
        setAccounts(response.data.data);
      }
    } catch (error) {
      message.error('获取账户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    form.setFieldsValue(account);
    setModalVisible(true);
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      const response = await api.delete(`/api/accounts/${id}`);
      if (response.data.success) {
        message.success('账户删除成功');
        fetchAccounts();
      }
    } catch (error) {
      message.error('删除账户失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingAccount) {
        const response = await api.put(`/api/accounts/${editingAccount.id}`, values);
        if (response.data.success) {
          message.success('账户更新成功');
        }
      } else {
        const response = await api.post('/api/accounts', values);
        if (response.data.success) {
          message.success('账户创建成功');
        }
      }
      setModalVisible(false);
      fetchAccounts();
    } catch (error) {
      message.error(editingAccount ? '更新账户失败' : '创建账户失败');
    }
  };

  const getAccountTypeIcon = (type: string) => {
    const accountType = accountTypes.find(t => t.value === type);
    return accountType?.icon || <WalletOutlined />;
  };

  const getAccountTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'CASH': 'green',
      'SAVINGS': 'blue',
      'CHECKING': 'cyan',
      'CREDIT_CARD': 'orange',
      'INVESTMENT': 'purple',
      'LOAN': 'red',
      'OTHER': 'default'
    };
    return colors[type] || 'default';
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      'CNY': '¥',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥'
    };
    return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
  };

  const columns: ColumnsType<Account> = [
    {
      title: '账户名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {getAccountTypeIcon(record.type)}
          <span style={{ fontWeight: 'bold' }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '账户类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const accountType = accountTypes.find(t => t.value === type);
        return (
          <Tag color={getAccountTypeColor(type)}>
            {accountType?.label || type}
          </Tag>
        );
      },
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
      render: (balance, record) => (
        <span style={{ 
          fontWeight: 'bold',
          color: balance >= 0 ? '#52c41a' : '#f5222d'
        }}>
          {formatCurrency(balance, record.currency)}
        </span>
      ),
    },
    {
      title: '银行',
      dataIndex: 'bankName',
      key: 'bankName',
      render: (bankName) => bankName || '-',
    },
    {
      title: '账号',
      dataIndex: 'accountNumber',
      key: 'accountNumber',
      render: (accountNumber) => {
        if (!accountNumber) return '-';
        return accountNumber.replace(/(.{4})/g, '$1 ').trim();
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '活跃' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEditAccount(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个账户吗？"
            onConfirm={() => handleDeleteAccount(record.id)}
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
  const totalBalance = accounts.reduce((sum, account) => {
    if (account.currency === 'CNY') {
      return sum + account.balance;
    }
    return sum;
  }, 0);

  const activeAccountsCount = accounts.filter(account => account.isActive).length;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>账户管理</h1>
        <p>管理您的所有账户，包括银行账户、信用卡、现金等</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总资产 (CNY)"
              value={totalBalance}
              precision={2}
              prefix="¥"
              valueStyle={{ color: totalBalance >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="账户总数"
              value={accounts.length}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃账户"
              value={activeAccountsCount}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="账户类型"
              value={new Set(accounts.map(a => a.type)).size}
              prefix={<CreditCardOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3>账户列表</h3>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddAccount}
          >
            添加账户
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={accounts}
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
        title={editingAccount ? '编辑账户' : '添加账户'}
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
            label="账户名称"
            rules={[{ required: true, message: '请输入账户名称' }]}
          >
            <Input placeholder="例如：工商银行储蓄卡" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="账户类型"
                rules={[{ required: true, message: '请选择账户类型' }]}
              >
                <Select placeholder="选择账户类型">
                  {accountTypes.map(type => (
                    <Select.Option key={type.value} value={type.value}>
                      <Space>
                        {type.icon}
                        {type.label}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currency"
                label="货币"
                rules={[{ required: true, message: '请选择货币' }]}
                initialValue="CNY"
              >
                <Select placeholder="选择货币">
                  {currencies.map(currency => (
                    <Select.Option key={currency.value} value={currency.value}>
                      {currency.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="balance"
            label="初始余额"
            rules={[{ required: true, message: '请输入初始余额' }]}
            initialValue={0}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              placeholder="0.00"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="bankName"
                label="银行名称"
              >
                <Input placeholder="例如：中国工商银行" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="accountNumber"
                label="账号"
              >
                <Input placeholder="银行账号或卡号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="账户备注信息（可选）" 
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAccount ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountsPage; 