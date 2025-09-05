import { ApiService, ApiResponse } from './api';

// BI看板数据类型定义
export interface FinancialData {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

export interface AccountSummary {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  change: number;
  changePercent: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  savingsRate: number;
  transactionCount: number;
  averageTransaction: number;
}

export interface CategoryAnalysis {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

export interface BudgetAnalysis {
  budgetId: string;
  name: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'on-track' | 'warning' | 'over-budget';
}

export interface TrendData {
  period: string;
  income: number;
  expense: number;
  profit: number;
  savingsRate: number;
}

export interface KPIData {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend: number;
  status: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
}

export interface BIReportData {
  financialData: FinancialData[];
  accountSummary: AccountSummary[];
  transactionSummary: TransactionSummary;
  categoryAnalysis: CategoryAnalysis[];
  budgetAnalysis: BudgetAnalysis[];
  trendData: TrendData[];
  kpiData: KPIData[];
  lastUpdated: string;
}

// BI看板API服务
export class BIApiService {
  // 获取财务概览数据
  static async getFinancialOverview(params?: {
    startDate?: string;
    endDate?: string;
    period?: 'month' | 'quarter' | 'year';
  }): Promise<ApiResponse<BIReportData>> {
    try {
      const response = await ApiService.get<BIReportData>('/reports/financial-overview', { params });
      return response;
    } catch (error) {
      console.error('获取财务概览数据失败:', error);
      throw error;
    }
  }

  // 获取账户汇总数据
  static async getAccountSummary(): Promise<ApiResponse<AccountSummary[]>> {
    try {
      const response = await ApiService.get<AccountSummary[]>('/accounts/summary');
      return response;
    } catch (error) {
      console.error('获取账户汇总数据失败:', error);
      throw error;
    }
  }

  // 获取交易汇总数据
  static async getTransactionSummary(params?: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
  }): Promise<ApiResponse<TransactionSummary>> {
    try {
      const response = await ApiService.get<TransactionSummary>('/transactions/summary', { params });
      return response;
    } catch (error) {
      console.error('获取交易汇总数据失败:', error);
      throw error;
    }
  }

  // 获取分类分析数据
  static async getCategoryAnalysis(params?: {
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
    limit?: number;
  }): Promise<ApiResponse<CategoryAnalysis[]>> {
    try {
      const response = await ApiService.get<CategoryAnalysis[]>('/categories/analysis', { params });
      return response;
    } catch (error) {
      console.error('获取分类分析数据失败:', error);
      throw error;
    }
  }

  // 获取预算分析数据
  static async getBudgetAnalysis(params?: {
    period?: string;
    status?: string;
  }): Promise<ApiResponse<BudgetAnalysis[]>> {
    try {
      const response = await ApiService.get<BudgetAnalysis[]>('/budgets/analysis', { params });
      return response;
    } catch (error) {
      console.error('获取预算分析数据失败:', error);
      throw error;
    }
  }

  // 获取趋势数据
  static async getTrendData(params?: {
    startDate?: string;
    endDate?: string;
    period?: 'daily' | 'weekly' | 'monthly';
    metric?: 'income' | 'expense' | 'profit' | 'savings';
  }): Promise<ApiResponse<TrendData[]>> {
    try {
      const response = await ApiService.get<TrendData[]>('/reports/trends', { params });
      return response;
    } catch (error) {
      console.error('获取趋势数据失败:', error);
      throw error;
    }
  }

  // 获取KPI数据
  static async getKPIData(params?: {
    period?: string;
    metrics?: string[];
  }): Promise<ApiResponse<KPIData[]>> {
    try {
      const response = await ApiService.get<KPIData[]>('/reports/kpi', { params });
      return response;
    } catch (error) {
      console.error('获取KPI数据失败:', error);
      throw error;
    }
  }

  // 获取完整的BI报告数据
  static async getBIReportData(params?: {
    startDate?: string;
    endDate?: string;
    period?: 'month' | 'quarter' | 'year';
    includeAccounts?: boolean;
    includeCategories?: boolean;
    includeBudgets?: boolean;
    includeTrends?: boolean;
  }): Promise<ApiResponse<BIReportData>> {
    try {
      const response = await ApiService.get<BIReportData>('/reports/bi-dashboard', { params });
      return response;
    } catch (error) {
      console.error('获取BI报告数据失败:', error);
      throw error;
    }
  }

