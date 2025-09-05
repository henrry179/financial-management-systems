import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BIApiService, MockBIDataGenerator, type BIReportData } from '../biApi';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('BIApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBIReportData', () => {
    it('should return success response with data when API call succeeds', async () => {
      const mockData: BIReportData = {
        financialData: [
          { month: '1月', income: 50000, expense: 30000, profit: 20000 },
          { month: '2月', income: 55000, expense: 32000, profit: 23000 },
        ],
        totalIncome: 105000,
        totalExpense: 62000,
        netProfit: 43000,
        lastUpdated: '2024-01-01T00:00:00.000Z',
      };

      const mockAxios = await import('axios');
      (mockAxios.default.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockData,
        },
      });

      const result = await BIApiService.getBIReportData();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockAxios.default.get).toHaveBeenCalledWith('/reports/bi-data');
    });

    it('should return error response when API call fails', async () => {
      const mockAxios = await import('axios');
      (mockAxios.default.get as any).mockRejectedValue(new Error('Network error'));

      const result = await BIApiService.getBIReportData();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('MockBIDataGenerator', () => {
  describe('generateFinancialData', () => {
    it('should generate correct number of months', () => {
      const data = MockBIDataGenerator.generateFinancialData(6);
      expect(data).toHaveLength(6);
    });

    it('should generate data with correct structure', () => {
      const data = MockBIDataGenerator.generateFinancialData(1);
      const item = data[0];
      
      expect(item).toHaveProperty('month');
      expect(item).toHaveProperty('income');
      expect(item).toHaveProperty('expense');
      expect(item).toHaveProperty('profit');
      
      expect(typeof item.month).toBe('string');
      expect(typeof item.income).toBe('number');
      expect(typeof item.expense).toBe('number');
      expect(typeof item.profit).toBe('number');
    });

    it('should generate positive values', () => {
      const data = MockBIDataGenerator.generateFinancialData(12);
      
      data.forEach(item => {
        expect(item.income).toBeGreaterThanOrEqual(0);
        expect(item.expense).toBeGreaterThanOrEqual(0);
      });
    });

    it('should use correct month names', () => {
      const data = MockBIDataGenerator.generateFinancialData(12);
      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      
      data.forEach((item, index) => {
        expect(item.month).toBe(monthNames[index]);
      });
    });
  });

  describe('generateBIReportData', () => {
    it('should generate complete BI report data', () => {
      const reportData = MockBIDataGenerator.generateBIReportData();
      
      expect(reportData).toHaveProperty('financialData');
      expect(reportData).toHaveProperty('totalIncome');
      expect(reportData).toHaveProperty('totalExpense');
      expect(reportData).toHaveProperty('netProfit');
      expect(reportData).toHaveProperty('lastUpdated');
      
      expect(Array.isArray(reportData.financialData)).toBe(true);
      expect(typeof reportData.totalIncome).toBe('number');
      expect(typeof reportData.totalExpense).toBe('number');
      expect(typeof reportData.netProfit).toBe('number');
      expect(typeof reportData.lastUpdated).toBe('string');
    });

    it('should calculate totals correctly', () => {
      const reportData = MockBIDataGenerator.generateBIReportData();
      const calculatedTotalIncome = reportData.financialData.reduce((sum, item) => sum + item.income, 0);
      const calculatedTotalExpense = reportData.financialData.reduce((sum, item) => sum + item.expense, 0);
      const calculatedNetProfit = calculatedTotalIncome - calculatedTotalExpense;
      
      expect(reportData.totalIncome).toBe(calculatedTotalIncome);
      expect(reportData.totalExpense).toBe(calculatedTotalExpense);
      expect(reportData.netProfit).toBe(calculatedNetProfit);
    });

    it('should have valid lastUpdated timestamp', () => {
      const reportData = MockBIDataGenerator.generateBIReportData();
      const timestamp = new Date(reportData.lastUpdated);
      
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });
});
