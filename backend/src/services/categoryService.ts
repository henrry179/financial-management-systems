import { prisma } from '../index';
import { Decimal } from '@prisma/client/runtime/library';

export class CategoryService {
  /**
   * 获取用户的分类统计信息
   */
  async getUserCategoryStats(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    try {
      // 计算时间范围
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // 获取用户的所有分类
      const categories = await prisma.category.findMany({
        where: { userId },
        include: {
          transactions: {
            where: {
              date: {
                gte: startDate,
                lte: now,
              },
            },
          },
        },
      });

      // 统计每个分类的使用情况
      const categoryStats = categories.map(category => {
        const transactions = category.transactions;
        const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const transactionCount = transactions.length;
        
        // 计算平均金额
        const averageAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;
        
        return {
          id: category.id,
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
          totalAmount,
          transactionCount,
          averageAmount,
          lastUsed: transactionCount > 0 
            ? new Date(Math.max(...transactions.map(t => t.date.getTime())))
            : null,
        };
      });

      // 按类型分组统计
      const incomeCategories = categoryStats.filter(c => c.type === 'INCOME');
      const expenseCategories = categoryStats.filter(c => c.type === 'EXPENSE');

      const totalIncome = incomeCategories.reduce((sum, c) => sum + c.totalAmount, 0);
      const totalExpense = expenseCategories.reduce((sum, c) => sum + c.totalAmount, 0);

      return {
        period,
        startDate,
        endDate: now,
        summary: {
          totalCategories: categories.length,
          incomeCategories: incomeCategories.length,
          expenseCategories: expenseCategories.length,
          totalIncome,
          totalExpense,
          netIncome: totalIncome - totalExpense,
        },
        categoryStats: categoryStats.sort((a, b) => b.totalAmount - a.totalAmount),
        topIncomeCategories: incomeCategories
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 5),
        topExpenseCategories: expenseCategories
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 5),
      };
    } catch (error) {
      console.error('Error getting user category stats:', error);
      throw error;
    }
  }

  /**
   * 获取分类趋势分析
   */
  async getCategoryTrends(userId: string, categoryId: string, days: number = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // 获取指定期间的交易数据
      const transactions = await prisma.transaction.findMany({
        where: {
          categoryId,
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      });

      // 按日期分组统计
      const dailyStats = new Map<string, { amount: number; count: number }>();
      
      // 初始化所有日期
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        dailyStats.set(dateKey, { amount: 0, count: 0 });
      }

      // 统计实际数据
      transactions.forEach(transaction => {
        const dateKey = transaction.date.toISOString().split('T')[0];
        const existing = dailyStats.get(dateKey) || { amount: 0, count: 0 };
        existing.amount += Number(transaction.amount);
        existing.count += 1;
        dailyStats.set(dateKey, existing);
      });

      // 转换为数组格式
      const trends = Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date,
        amount: stats.amount,
        count: stats.count,
      }));

      // 计算趋势指标
      const amounts = trends.map(t => t.amount);
      const counts = trends.map(t => t.count);
      
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
      const totalCount = counts.reduce((sum, count) => sum + count, 0);
      const avgDailyAmount = totalAmount / days;
      const avgDailyCount = totalCount / days;

      // 计算增长趋势（简单的线性趋势）
      const firstHalf = amounts.slice(0, Math.floor(days / 2));
      const secondHalf = amounts.slice(Math.floor(days / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, amount) => sum + amount, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, amount) => sum + amount, 0) / secondHalf.length;
      
      const growthRate = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0;

      return {
        categoryId,
        period: {
          startDate,
          endDate,
          days,
        },
        trends,
        summary: {
          totalAmount,
          totalCount,
          avgDailyAmount,
          avgDailyCount,
          growthRate,
          trend: growthRate > 0.1 ? 'increasing' : growthRate < -0.1 ? 'decreasing' : 'stable',
        },
      };
    } catch (error) {
      console.error('Error getting category trends:', error);
      throw error;
    }
  }

  /**
   * 智能分类建议
   */
  async getSuggestedCategories(userId: string, description: string, amount: number, type: 'INCOME' | 'EXPENSE') {
    try {
      // 获取用户的历史交易和分类
      const historicalTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          type,
        },
        include: {
          category: true,
        },
        orderBy: { date: 'desc' },
        take: 1000, // 最近1000条记录
      });

      // 基于关键词匹配的简单算法
      const keywordMatches = new Map<string, number>();
      const words = description.toLowerCase().split(/\s+/);

      historicalTransactions.forEach(transaction => {
        if (!transaction.category || !transaction.description) return;

        const transactionWords = transaction.description.toLowerCase().split(/\s+/);
        let matchScore = 0;

        words.forEach(word => {
          if (transactionWords.some(tw => tw.includes(word) || word.includes(tw))) {
            matchScore += 1;
          }
        });

        if (matchScore > 0) {
          const categoryKey = transaction.category.id;
          keywordMatches.set(categoryKey, (keywordMatches.get(categoryKey) || 0) + matchScore);
        }
      });

      // 获取所有可能的分类
      const categories = await prisma.category.findMany({
        where: { userId, type },
      });

      // 计算每个分类的推荐分数
      const suggestions = categories.map(category => {
        const keywordScore = keywordMatches.get(category.id) || 0;
        
        // 计算金额相似度
        const categoryTransactions = historicalTransactions
          .filter(t => t.categoryId === category.id)
          .map(t => Number(t.amount));
        
        let amountScore = 0;
        if (categoryTransactions.length > 0) {
          const avgAmount = categoryTransactions.reduce((sum, amt) => sum + amt, 0) / categoryTransactions.length;
          // 金额差异越小，分数越高
          amountScore = Math.max(0, 10 - Math.abs(amount - avgAmount) / avgAmount * 10);
        }

        // 计算使用频率分数
        const usageCount = historicalTransactions.filter(t => t.categoryId === category.id).length;
        const frequencyScore = Math.min(10, usageCount / 10); // 最高10分

        const totalScore = keywordScore * 3 + amountScore + frequencyScore;

        return {
          category,
          score: totalScore,
          reasoning: {
            keywordMatches: keywordScore,
            amountSimilarity: amountScore,
            usageFrequency: frequencyScore,
          },
        };
      });

      // 按分数排序，返回前5个建议
      return suggestions
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting suggested categories:', error);
      throw error;
    }
  }

  /**
   * 分类使用分析
   */
  async getCategoryUsageAnalysis(userId: string) {
    try {
      const categories = await prisma.category.findMany({
        where: { userId },
        include: {
          transactions: {
            orderBy: { date: 'desc' },
          },
        },
      });

      const analysis = categories.map(category => {
        const transactions = category.transactions;
        const transactionCount = transactions.length;
        
        if (transactionCount === 0) {
          return {
            id: category.id,
            name: category.name,
            type: category.type,
            usage: 'unused',
            transactionCount: 0,
            lastUsed: null,
            totalAmount: 0,
            recommendation: 'Consider deleting if not needed',
          };
        }

        const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const lastUsed = transactions[0].date;
        const daysSinceLastUsed = Math.floor((Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));

        let usage: string;
        let recommendation: string;

        if (daysSinceLastUsed <= 7) {
          usage = 'active';
          recommendation = 'Frequently used category';
        } else if (daysSinceLastUsed <= 30) {
          usage = 'moderate';
          recommendation = 'Regularly used category';
        } else if (daysSinceLastUsed <= 90) {
          usage = 'low';
          recommendation = 'Occasionally used category';
        } else {
          usage = 'inactive';
          recommendation = 'Consider archiving or deleting';
        }

        return {
          id: category.id,
          name: category.name,
          type: category.type,
          usage,
          transactionCount,
          lastUsed,
          daysSinceLastUsed,
          totalAmount,
          recommendation,
        };
      });

      // 统计分析
      const summary = {
        totalCategories: categories.length,
        activeCategories: analysis.filter(a => a.usage === 'active').length,
        moderateCategories: analysis.filter(a => a.usage === 'moderate').length,
        lowCategories: analysis.filter(a => a.usage === 'low').length,
        inactiveCategories: analysis.filter(a => a.usage === 'inactive').length,
        unusedCategories: analysis.filter(a => a.usage === 'unused').length,
      };

      return {
        summary,
        analysis: analysis.sort((a, b) => {
          // 优先显示使用频率高的分类
          const usageOrder = { active: 4, moderate: 3, low: 2, inactive: 1, unused: 0 };
          return usageOrder[b.usage as keyof typeof usageOrder] - usageOrder[a.usage as keyof typeof usageOrder];
        }),
        recommendations: [
          summary.unusedCategories > 0 && `You have ${summary.unusedCategories} unused categories that could be cleaned up`,
          summary.inactiveCategories > 0 && `${summary.inactiveCategories} categories haven't been used recently`,
          summary.activeCategories < 5 && summary.totalCategories > 10 && 'Consider consolidating similar categories for better organization',
        ].filter(Boolean),
      };
    } catch (error) {
      console.error('Error getting category usage analysis:', error);
      throw error;
    }
  }

  /**
   * 批量操作分类
   */
  async batchUpdateCategories(
    userId: string,
    operations: Array<{
      categoryId: string;
      operation: 'activate' | 'deactivate' | 'delete' | 'merge';
      targetCategoryId?: string; // for merge operation
    }>
  ) {
    try {
      const results = await Promise.allSettled(
        operations.map(async (op) => {
          switch (op.operation) {
            case 'activate':
              return await this.activateCategory(userId, op.categoryId);
            case 'deactivate':
              return await this.deactivateCategory(userId, op.categoryId);
            case 'delete':
              return await this.safeDeleteCategory(userId, op.categoryId);
            case 'merge':
              if (!op.targetCategoryId) {
                throw new Error('Target category ID required for merge operation');
              }
              return await this.mergeCategories(userId, op.categoryId, op.targetCategoryId);
            default:
              throw new Error(`Unknown operation: ${op.operation}`);
          }
        })
      );

      const successful: any[] = [];
      const failed: Array<{ operation: any; error: string }> = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push({
            operation: operations[index],
            result: result.value,
          });
        } else {
          failed.push({
            operation: operations[index],
            error: result.reason?.message || 'Unknown error',
          });
        }
      });

      return {
        successful,
        failed,
        totalRequested: operations.length,
        successCount: successful.length,
        failCount: failed.length,
      };
    } catch (error) {
      console.error('Error batch updating categories:', error);
      throw error;
    }
  }

  /**
   * 激活分类
   */
  private async activateCategory(userId: string, categoryId: string) {
    return await prisma.category.update({
      where: { id: categoryId, userId },
      data: { isActive: true },
    });
  }

  /**
   * 停用分类
   */
  private async deactivateCategory(userId: string, categoryId: string) {
    return await prisma.category.update({
      where: { id: categoryId, userId },
      data: { isActive: false },
    });
  }

  /**
   * 安全删除分类
   */
  private async safeDeleteCategory(userId: string, categoryId: string) {
    // 检查是否有关联的交易
    const transactionCount = await prisma.transaction.count({
      where: { categoryId, userId },
    });

    if (transactionCount > 0) {
      throw new Error(`Cannot delete category with ${transactionCount} associated transactions`);
    }

    return await prisma.category.delete({
      where: { id: categoryId, userId },
    });
  }

  /**
   * 合并分类
   */
  private async mergeCategories(userId: string, sourceCategoryId: string, targetCategoryId: string) {
    // 将源分类的所有交易转移到目标分类
    await prisma.transaction.updateMany({
      where: {
        categoryId: sourceCategoryId,
        userId,
      },
      data: {
        categoryId: targetCategoryId,
      },
    });

    // 删除源分类
    return await prisma.category.delete({
      where: { id: sourceCategoryId, userId },
    });
  }

  /**
   * 导入预设分类模板
   */
  async importCategoryTemplate(userId: string, templateType: 'basic' | 'detailed' | 'business') {
    try {
      const templates = this.getCategoryTemplates();
      const template = templates[templateType];

      if (!template) {
        throw new Error(`Unknown template type: ${templateType}`);
      }

      const createdCategories = [];
      
      // 创建父分类
      for (const parentCategory of template.categories) {
        const existing = await prisma.category.findFirst({
          where: { userId, name: parentCategory.name },
        });

        if (!existing) {
          const created = await prisma.category.create({
            data: {
              ...parentCategory,
              userId,
            },
          });
          createdCategories.push(created);

          // 创建子分类
          if (parentCategory.children) {
            for (const childCategory of parentCategory.children) {
              const existingChild = await prisma.category.findFirst({
                where: { userId, name: childCategory.name },
              });

              if (!existingChild) {
                const createdChild = await prisma.category.create({
                  data: {
                    ...childCategory,
                    parentId: created.id,
                    userId,
                  },
                });
                createdCategories.push(createdChild);
              }
            }
          }
        }
      }

      return {
        templateType,
        createdCount: createdCategories.length,
        categories: createdCategories,
      };
    } catch (error) {
      console.error('Error importing category template:', error);
      throw error;
    }
  }

  /**
   * 获取分类模板
   */
  private getCategoryTemplates() {
    return {
      basic: {
        name: '基础分类模板',
        categories: [
          { name: '工资收入', type: 'INCOME', color: '#52c41a', icon: 'money-collect' },
          { name: '其他收入', type: 'INCOME', color: '#52c41a', icon: 'plus' },
          { name: '餐饮', type: 'EXPENSE', color: '#ff4d4f', icon: 'coffee' },
          { name: '交通', type: 'EXPENSE', color: '#ff4d4f', icon: 'car' },
          { name: '购物', type: 'EXPENSE', color: '#ff4d4f', icon: 'shopping' },
          { name: '娱乐', type: 'EXPENSE', color: '#ff4d4f', icon: 'play-circle' },
          { name: '其他支出', type: 'EXPENSE', color: '#ff4d4f', icon: 'minus' },
        ],
      },
      detailed: {
        name: '详细分类模板',
        categories: [
          {
            name: '收入',
            type: 'INCOME',
            color: '#52c41a',
            icon: 'rise',
            children: [
              { name: '工资', type: 'INCOME', color: '#73d13d', icon: 'money-collect' },
              { name: '奖金', type: 'INCOME', color: '#73d13d', icon: 'gift' },
              { name: '投资收益', type: 'INCOME', color: '#73d13d', icon: 'stock' },
              { name: '兼职收入', type: 'INCOME', color: '#73d13d', icon: 'team' },
            ],
          },
          {
            name: '生活支出',
            type: 'EXPENSE',
            color: '#ff4d4f',
            icon: 'home',
            children: [
              { name: '房租/房贷', type: 'EXPENSE', color: '#ff7875', icon: 'bank' },
              { name: '水电费', type: 'EXPENSE', color: '#ff7875', icon: 'thunderbolt' },
              { name: '网络通讯', type: 'EXPENSE', color: '#ff7875', icon: 'wifi' },
              { name: '日用品', type: 'EXPENSE', color: '#ff7875', icon: 'shop' },
            ],
          },
          {
            name: '餐饮',
            type: 'EXPENSE',
            color: '#fa8c16',
            icon: 'coffee',
            children: [
              { name: '早餐', type: 'EXPENSE', color: '#ffa940', icon: 'coffee' },
              { name: '午餐', type: 'EXPENSE', color: '#ffa940', icon: 'coffee' },
              { name: '晚餐', type: 'EXPENSE', color: '#ffa940', icon: 'coffee' },
              { name: '零食饮料', type: 'EXPENSE', color: '#ffa940', icon: 'coffee' },
            ],
          },
        ],
      },
      business: {
        name: '商务分类模板',
        categories: [
          {
            name: '营业收入',
            type: 'INCOME',
            color: '#52c41a',
            icon: 'rise',
            children: [
              { name: '产品销售', type: 'INCOME', color: '#73d13d', icon: 'shopping' },
              { name: '服务收入', type: 'INCOME', color: '#73d13d', icon: 'customer-service' },
              { name: '投资收益', type: 'INCOME', color: '#73d13d', icon: 'stock' },
            ],
          },
          {
            name: '运营成本',
            type: 'EXPENSE',
            color: '#ff4d4f',
            icon: 'setting',
            children: [
              { name: '员工工资', type: 'EXPENSE', color: '#ff7875', icon: 'team' },
              { name: '办公租金', type: 'EXPENSE', color: '#ff7875', icon: 'bank' },
              { name: '设备采购', type: 'EXPENSE', color: '#ff7875', icon: 'laptop' },
              { name: '营销推广', type: 'EXPENSE', color: '#ff7875', icon: 'sound' },
            ],
          },
        ],
      },
    };
  }
}

export const categoryService = new CategoryService();