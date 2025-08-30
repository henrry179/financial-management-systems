import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { currencyService } from '../services/currencyService';
import { Decimal } from '@prisma/client/runtime/library';

export class CurrencyController {
  /**
   * 获取支持的货币列表
   */
  async getSupportedCurrencies(req: Request, res: Response) {
    try {
      const currencies = currencyService.getSupportedCurrencies();
      
      res.json({
        success: true,
        data: currencies,
        message: 'Supported currencies retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching supported currencies:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_CURRENCIES_ERROR',
          message: 'Failed to fetch supported currencies',
        },
      });
    }
  }

  /**
   * 获取汇率
   */
  async getExchangeRate(req: Request, res: Response) {
    try {
      const { fromCurrency, toCurrency } = req.query;

      if (!fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'fromCurrency and toCurrency are required',
          },
        });
      }

      const exchangeRate = await currencyService.getExchangeRate(
        fromCurrency as string,
        toCurrency as string
      );

      res.json({
        success: true,
        data: {
          fromCurrency,
          toCurrency,
          exchangeRate: exchangeRate.toString(),
          timestamp: new Date().toISOString()
        },
        message: 'Exchange rate retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_EXCHANGE_RATE_ERROR',
          message: 'Failed to fetch exchange rate',
        },
      });
    }
  }

  /**
   * 转换金额
   */
  async convertAmount(req: Request, res: Response) {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;

      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'amount, fromCurrency and toCurrency are required',
          },
        });
      }

      const amountDecimal = new Decimal(amount);
      const conversion = await currencyService.convertAmount(
        amountDecimal,
        fromCurrency,
        toCurrency
      );

      res.json({
        success: true,
        data: {
          originalAmount: conversion.originalAmount.toString(),
          convertedAmount: conversion.convertedAmount.toString(),
          fromCurrency: conversion.fromCurrency,
          toCurrency: conversion.toCurrency,
          exchangeRate: conversion.exchangeRate.toString(),
          convertedAt: conversion.convertedAt,
          formattedOriginal: currencyService.formatAmount(conversion.originalAmount, fromCurrency),
          formattedConverted: currencyService.formatAmount(conversion.convertedAmount, toCurrency)
        },
        message: 'Amount converted successfully'
      });
    } catch (error) {
      console.error('Error converting amount:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CONVERT_AMOUNT_ERROR',
          message: 'Failed to convert amount',
        },
      });
    }
  }

  /**
   * 批量转换金额
   */
  async convertMultipleAmounts(req: Request, res: Response) {
    try {
      const { amounts, targetCurrency } = req.body;

      if (!amounts || !Array.isArray(amounts) || !targetCurrency) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'amounts (array) and targetCurrency are required',
          },
        });
      }

      // 转换金额格式
      const amountsWithDecimal = amounts.map((item: any) => ({
        amount: new Decimal(item.amount),
        currency: item.currency
      }));

      const conversions = await currencyService.convertMultipleAmounts(
        amountsWithDecimal,
        targetCurrency
      );

      const formattedConversions = conversions.map(conversion => ({
        originalAmount: conversion.originalAmount.toString(),
        originalCurrency: conversion.originalCurrency,
        convertedAmount: conversion.convertedAmount.toString(),
        targetCurrency: conversion.targetCurrency,
        exchangeRate: conversion.exchangeRate.toString(),
        formattedOriginal: currencyService.formatAmount(conversion.originalAmount, conversion.originalCurrency),
        formattedConverted: currencyService.formatAmount(conversion.convertedAmount, conversion.targetCurrency)
      }));

      // 计算总计
      const totalConverted = conversions.reduce(
        (sum, conversion) => sum.add(conversion.convertedAmount),
        new Decimal(0)
      );

      res.json({
        success: true,
        data: {
          conversions: formattedConversions,
          totalConverted: totalConverted.toString(),
          formattedTotal: currencyService.formatAmount(totalConverted, targetCurrency),
          targetCurrency,
          convertedAt: new Date()
        },
        message: 'Multiple amounts converted successfully'
      });
    } catch (error) {
      console.error('Error converting multiple amounts:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CONVERT_MULTIPLE_AMOUNTS_ERROR',
          message: 'Failed to convert multiple amounts',
        },
      });
    }
  }

  /**
   * 获取用户的多币种汇总
   */
  async getUserCurrencySummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { baseCurrency = 'CNY' } = req.query;

      if (!currencyService.isValidCurrency(baseCurrency as string)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CURRENCY',
            message: 'Invalid base currency',
          },
        });
      }

      const summary = await currencyService.getUserCurrencySummary(
        userId,
        baseCurrency as string
      );

      // 格式化数据
      const formattedSummary = {
        ...summary,
        totalConvertedBalance: summary.totalConvertedBalance.toString(),
        formattedTotal: currencyService.formatAmount(summary.totalConvertedBalance, baseCurrency as string),
        currencySummaries: summary.currencySummaries.map((curr: any) => ({
          ...curr,
          totalBalance: curr.totalBalance.toString(),
          convertedBalance: curr.convertedBalance.toString(),
          exchangeRate: curr.exchangeRate.toString(),
          formattedTotal: currencyService.formatAmount(curr.totalBalance, curr.currency),
          formattedConverted: currencyService.formatAmount(curr.convertedBalance, baseCurrency as string),
          accounts: curr.accounts.map((acc: any) => ({
            ...acc,
            balance: acc.balance.toString(),
            formattedBalance: currencyService.formatAmount(acc.balance, acc.currency)
          }))
        }))
      };

      res.json({
        success: true,
        data: formattedSummary,
        message: 'User currency summary retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching user currency summary:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_CURRENCY_SUMMARY_ERROR',
          message: 'Failed to fetch user currency summary',
        },
      });
    }
  }

  /**
   * 获取汇率历史
   */
  async getExchangeRateHistory(req: Request, res: Response) {
    try {
      const { fromCurrency, toCurrency } = req.query;
      const days = parseInt(req.query.days as string) || 30;

      if (!fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'fromCurrency and toCurrency are required',
          },
        });
      }

      if (days < 1 || days > 365) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DAYS_PARAMETER',
            message: 'days must be between 1 and 365',
          },
        });
      }

      const history = await currencyService.getExchangeRateHistory(
        fromCurrency as string,
        toCurrency as string,
        days
      );

      const formattedHistory = history.map(item => ({
        date: item.date.toISOString().split('T')[0], // YYYY-MM-DD format
        rate: item.rate.toString(),
        timestamp: item.date.toISOString()
      }));

      res.json({
        success: true,
        data: {
          fromCurrency,
          toCurrency,
          days,
          history: formattedHistory
        },
        message: 'Exchange rate history retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching exchange rate history:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_RATE_HISTORY_ERROR',
          message: 'Failed to fetch exchange rate history',
        },
      });
    }
  }

  /**
   * 验证货币代码
   */
  async validateCurrency(req: Request, res: Response) {
    try {
      const { currency } = req.params;

      const isValid = currencyService.isValidCurrency(currency);
      const currencyInfo = isValid 
        ? currencyService.getSupportedCurrencies().find(c => c.code === currency)
        : null;

      res.json({
        success: true,
        data: {
          currency,
          isValid,
          currencyInfo
        },
        message: 'Currency validation completed'
      });
    } catch (error) {
      console.error('Error validating currency:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATE_CURRENCY_ERROR',
          message: 'Failed to validate currency',
        },
      });
    }
  }
}