  // 导出BI报告
  static async exportBIReport(params: {
    format: 'pdf' | 'excel' | 'csv';
    reportType: 'overview' | 'detailed' | 'custom';
    startDate?: string;
    endDate?: string;
    includeCharts?: boolean;
  }): Promise<ApiResponse<{ downloadUrl: string; filename: string }>> {
    try {
      const response = await ApiService.post<{ downloadUrl: string; filename: string }>('/reports/export', params);
      return response;
    } catch (error) {
      console.error('导出BI报告失败:', error);
      throw error;
    }
  }
}

// 模拟数据生成器（用于开发测试）
export class MockBIDataGenerator {
  // 生成模拟财务数据
  static generateFinancialData(months: number = 6): FinancialData[] {
    const data: FinancialData[] = [];
    const currentDate = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
      
      const baseIncome = 50000 + Math.random() * 20000;
      const baseExpense = 30000 + Math.random() * 15000;
      
      data.push({
        month,
        income: Math.round(baseIncome),
        expense: Math.round(baseExpense),
        profit: Math.round(baseIncome - baseExpense)
      });
    }
    
    return data;
  }

  // 生成模拟账户汇总数据
  static generateAccountSummary(): AccountSummary[] {
    return [
      {
        id: '1',
        name: '招商银行储蓄卡',
        type: 'bank',
        balance: 125000,
        currency: 'CNY',
        change: 5000,
        changePercent: 4.2
      },
      {
        id: '2',
        name: '支付宝余额',
        type: 'digital',
        balance: 8500,
        currency: 'CNY',
        change: -200,
        changePercent: -2.3
      },
      {
        id: '3',
        name: '微信零钱',
        type: 'digital',
        balance: 3200,
        currency: 'CNY',
        change: 150,
        changePercent: 4.9
      },
      {
        id: '4',
        name: '现金',
        type: 'cash',
        balance: 500,
        currency: 'CNY',
        change: -100,
        changePercent: -16.7
      }
    ];
  }

  // 生成模拟交易汇总数据
  static generateTransactionSummary(): TransactionSummary {
    return {
      totalIncome: 325000,
      totalExpense: 198000,
      netProfit: 127000,
      savingsRate: 39.1,
      transactionCount: 156,
      averageTransaction: 1270
    };
  }

  // 生成模拟分类分析数据
  static generateCategoryAnalysis(): CategoryAnalysis[] {
    return [
      { category: '餐饮', amount: 45000, percentage: 22.7, count: 89, trend: 'up' },
      { category: '交通', amount: 32000, percentage: 16.2, count: 45, trend: 'stable' },
      { category: '购物', amount: 28000, percentage: 14.1, count: 67, trend: 'down' },
      { category: '娱乐', amount: 22000, percentage: 11.1, count: 34, trend: 'up' },
      { category: '医疗', amount: 18000, percentage: 9.1, count: 12, trend: 'stable' },
      { category: '教育', amount: 15000, percentage: 7.6, count: 8, trend: 'up' },
      { category: '其他', amount: 38000, percentage: 19.2, count: 78, trend: 'stable' }
    ];
  }

  // 生成模拟预算分析数据
  static generateBudgetAnalysis(): BudgetAnalysis[] {
    return [
      {
        budgetId: '1',
        name: '月度生活费用',
        budgeted: 15000,
        spent: 12800,
        remaining: 2200,
        percentage: 85.3,
        status: 'on-track'
      },
      {
        budgetId: '2',
        name: '娱乐支出',
        budgeted: 3000,
        spent: 3200,
        remaining: -200,
        percentage: 106.7,
        status: 'over-budget'
      },
      {
        budgetId: '3',
        name: '交通费用',
        budgeted: 2000,
        spent: 1800,
        remaining: 200,
        percentage: 90.0,
        status: 'on-track'
      }
    ];
  }

  // 生成模拟KPI数据
  static generateKPIData(): KPIData[] {
    return [
      {
        title: '总收入',
        value: 325000,
        prefix: '¥',
        trend: 12.5,
        status: 'up',
        change: 36000,
        changePercent: 12.5
      },
      {
        title: '总支出',
        value: 198000,
        prefix: '¥',
        trend: -3.2,
        status: 'down',
        change: -6500,
        changePercent: -3.2
      },
      {
        title: '净收益',
        value: 127000,
        prefix: '¥',
        trend: 8.9,
        status: 'up',
        change: 10400,
        changePercent: 8.9
      },
      {
        title: '储蓄率',
        value: 39.1,
        suffix: '%',
        trend: 2.1,
        status: 'up',
        change: 0.8,
        changePercent: 2.1
      }
    ];
  }

  // 生成完整的模拟BI报告数据
  static generateBIReportData(): BIReportData {
    return {
      financialData: this.generateFinancialData(),
      accountSummary: this.generateAccountSummary(),
      transactionSummary: this.generateTransactionSummary(),
      categoryAnalysis: this.generateCategoryAnalysis(),
      budgetAnalysis: this.generateBudgetAnalysis(),
      trendData: this.generateFinancialData().map(item => ({
        period: item.month,
        income: item.income,
        expense: item.expense,
        profit: item.profit,
        savingsRate: (item.profit / item.income) * 100
      })),
      kpiData: this.generateKPIData(),
      lastUpdated: new Date().toISOString()
    };
  }
}

export default BIApiService;
