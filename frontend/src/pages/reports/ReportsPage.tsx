import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  message, 
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Tabs,
  Empty,
  Typography,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  FileTextOutlined, 
  DownloadOutlined, 
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../services/api';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

interface Report {
  id: string;
  title: string;
  type: string;
  parameters: string;
  data: string;
  generatedAt: string;
  period: string;
  format: string;
  filePath?: string;
  isPublic: boolean;
}

interface ReportData {
  incomeExpenseData: Array<{ month: string; income: number; expense: number; }>;
  categoryData: Array<{ name: string; value: number; color: string; }>;
  trendData: Array<{ date: string; amount: number; type: string; }>;
  summary: {
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    transactionCount: number;
    topCategory: string;
    avgDaily: number;
  };
}

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [form] = Form.useForm();

  const reportTypes = [
    { value: 'INCOME_EXPENSE', label: '收支报告', icon: <BarChartOutlined /> },
    { value: 'CATEGORY_ANALYSIS', label: '分类分析', icon: <PieChartOutlined /> },
    { value: 'TREND_ANALYSIS', label: '趋势分析', icon: <LineChartOutlined /> },
    { value: 'BUDGET_REPORT', label: '预算报告', icon: <BarChartOutlined /> },
    { value: 'ACCOUNT_SUMMARY', label: '账户汇总', icon: <FileTextOutlined /> }
  ];

  const periodOptions = [
    { value: 'THIS_WEEK', label: '本周' },
    { value: 'THIS_MONTH', label: '本月' },
    { value: 'THIS_QUARTER', label: '本季度' },
    { value: 'THIS_YEAR', label: '本年' },
    { value: 'LAST_WEEK', label: '上周' },
    { value: 'LAST_MONTH', label: '上月' },
    { value: 'LAST_QUARTER', label: '上季度' },
    { value: 'LAST_YEAR', label: '去年' },
    { value: 'CUSTOM', label: '自定义' }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  useEffect(() => {
    fetchReports();
    generateQuickReport();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/reports');
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (error) {
      message.error('获取报告列表失败');
    } finally {
      setLoading(false);
    }
  };

  const generateQuickReport = async () => {
    try {
      // 模拟生成快速报告数据
      const currentMonth = dayjs().format('YYYY-MM');
      const mockData: ReportData = {
        incomeExpenseData: [
          { month: '1月', income: 15000, expense: 8000 },
          { month: '2月', income: 18000, expense: 9500 },
          { month: '3月', income: 16000, expense: 7800 },
          { month: '4月', income: 20000, expense: 10200 },
          { month: '5月', income: 17500, expense: 8900 },
          { month: '6月', income: 19000, expense: 9800 }
        ],
        categoryData: [
          { name: '餐饮', value: 3200, color: '#8884d8' },
          { name: '交通', value: 1800, color: '#82ca9d' },
          { name: '购物', value: 2400, color: '#ffc658' },
          { name: '娱乐', value: 1200, color: '#ff7c7c' },
          { name: '住房', value: 4500, color: '#8dd1e1' },
          { name: '其他', value: 900, color: '#d084d0' }
        ],
        trendData: Array.from({ length: 30 }, (_, i) => ({
          date: dayjs().subtract(29 - i, 'day').format('MM-DD'),
          amount: Math.floor(Math.random() * 1000) + 200,
          type: Math.random() > 0.7 ? 'income' : 'expense'
        })),
        summary: {
          totalIncome: 105500,
          totalExpense: 54300,
          netIncome: 51200,
          transactionCount: 186,
          topCategory: '餐饮',
          avgDaily: 580
        }
      };
      setReportData(mockData);
    } catch (error) {
      console.error('生成快速报告失败', error);
    }
  };

  const handleGenerateReport = () => {
    form.resetFields();
    form.setFieldsValue({ period: 'THIS_MONTH', format: 'JSON' });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        ...values,
        parameters: JSON.stringify({
          startDate: values.dateRange?.[0]?.toISOString(),
          endDate: values.dateRange?.[1]?.toISOString(),
          includeCharts: true,
          includeDetails: true
        })
      };

      const response = await api.post('/api/reports', submitData);
      if (response.data.success) {
        message.success('报告生成成功');
        setModalVisible(false);
        fetchReports();
      }
    } catch (error) {
      message.error('生成报告失败');
    }
  };

  const handleDownloadReport = async (reportId: string, format: string) => {
    try {
      const response = await api.get(`/api/reports/${reportId}/download?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.${format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('报告下载成功');
    } catch (error) {
      message.error('下载报告失败');
    }
  };

  const columns: ColumnsType<Report> = [
    {
      title: '报告标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            周期：{record.period}
          </div>
        </div>
      ),
    },
    {
      title: '报告类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const reportType = reportTypes.find(t => t.value === type);
        return (
          <Tag color="blue">
            {reportType?.label || type}
          </Tag>
        );
      },
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      render: (format) => (
        <Tag color={format === 'PDF' ? 'red' : format === 'EXCEL' ? 'green' : 'default'}>
          {format}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isPublic',
      key: 'isPublic',
      render: (isPublic) => (
        <Tag color={isPublic ? 'green' : 'orange'}>
          {isPublic ? '公开' : '私有'}
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
            icon={<DownloadOutlined />} 
            onClick={() => handleDownloadReport(record.id, 'PDF')}
          >
            下载PDF
          </Button>
          <Button 
            type="link" 
            icon={<FileExcelOutlined />} 
            onClick={() => handleDownloadReport(record.id, 'EXCEL')}
          >
            下载Excel
          </Button>
        </Space>
      ),
    },
  ];

  const renderChart = () => {
    if (!reportData) return <Empty description="暂无数据" />;

    return (
      <div>
        {/* 收支对比图 */}
        <Card title="月度收支对比" style={{ marginBottom: '24px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.incomeExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`¥${value}`, '']} />
              <Legend />
              <Bar dataKey="income" fill="#52c41a" name="收入" />
              <Bar dataKey="expense" fill="#f5222d" name="支出" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            {/* 分类饼图 */}
            <Card title="支出分类分布">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`¥${value}`, '金额']} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            {/* 趋势折线图 */}
            <Card title="日支出趋势">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.trendData.filter(d => d.type === 'expense')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`¥${value}`, '支出']} />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderSummary = () => {
    if (!reportData) return <Empty description="暂无数据" />;

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总收入"
                value={reportData.summary.totalIncome}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总支出"
                value={reportData.summary.totalExpense}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="净收入"
                value={reportData.summary.netIncome}
                precision={2}
                prefix="¥"
                valueStyle={{ color: reportData.summary.netIncome >= 0 ? '#52c41a' : '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="交易笔数"
                value={reportData.summary.transactionCount}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card title="财务分析概要">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Title level={4}>财务健康度评估</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>储蓄率：</Text>
                  <Text style={{ color: '#52c41a' }}>
                    {((reportData.summary.netIncome / reportData.summary.totalIncome) * 100).toFixed(1)}%
                  </Text>
                  <Text type="secondary">（推荐：20%以上）</Text>
                </div>
                <div>
                  <Text strong>最大支出类别：</Text>
                  <Tag color="orange">{reportData.summary.topCategory}</Tag>
                </div>
                <div>
                  <Text strong>日均支出：</Text>
                  <Text>¥{reportData.summary.avgDaily}</Text>
                </div>
              </Space>
            </Col>
          </Row>
          <Divider />
          <Title level={4}>理财建议</Title>
          <ul>
            <li>当前储蓄率为 {((reportData.summary.netIncome / reportData.summary.totalIncome) * 100).toFixed(1)}%，建议保持在20%以上</li>
            <li>{reportData.summary.topCategory}支出占比较高，建议适当控制此类开支</li>
            <li>建议设置月度预算，合理规划支出</li>
            <li>可考虑增加投资理财，提高资金利用效率</li>
          </ul>
        </Card>
      </div>
    );
  };

  const tabItems = [
    {
      key: 'summary',
      label: (
        <span>
          <FileTextOutlined />
          财务概览
        </span>
      ),
      children: renderSummary(),
    },
    {
      key: 'charts',
      label: (
        <span>
          <BarChartOutlined />
          图表分析
        </span>
      ),
      children: renderChart(),
    },
    {
      key: 'list',
      label: (
        <span>
          <CalendarOutlined />
          历史报告
        </span>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={reports}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
          }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>报告分析</h1>
        <p>生成和查看各类财务报告，深入分析您的财务状况</p>
      </div>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3>财务报告</h3>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleGenerateReport}
            >
              生成报告
            </Button>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      <Modal
        title="生成新报告"
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
            name="title"
            label="报告标题"
            rules={[{ required: true, message: '请输入报告标题' }]}
          >
            <Input placeholder="例如：6月份财务分析报告" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="报告类型"
                rules={[{ required: true, message: '请选择报告类型' }]}
              >
                <Select placeholder="选择报告类型">
                  {reportTypes.map(type => (
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
                name="period"
                label="报告周期"
                rules={[{ required: true, message: '请选择报告周期' }]}
              >
                <Select placeholder="选择报告周期">
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
            label="自定义时间范围"
            style={{ display: form.getFieldValue('period') === 'CUSTOM' ? 'block' : 'none' }}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>

          <Form.Item
            name="format"
            label="输出格式"
            rules={[{ required: true, message: '请选择输出格式' }]}
          >
            <Select placeholder="选择输出格式">
              <Select.Option value="JSON">
                <Space>
                  <FileTextOutlined />
                  JSON（在线查看）
                </Space>
              </Select.Option>
              <Select.Option value="PDF">
                <Space>
                  <FilePdfOutlined />
                  PDF（便于打印）
                </Space>
              </Select.Option>
              <Select.Option value="EXCEL">
                <Space>
                  <FileExcelOutlined />
                  Excel（数据分析）
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                生成报告
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReportsPage; 