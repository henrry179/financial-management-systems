import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Space,
  Upload,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Tabs,
  Tag,
  Statistic,
  Progress,
  Alert,
  Typography,
  Divider,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
  WechatOutlined,
  AlipayOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 交易记录接口
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  platform: 'wechat' | 'alipay' | 'manual';
  status: 'pending' | 'completed' | 'failed';
  tags?: string[];
  notes?: string;
}

const TransactionsPage: React.FC = () => {
  const [form] = Form.useForm();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'wechat' | 'alipay'>('wechat');
  const [importProgress, setImportProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // 模拟数据
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      date: '2024-01-15',
      description: '星巴克咖啡',
      amount: -35.00,
      type: 'expense',
      category: '餐饮',
      account: '微信支付',
      platform: 'wechat',
      status: 'completed',
      tags: ['咖啡', '早餐']
    },
    {
      id: '2',
      date: '2024-01-15',
      description: '工资收入',
      amount: 8500.00,
      type: 'income',
      category: '薪资',
      account: '支付宝',
      platform: 'alipay',
      status: 'completed'
    },
    {
      id: '3',
      date: '2024-01-14',
      description: '滴滴出行',
      amount: -28.50,
      type: 'expense',
      category: '交通',
      account: '微信支付',
      platform: 'wechat',
      status: 'completed'
    }
  ];

  React.useEffect(() => {
    setTransactions(mockTransactions);
  }, []);

  // 表格列定义
  const columns: ColumnsType<Transaction> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      render: (amount) => (
        <Text type={amount > 0 ? 'success' : 'danger'}>
          {amount > 0 ? '+' : ''}¥{Math.abs(amount).toFixed(2)}
        </Text>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => <Tag color="blue">{category}</Tag>
    },
    {
      title: '支付平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 120,
      render: (platform) => {
        const config = {
          wechat: { icon: <WechatOutlined />, color: 'green', text: '微信支付' },
          alipay: { icon: <AlipayOutlined />, color: 'blue', text: '支付宝' },
          manual: { icon: null, color: 'default', text: '手动录入' }
        };
        const { icon, color, text } = config[platform];
        return <Tag color={color}>{icon} {text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = {
          completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
          pending: { color: 'processing', icon: <CheckCircleOutlined />, text: '处理中' },
          failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' }
        };
        const { color, icon, text } = config[status];
        return <Tag color={color}>{icon} {text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 处理函数
  const handleAdd = () => {
    setEditingTransaction(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    form.setFieldsValue({
      ...transaction,
      date: dayjs(transaction.date)
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    message.success('删除成功');
  };

  const handleSave = async (values: any) => {
    try {
      const transactionData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        id: editingTransaction?.id || `manual_${Date.now()}`,
        platform: 'manual',
        status: 'completed'
      };

      if (editingTransaction) {
        setTransactions(prev => prev.map(t => 
          t.id === editingTransaction.id ? transactionData : t
        ));
        message.success('更新成功');
      } else {
        setTransactions(prev => [transactionData, ...prev]);
        message.success('添加成功');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 处理文件上传
  const handleFileUpload = (file: File, platform: 'wechat' | 'alipay') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // 根据平台解析数据
        const parsedData = parseTransactionData(jsonData, platform);
        setPreviewData(parsedData);
        message.success(`成功解析 ${parsedData.length} 条记录`);
      } catch (error) {
        message.error('文件解析失败，请检查文件格式');
        console.error('File parsing error:', error);
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // 阻止自动上传
  };

  // 解析交易数据
  const parseTransactionData = (data: any[], platform: 'wechat' | 'alipay') => {
    return data.map((row, index) => {
      try {
        if (platform === 'wechat') {
          // 微信支付数据格式解析
          return {
            id: `import_${Date.now()}_${index}`,
            date: parseWechatDate(row['交易时间'] || row['时间']),
            description: row['商品'] || row['商户名称'] || row['描述'] || '未知交易',
            amount: parseAmount(row['金额(元)'] || row['金额']),
            type: parseAmount(row['金额(元)'] || row['金额']) > 0 ? 'income' : 'expense',
            category: categorizeTransaction(row['商品'] || row['商户名称'] || '其他'),
            account: '微信支付',
            platform: 'wechat' as const,
            status: '已完成' === (row['当前状态'] || row['状态']) ? 'completed' as const : 'pending' as const,
            notes: row['备注'] || ''
          };
        } else {
          // 支付宝数据格式解析
          return {
            id: `import_${Date.now()}_${index}`,
            date: parseAlipayDate(row['交易创建时间'] || row['时间']),
            description: row['商品名称'] || row['交易对方'] || row['描述'] || '未知交易',
            amount: parseAmount(row['金额（元）'] || row['金额']),
            type: parseAmount(row['金额（元）'] || row['金额']) > 0 ? 'income' : 'expense',
            category: categorizeTransaction(row['商品名称'] || row['交易对方'] || '其他'),
            account: '支付宝',
            platform: 'alipay' as const,
            status: '交易成功' === (row['交易状态'] || row['状态']) ? 'completed' as const : 'pending' as const,
            notes: row['备注'] || ''
          };
        }
      } catch (error) {
        console.error('Row parsing error:', error, row);
        return null;
      }
    }).filter(Boolean);
  };

  // 解析微信日期格式
  const parseWechatDate = (dateStr: string) => {
    if (!dateStr) return dayjs().format('YYYY-MM-DD');
    // 微信格式: "2024-01-15 10:30:25" 或 "2024/1/15 10:30"
    const cleanDate = dateStr.split(' ')[0];
    return dayjs(cleanDate).format('YYYY-MM-DD');
  };

  // 解析支付宝日期格式
  const parseAlipayDate = (dateStr: string) => {
    if (!dateStr) return dayjs().format('YYYY-MM-DD');
    // 支付宝格式: "2024-01-15 10:30:25" 或 "2024年01月15日 10:30"
    const cleanDate = dateStr.split(' ')[0].replace(/年|月/g, '-').replace(/日/g, '');
    return dayjs(cleanDate).format('YYYY-MM-DD');
  };

  // 解析金额
  const parseAmount = (amountStr: string | number) => {
    if (typeof amountStr === 'number') return amountStr;
    if (!amountStr) return 0;
    // 移除货币符号和空格，保留数字、小数点和负号
    const cleanAmount = amountStr.toString().replace(/[^\d.-]/g, '');
    return parseFloat(cleanAmount) || 0;
  };

  // 智能分类
  const categorizeTransaction = (description: string) => {
    const keywords = {
      '餐饮': ['餐厅', '咖啡', '外卖', '美团', '饿了么', '麦当劳', '肯德基', '星巴克'],
      '交通': ['滴滴', '出租车', '公交', '地铁', '加油', '停车', '高铁', '飞机'],
      '购物': ['淘宝', '京东', '拼多多', '超市', '商场', '服装', '化妆品'],
      '娱乐': ['电影', '游戏', 'KTV', '健身', '旅游'],
      '生活': ['水电费', '房租', '物业', '电话费', '网费'],
      '医疗': ['医院', '药店', '体检', '诊所'],
      '教育': ['学费', '培训', '书籍', '课程']
    };

    for (const [category, keywordList] of Object.entries(keywords)) {
      if (keywordList.some(keyword => description.includes(keyword))) {
        return category;
      }
    }
    return '其他';
  };

  // 导入数据到系统
  const handleImportData = async () => {
    setLoading(true);
    setImportProgress(0);

    try {
      for (let i = 0; i < previewData.length; i++) {
        // 模拟导入进度
        await new Promise(resolve => setTimeout(resolve, 100));
        setImportProgress(Math.round(((i + 1) / previewData.length) * 100));
      }

      // 更新本地数据（实际应该重新获取）
      const newTransactions = previewData.filter(transaction => 
        !transactions.some(t => 
          t.date === transaction.date && 
          t.description === transaction.description && 
          t.amount === transaction.amount
        )
      );
      
      setTransactions(prev => [...newTransactions, ...prev]);
      message.success(`导入完成！共导入 ${newTransactions.length} 条新记录`);
      setIsImportModalVisible(false);
      setPreviewData([]);
      
    } catch (error) {
      message.error('导入失败，请重试');
    } finally {
      setLoading(false);
      setImportProgress(0);
    }
  };

  // 下载模板
  const downloadTemplate = (platform: 'wechat' | 'alipay') => {
    const templates = {
      wechat: [
        { '交易时间': '2024-01-15 10:30:25', '商品': '星巴克咖啡', '金额(元)': '-35.00', '当前状态': '已完成', '备注': '' },
        { '交易时间': '2024-01-15 12:00:00', '商品': '工资收入', '金额(元)': '8500.00', '当前状态': '已完成', '备注': '月薪' }
      ],
      alipay: [
        { '交易创建时间': '2024-01-15 10:30:25', '商品名称': '星巴克咖啡', '金额（元）': '-35.00', '交易状态': '交易成功', '备注': '' },
        { '交易创建时间': '2024-01-15 12:00:00', '商品名称': '工资收入', '金额（元）': '8500.00', '交易状态': '交易成功', '备注': '月薪' }
      ]
    };

    const ws = XLSX.utils.json_to_sheet(templates[platform]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${platform === 'wechat' ? '微信支付' : '支付宝'}导入模板.xlsx`);
  };

  // 统计数据
  const stats = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalTransactions: transactions.length,
    thisMonthTransactions: transactions.filter(t => dayjs(t.date).month() === dayjs().month()).length
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            💰 智能记账管理
          </Title>
          <Text type="secondary">
            支持微信支付、支付宝支付数据批量导入，让记账更简单
          </Text>
        </Col>
        <Col>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              手动记账
            </Button>
            <Button 
              icon={<ImportOutlined />} 
              onClick={() => setIsImportModalVisible(true)}
            >
              批量导入
            </Button>
            <Button icon={<ExportOutlined />}>
              导出数据
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月收入"
              value={stats.totalIncome}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月支出"
              value={stats.totalExpense}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="净收益"
              value={stats.totalIncome - stats.totalExpense}
              precision={2}
              prefix="¥"
              valueStyle={{ color: stats.totalIncome - stats.totalExpense > 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="交易笔数"
              value={stats.totalTransactions}
              suffix="笔"
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索交易描述"
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select placeholder="交易类型" allowClear style={{ width: '100%' }}>
              <Option value="income">收入</Option>
              <Option value="expense">支出</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select placeholder="支付平台" allowClear style={{ width: '100%' }}>
              <Option value="wechat">微信支付</Option>
              <Option value="alipay">支付宝</Option>
              <Option value="manual">手动录入</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={4}>
            <Space>
              <Button type="primary" icon={<FilterOutlined />}>
                筛选
              </Button>
              <Button>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 交易记录表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            total: transactions.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 手动记账模态框 */}
      <Modal
        title={editingTransaction ? '编辑交易' : '新增交易'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="交易日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="金额"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="正数为收入，负数为支出"
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="交易描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input placeholder="请输入交易描述" />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="选择分类">
                  <Option value="餐饮">餐饮</Option>
                  <Option value="交通">交通</Option>
                  <Option value="购物">购物</Option>
                  <Option value="娱乐">娱乐</Option>
                  <Option value="生活">生活</Option>
                  <Option value="医疗">医疗</Option>
                  <Option value="教育">教育</Option>
                  <Option value="薪资">薪资</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="account"
                label="账户"
                rules={[{ required: true, message: '请选择账户' }]}
              >
                <Select placeholder="选择账户">
                  <Option value="微信支付">微信支付</Option>
                  <Option value="支付宝">支付宝</Option>
                  <Option value="银行卡">银行卡</Option>
                  <Option value="现金">现金</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息（可选）" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTransaction ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量导入模态框 */}
      <Modal
        title="批量导入交易数据"
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        width={800}
        footer={null}
      >
        <Tabs activeKey={selectedPlatform} onChange={(key) => setSelectedPlatform(key as 'wechat' | 'alipay')}>
          <TabPane
            tab={
              <span>
                <WechatOutlined style={{ color: '#1aad19' }} />
                微信支付
              </span>
            }
            key="wechat"
          >
            <Alert
              message="微信支付数据导入说明"
              description={
                <div>
                  <p>1. 打开微信 → 我 → 支付 → 钱包 → 账单</p>
                  <p>2. 点击右上角 → 选择账单下载</p>
                  <p>3. 下载Excel格式文件并在此处上传</p>
                  <p>4. 支持字段：交易时间、商品、金额(元)、当前状态、备注</p>
                </div>
              }
              type="info"
              style={{ marginBottom: '16px' }}
            />
            
            <Space style={{ marginBottom: '16px' }}>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={() => downloadTemplate('wechat')}
              >
                下载导入模板
              </Button>
              <Upload
                accept=".xlsx,.xls"
                beforeUpload={(file) => handleFileUpload(file, 'wechat')}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>
                  选择Excel文件
                </Button>
              </Upload>
            </Space>
          </TabPane>

          <TabPane
            tab={
              <span>
                <AlipayOutlined style={{ color: '#1677ff' }} />
                支付宝
              </span>
            }
            key="alipay"
          >
            <Alert
              message="支付宝数据导入说明"
              description={
                <div>
                  <p>1. 打开支付宝 → 我的 → 账单</p>
                  <p>2. 点击右上角设置 → 账单下载</p>
                  <p>3. 选择时间范围并下载Excel格式文件</p>
                  <p>4. 支持字段：交易创建时间、商品名称、金额（元）、交易状态、备注</p>
                </div>
              }
              type="info"
              style={{ marginBottom: '16px' }}
            />
            
            <Space style={{ marginBottom: '16px' }}>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={() => downloadTemplate('alipay')}
              >
                下载导入模板
              </Button>
              <Upload
                accept=".xlsx,.xls"
                beforeUpload={(file) => handleFileUpload(file, 'alipay')}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>
                  选择Excel文件
                </Button>
              </Upload>
            </Space>
          </TabPane>
        </Tabs>

        {/* 预览数据 */}
        {previewData.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <Divider>数据预览</Divider>
            <Alert
              message={`解析到 ${previewData.length} 条记录，请确认后导入`}
              type="success"
              style={{ marginBottom: '16px' }}
            />
            
            <Table
              columns={columns.slice(0, 5)} // 只显示主要列
              dataSource={previewData.slice(0, 10)} // 只预览前10条
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
            />
            
            {previewData.length > 10 && (
              <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
                只显示前10条，共{previewData.length}条记录
              </Text>
            )}

            {/* 导入进度 */}
            {importProgress > 0 && (
              <div style={{ marginTop: '16px' }}>
                <Text strong>导入进度:</Text>
                <Progress percent={importProgress} status={importProgress === 100 ? 'success' : 'active'} />
              </div>
            )}

            <div style={{ textAlign: 'right', marginTop: '16px' }}>
              <Space>
                <Button onClick={() => setPreviewData([])}>
                  取消
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleImportData}
                  loading={loading}
                  disabled={importProgress > 0 && importProgress < 100}
                >
                  {importProgress > 0 && importProgress < 100 ? '导入中...' : '确认导入'}
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionsPage;
