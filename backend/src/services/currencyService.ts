import prisma from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// 支持的货币类型
export const SUPPORTED_CURRENCIES = [
  'CNY', // 人民币
  'USD', // 美元
  'EUR', // 欧元
  'JPY', // 日元
  'GBP', // 英镑
  'HKD', // 港币
  'KRW', // 韩元
  'SGD', // 新加坡元
  'AUD', // 澳元
  'CAD', // 加元
  'CHF', // 瑞士法郎
  'THB', // 泰铢
  'MYR', // 马来西亚林吉特
  'TWD', // 新台币
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// 汇率接口
interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: Decimal;
  lastUpdated: Date;
  source: string;
}

export class CurrencyService {
  // 默认汇率（以CNY为基准）
  private defaultRates: Record<string, number> = {
    'CNY': 1.0,
    'USD': 0.138,
    'EUR': 0.127,
    'JPY': 20.8,
    'GBP': 0.109,
    'HKD': 1.077,
    'KRW': 187.5,
    'SGD': 0.186,
    'AUD': 0.211,
    'CAD': 0.188,
    'CHF': 0.124,
    'THB': 4.92,
    'MYR': 0.65,
    'TWD': 4.42,
  };

  /**
   * 获取支持的货币列表
   */
  getSupportedCurrencies(): Array<{code: string, name: string, symbol: string}> {
    const currencyInfo: Record<string, {name: string, symbol: string}> = {
      'CNY': { name: '人民币', symbol: '¥' },
      'USD': { name: '美元', symbol: '$' },
      'EUR': { name: '欧元', symbol: '€' },
      'JPY': { name: '日元', symbol: '¥' },
      'GBP': { name: '英镑', symbol: '£' },
      'HKD': { name: '港币', symbol: 'HK$' },
      'KRW': { name: '韩元', symbol: '₩' },
      'SGD': { name: '新加坡元', symbol: 'S$' },
      'AUD': { name: '澳元', symbol: 'A$' },
      'CAD': { name: '加元', symbol: 'C$' },
      'CHF': { name: '瑞士法郎', symbol: 'CHF' },
      'THB': { name: '泰铢', symbol: '฿' },
      'MYR': { name: '马来西亚林吉特', symbol: 'RM' },
      'TWD': { name: '新台币', symbol: 'NT$' },
    };

    return SUPPORTED_CURRENCIES.map(code => ({
      code,
      name: currencyInfo[code].name,
      symbol: currencyInfo[code].symbol
    }));
  }

