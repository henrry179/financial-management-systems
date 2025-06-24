import React from 'react';
import { Card, Row, Col, Statistic, Button, Space } from 'antd';
import { DollarOutlined, PlusOutlined, BankOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/auth';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div style={{ padding: '24px' }}>
      <h1>欢迎回来，{user?.firstName || user?.username}！ 👋</h1>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总资产"
              value={125680.50}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月收入"
              value={15800.00}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              suffix="元"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月支出"
              value={8900.00}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              suffix="元"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月储蓄"
              value={6900.00}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="快速操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" icon={<PlusOutlined />} block size="large">
                记录新交易
              </Button>
              <Button icon={<BankOutlined />} block size="large">
                管理账户
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="系统状态">
            <p>✅ 前端服务运行正常</p>
            <p>✅ 后端API连接正常</p>
            <p>✅ 数据库连接正常</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage; 