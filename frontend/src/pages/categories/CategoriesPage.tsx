import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Popconfirm, 
  Space,
  Tag,
  Row,
  Col,
  Tree,
  Tabs,
  ColorPicker,
  Icon
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  AppstoreOutlined,
  MoneyCollectOutlined,
  ShoppingOutlined,
  CarOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  BookOutlined,
  CoffeeOutlined,
  PlayCircleOutlined,
  GiftOutlined,
  RiseOutlined,
  TagOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../services/api';

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
  parentId?: string;
  description?: string;
  isActive: boolean;
  children?: Category[];
  transactions?: any[];
  createdAt: string;
  updatedAt: string;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesTree, setCategoriesTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState('income');
  const [form] = Form.useForm();

  const iconOptions = [
    { value: 'money-collect', label: '收入', icon: <MoneyCollectOutlined /> },
    { value: 'gift', label: '奖金', icon: <GiftOutlined /> },
    { value: 'rise', label: '投资', icon: <RiseOutlined /> },
    { value: 'coffee', label: '餐饮', icon: <CoffeeOutlined /> },
    { value: 'car', label: '交通', icon: <CarOutlined /> },
    { value: 'shopping', label: '购物', icon: <ShoppingOutlined /> },
    { value: 'play-circle', label: '娱乐', icon: <PlayCircleOutlined /> },
    { value: 'medicine-box', label: '医疗', icon: <MedicineBoxOutlined /> },
    { value: 'book', label: '教育', icon: <BookOutlined /> },
    { value: 'home', label: '住房', icon: <HomeOutlined /> },
    { value: 'tag', label: '其他', icon: <TagOutlined /> }
  ];

  const colorPresets = [
    '#52c41a', '#1890ff', '#722ed1', '#eb2f96', '#f5222d',
    '#fa541c', '#fa8c16', '#faad14', '#a0d911', '#13c2c2'
  ];

  useEffect(() => {
    fetchCategories();
    createDefaultCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const [listResponse, treeResponse] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/categories/tree')
      ]);
      
      if (listResponse.data.success) {
        setCategories(listResponse.data.data);
      }
      
      if (treeResponse.data.success) {
        setCategoriesTree(treeResponse.data.data);
      }
    } catch (error) {
      message.error('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultCategories = async () => {
    try {
      await api.post('/api/categories/default');
    } catch (error) {
      // 忽略错误，可能已经创建过默认分类
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ type: activeTab === 'income' ? 'INCOME' : 'EXPENSE' });
    setModalVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      ...category,
      color: category.color || '#1890ff'
    });
    setModalVisible(true);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await api.delete(`/api/categories/${id}`);
      if (response.data.success) {
        message.success('分类删除成功');
        fetchCategories();
      }
    } catch (error) {
      message.error('删除分类失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        ...values,
        color: values.color || '#1890ff'
      };

      if (editingCategory) {
        const response = await api.put(`/api/categories/${editingCategory.id}`, submitData);
        if (response.data.success) {
          message.success('分类更新成功');
        }
      } else {
        const response = await api.post('/api/categories', submitData);
        if (response.data.success) {
          message.success('分类创建成功');
        }
      }
      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      message.error(editingCategory ? '更新分类失败' : '创建分类失败');
    }
  };

  const getCategoryIcon = (iconName?: string) => {
    const iconOption = iconOptions.find(option => option.value === iconName);
    return iconOption?.icon || <TagOutlined />;
  };

  const columns: ColumnsType<Category> = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <span style={{ color: record.color }}>
            {getCategoryIcon(record.icon)}
          </span>
          <span style={{ fontWeight: 'bold' }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'INCOME' ? 'green' : 'red'}>
          {type === 'INCOME' ? '收入' : '支出'}
        </Tag>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      render: (color) => (
        <div style={{
          width: '20px',
          height: '20px',
          backgroundColor: color || '#1890ff',
          borderRadius: '4px',
          border: '1px solid #d9d9d9'
        }} />
      ),
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon, record) => (
        <span style={{ color: record.color, fontSize: '16px' }}>
          {getCategoryIcon(icon)}
        </span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (description) => description || '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
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
            onClick={() => handleEditCategory(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个分类吗？"
            onConfirm={() => handleDeleteCategory(record.id)}
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

  const renderTreeNode = (nodes: Category[]) => {
    return nodes.map(node => ({
      title: (
        <Space>
          <span style={{ color: node.color }}>
            {getCategoryIcon(node.icon)}
          </span>
          <span>{node.name}</span>
          <Tag size="small" color={node.type === 'INCOME' ? 'green' : 'red'}>
            {node.type === 'INCOME' ? '收入' : '支出'}
          </Tag>
        </Space>
      ),
      key: node.id,
      children: node.children ? renderTreeNode(node.children) : undefined
    }));
  };

  const incomeCategories = categories.filter(cat => cat.type === 'INCOME');
  const expenseCategories = categories.filter(cat => cat.type === 'EXPENSE');

  const tabItems = [
    {
      key: 'income',
      label: (
        <span>
          <MoneyCollectOutlined />
          收入分类 ({incomeCategories.length})
        </span>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={incomeCategories}
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
    {
      key: 'expense',
      label: (
        <span>
          <ShoppingOutlined />
          支出分类 ({expenseCategories.length})
        </span>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={expenseCategories}
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
    {
      key: 'tree',
      label: (
        <span>
          <AppstoreOutlined />
          树形结构
        </span>
      ),
      children: (
        <Card>
          <Tree
            treeData={renderTreeNode(categoriesTree)}
            defaultExpandAll
            showIcon={false}
          />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>分类管理</h1>
        <p>管理您的收入和支出分类，支持多级分类和自定义图标颜色</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <MoneyCollectOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{incomeCategories.length}</div>
                <div style={{ color: '#666' }}>收入分类</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ShoppingOutlined style={{ fontSize: '24px', color: '#f5222d' }} />
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{expenseCategories.length}</div>
                <div style={{ color: '#666' }}>支出分类</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <AppstoreOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{categories.length}</div>
                <div style={{ color: '#666' }}>总分类数</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <TagOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {categories.filter(cat => cat.isActive).length}
                </div>
                <div style={{ color: '#666' }}>启用分类</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3>分类列表</h3>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddCategory}
          >
            添加分类
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      <Modal
        title={editingCategory ? '编辑分类' : '添加分类'}
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
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="例如：餐饮" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="分类类型"
                rules={[{ required: true, message: '请选择分类类型' }]}
              >
                <Select placeholder="选择分类类型">
                  <Select.Option value="INCOME">
                    <Space>
                      <MoneyCollectOutlined style={{ color: '#52c41a' }} />
                      收入
                    </Space>
                  </Select.Option>
                  <Select.Option value="EXPENSE">
                    <Space>
                      <ShoppingOutlined style={{ color: '#f5222d' }} />
                      支出
                    </Space>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="icon"
                label="图标"
              >
                <Select placeholder="选择图标">
                  {iconOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      <Space>
                        {option.icon}
                        {option.label}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="color"
            label="颜色"
            initialValue="#1890ff"
          >
            <ColorPicker 
              showText
              presets={[{ label: '推荐颜色', colors: colorPresets }]}
              format="hex"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="分类描述（可选）" 
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingCategory ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesPage; 