  /**
   * 验证货币代码是否有效
   */
  isValidCurrency(currency: string): boolean {
    return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency);
  }

  /**
   * 获取汇率
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<Decimal> {
    try {
      // 相同货币汇率为1
      if (fromCurrency === toCurrency) {
        return new Decimal(1);
      }

      // 验证货币代码
      if (!this.isValidCurrency(fromCurrency) || !this.isValidCurrency(toCurrency)) {
        throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
      }

      // 尝试从数据库获取最新汇率
      const storedRate = await this.getStoredExchangeRate(fromCurrency, toCurrency);
      if (storedRate && this.isRateRecent(storedRate.lastUpdated)) {
        return storedRate.rate;
      }

      // 使用默认汇率计算（通过CNY中转）
      const fromRate = new Decimal(this.defaultRates[fromCurrency]);
      const toRate = new Decimal(this.defaultRates[toCurrency]);
      
      // 计算汇率：from -> CNY -> to
      const rate = toRate.div(fromRate);
      
      // 保存汇率到数据库
      await this.saveExchangeRate(fromCurrency, toCurrency, rate, 'default');
      
      return rate;
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      throw error;
    }
  }

  /**
   * 转换金额
   */
  async convertAmount(
    amount: Decimal, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<{
    originalAmount: Decimal;
    convertedAmount: Decimal;
    fromCurrency: string;
    toCurrency: string;
    exchangeRate: Decimal;
    convertedAt: Date;
  }> {
    try {
      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = amount.mul(exchangeRate);

      return {
        originalAmount: amount,
        convertedAmount: convertedAmount,
        fromCurrency,
        toCurrency,
        exchangeRate,
        convertedAt: new Date()
      };
    } catch (error) {
      console.error('Error converting amount:', error);
      throw error;
    }
  }

  /**
   * 批量转换金额到指定货币
   */
  async convertMultipleAmounts(
    amounts: Array<{amount: Decimal, currency: string}>,
    targetCurrency: string
  ): Promise<Array<{
    originalAmount: Decimal;
    originalCurrency: string;
    convertedAmount: Decimal;
    targetCurrency: string;
    exchangeRate: Decimal;
  }>> {
    try {
      const results = await Promise.all(
        amounts.map(async (item) => {
          const conversion = await this.convertAmount(
            item.amount,
            item.currency,
            targetCurrency
          );
          
          return {
            originalAmount: item.amount,
            originalCurrency: item.currency,
            convertedAmount: conversion.convertedAmount,
            targetCurrency: targetCurrency,
            exchangeRate: conversion.exchangeRate
          };
        })
      );

      return results;
    } catch (error) {
      console.error('Error converting multiple amounts:', error);
      throw error;
    }
  }

  /**
   * 获取用户账户的多币种汇总
   */
  async getUserCurrencySummary(userId: string, baseCurrency: string = 'CNY') {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          name: true,
          balance: true,
          currency: true,
          type: true
        }
      });

      // 按货币分组
      const groupedByCurrency = accounts.reduce((acc, account) => {
        if (!acc[account.currency]) {
          acc[account.currency] = {
            currency: account.currency,
            accounts: [],
            totalBalance: new Decimal(0),
            accountCount: 0
          };
        }
        
        acc[account.currency].accounts.push(account);
        acc[account.currency].totalBalance = acc[account.currency].totalBalance.add(account.balance);
        acc[account.currency].accountCount++;
        
        return acc;
      }, {} as Record<string, any>);

      // 转换所有余额到基准货币
      const currencySummaries = await Promise.all(
        Object.values(groupedByCurrency).map(async (group: any) => {
          const conversion = await this.convertAmount(
            group.totalBalance,
            group.currency,
            baseCurrency
          );

          return {
            currency: group.currency,
            totalBalance: group.totalBalance,
            convertedBalance: conversion.convertedAmount,
            baseCurrency: baseCurrency,
            exchangeRate: conversion.exchangeRate,
            accountCount: group.accountCount,
            accounts: group.accounts
          };
        })
      );

      // 计算总计
      const totalConvertedBalance = currencySummaries.reduce(
        (sum, summary) => sum.add(summary.convertedBalance),
        new Decimal(0)
      );

      return {
        baseCurrency,
        totalConvertedBalance,
        currencySummaries,
        supportedCurrencies: this.getSupportedCurrencies()
      };
    } catch (error) {
      console.error('Error getting user currency summary:', error);
      throw error;
    }
  }

  /**
   * 从数据库获取存储的汇率
   */
  private async getStoredExchangeRate(
    fromCurrency: string, 
    toCurrency: string
  ): Promise<ExchangeRate | null> {
    try {
      // 这里应该从系统配置表或专门的汇率表获取
      // 目前使用系统配置表存储汇率
      const rateKey = `exchange_rate_${fromCurrency}_${toCurrency}`;
      const config = await prisma.systemConfig.findUnique({
        where: { key: rateKey }
      });

      if (!config) {
        return null;
      }

      const rateData = JSON.parse(config.value);
      return {
        fromCurrency,
        toCurrency,
        rate: new Decimal(rateData.rate),
        lastUpdated: new Date(rateData.lastUpdated),
        source: rateData.source || 'default'
      };
    } catch (error) {
      console.error('Error getting stored exchange rate:', error);
      return null;
    }
  }

  /**
   * 保存汇率到数据库
   */
  private async saveExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    rate: Decimal,
    source: string = 'default'
  ): Promise<void> {
    try {
      const rateKey = `exchange_rate_${fromCurrency}_${toCurrency}`;
      const rateData = {
        rate: rate.toString(),
        lastUpdated: new Date().toISOString(),
        source
      };

      await prisma.systemConfig.upsert({
        where: { key: rateKey },
        create: {
          key: rateKey,
          value: JSON.stringify(rateData),
          description: `Exchange rate from ${fromCurrency} to ${toCurrency}`,
          category: 'currency'
        },
        update: {
          value: JSON.stringify(rateData),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error saving exchange rate:', error);
      throw error;
    }
  }

  /**
   * 检查汇率是否为最近的（1小时内）
   */
  private isRateRecent(lastUpdated: Date): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lastUpdated > oneHourAgo;
  }

  /**
   * 格式化金额显示
   */
  formatAmount(amount: Decimal, currency: string): string {
    const currencyInfo = this.getSupportedCurrencies().find(c => c.code === currency);
    const symbol = currencyInfo?.symbol || currency;
    
    // 根据货币调整小数位数
    const decimalPlaces = ['JPY', 'KRW'].includes(currency) ? 0 : 2;
    
    return `${symbol} ${amount.toFixed(decimalPlaces)}`;
  }

  /**
   * 获取汇率历史（模拟功能，实际应该从外部API获取）
   */
  async getExchangeRateHistory(
    fromCurrency: string,
    toCurrency: string,
    days: number = 30
  ): Promise<Array<{date: Date, rate: Decimal}>> {
    try {
      // 模拟汇率历史数据
      const baseRate = await this.getExchangeRate(fromCurrency, toCurrency);
      const history: Array<{date: Date, rate: Decimal}> = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // 模拟汇率波动（±2%）
        const variation = (Math.random() - 0.5) * 0.04; // -2% to +2%
        const rate = baseRate.mul(new Decimal(1 + variation));
        
        history.push({ date, rate });
      }
      
      return history;
    } catch (error) {
      console.error('Error getting exchange rate history:', error);
      throw error;
    }
  }
}

export const currencyService = new CurrencyService();