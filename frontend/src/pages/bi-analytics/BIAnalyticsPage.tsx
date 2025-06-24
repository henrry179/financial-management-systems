import React from 'react';
import BIDashboardSelector from '../../components/bi-dashboard/BIDashboardSelector';

const BIAnalyticsPage: React.FC = () => {
  // 模拟财务数据
  const mockFinancialData = [
    { month: '1月', income: 52000, expense: 32000, profit: 20000 },
    { month: '2月', income: 48000, expense: 35000, profit: 13000 },
    { month: '3月', income: 55000, expense: 31000, profit: 24000 },
    { month: '4月', income: 61000, expense: 38000, profit: 23000 },
    { month: '5月', income: 58000, expense: 33000, profit: 25000 },
    { month: '6月', income: 64000, expense: 36000, profit: 28000 }
  ];

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <BIDashboardSelector 
        data={mockFinancialData}
        height={400}
      />
    </div>
  );
};

export default BIAnalyticsPage; 