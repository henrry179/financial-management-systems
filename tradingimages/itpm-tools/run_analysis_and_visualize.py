#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Economic Indicators Analysis and Visualization
经济指标分析和可视化

运行完整的经济指标分析并生成可视化图表
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

def create_indicators_data():
    """创建经济指标数据"""
    data = [
        # 内生驱动因素 - 调查类指标
        {'英文名称': 'ISM Manufacturing Index', '中文名称': 'ISM制造业指数', '主要分类': '内生驱动因素', '子分类': '调查类指标', '指标类型': 'Leading', '重要程度': 'High', '发布频率': 'Monthly'},
        {'英文名称': 'ISM Non-Manufacturing Index', '中文名称': 'ISM非制造业指数', '主要分类': '内生驱动因素', '子分类': '调查类指标', '指标类型': 'Leading', '重要程度': 'High', '发布频率': 'Monthly'},
        {'英文名称': 'University of Michigan Consumer Sentiment', '中文名称': '密歇根消费者情绪指数', '主要分类': '内生驱动因素', '子分类': '调查类指标', '指标类型': 'Leading', '重要程度': 'Medium', '发布频率': 'Monthly'},
        
        # 货币政策指标
        {'英文名称': 'M1 Money Supply', '中文名称': 'M1货币供应', '主要分类': '内生驱动因素', '子分类': '货币政策指标', '指标类型': 'Leading', '重要程度': 'High', '发布频率': 'Weekly'},
        {'英文名称': 'M2 Money Supply', '中文名称': 'M2货币供应', '主要分类': '内生驱动因素', '子分类': '货币政策指标', '指标类型': 'Leading', '重要程度': 'High', '发布频率': 'Weekly'},
        {'英文名称': 'M3 Money Supply', '中文名称': 'M3货币供应', '主要分类': '内生驱动因素', '子分类': '货币政策指标', '指标类型': 'Leading', '重要程度': 'Medium', '发布频率': 'Monthly'},
        
        # 就业指标
        {'英文名称': 'Non-Farm Payrolls (NFP)', '中文名称': '非农就业人数', '主要分类': '内生驱动因素', '子分类': '就业指标', '指标类型': 'Coincident', '重要程度': 'High', '发布频率': 'Monthly'},
        {'英文名称': 'Initial Jobless Claims', '中文名称': '初次申请失业救济', '主要分类': '内生驱动因素', '子分类': '就业指标', '指标类型': 'Leading', '重要程度': 'High', '发布频率': 'Weekly'},
        {'英文名称': 'Unemployment Rate', '中文名称': '失业率', '主要分类': '内生驱动因素', '子分类': '就业指标', '指标类型': 'Lagging', '重要程度': 'High', '发布频率': 'Monthly'},
        {'英文名称': 'Average Hourly Earnings', '中文名称': '平均时薪', '主要分类': '内生驱动因素', '子分类': '就业指标', '指标类型': 'Coincident', '重要程度': 'High', '发布频率': 'Monthly'},
        
        # 通胀指标
        {'英文名称': 'Consumer Price Index (CPI)', '中文名称': '消费者价格指数', '主要分类': '内生驱动因素', '子分类': '通胀指标', '指标类型': 'Coincident', '重要程度': 'High', '发布频率': 'Monthly'},
        {'英文名称': 'CPI Excluding Food and Energy', '中文名称': '核心CPI', '主要分类': '内生驱动因素', '子分类': '通胀指标', '指标类型': 'Coincident', '重要程度': 'High', '发布频率': 'Monthly'},
        {'英文名称': 'Producer Price Index (PPI)', '中文名称': '生产者价格指数', '主要分类': '内生驱动因素', '子分类': '通胀指标', '指标类型': 'Leading', '重要程度': 'High', '发布频率': 'Monthly'},
        {'英文名称': 'PPI Excluding Food and Energy', '中文名称': '核心PPI', '主要分类': '内生驱动因素', '子分类': '通胀指标', '指标类型': 'Leading', '重要程度': 'High', '发布频率': 'Monthly'},
        {'英文名称': 'Personal Consumption Expenditures (PCE)', '中文名称': 'PCE价格指数', '主要分类': '内生驱动因素', '子分类': '通胀指标', '指标类型': 'Coincident', '重要程度': 'High', '发布频率': 'Monthly'},
        
        # 利率指标
        {'英文名称': 'Federal Funds Rate', '中文名称': '联邦基金利率', '主要分类': '内生驱动因素', '子分类': '利率指标', '指标类型': 'Lagging', '重要程度': 'High', '发布频率': 'Monthly'},
        {'英文名称': '2-Year Treasury Yield', '中文名称': '2年期国债收益率', '主要分类': '内生驱动因素', '子分类': '债券收益率', '指标类型': 'Lagging', '重要程度': 'High', '发布频率': 'Daily'},
        {'英文名称': '10-Year Treasury Yield', '中文名称': '10年期国债收益率', '主要分类': '内生驱动因素', '子分类': '债券收益率', '指标类型': 'Lagging', '重要程度': 'High', '发布频率': 'Daily'},
        {'英文名称': '10Y-2Y Yield Spread', '中文名称': '10年期-2年期利差', '主要分类': '内生驱动因素', '子分类': '收益率曲线', '指标类型': 'Leading', '重要程度': 'High', '发布频率': 'Daily'},
        
        # 房地产指标
        {'英文名称': 'Building Permits', '中文名称': '建筑许可', '主要分类': '内生驱动因素', '子分类': '房地产指标', '指标类型': 'Leading', '重要程度': 'High', '发布频率': 'Monthly'},
        {'英文名称': 'Housing Starts', '中文名称': '房屋开工', '主要分类': '内生驱动因素', '子分类': '房地产指标', '指标类型': 'Leading', '重要程度': 'High', '发布频率': 'Monthly'},
        
        # 外生驱动因素
        {'英文名称': 'Current Account Balance', '中文名称': '经常账户余额', '主要分类': '外生驱动因素', '子分类': '贸易指标', '指标类型': 'Lagging', '重要程度': 'High', '发布频率': 'Quarterly'},
        {'英文名称': 'Trade Balance', '中文名称': '贸易差额', '主要分类': '外生驱动因素', '子分类': '贸易指标', '指标类型': 'Lagging', '重要程度': 'High', '发布频率': 'Monthly'},
        {'英文名称': 'Interest Rate Differentials', '中文名称': '利率差异', '主要分类': '外生驱动因素', '子分类': '相对利率', '指标类型': 'Coincident', '重要程度': 'High', '发布频率': 'Daily'},
        {'英文名称': 'Currency-Adjusted Stock Indices', '中文名称': '货币调整股票指数', '主要分类': '外生驱动因素', '子分类': '相对财富', '指标类型': 'Coincident', '重要程度': 'High', '发布频率': 'Daily'},
        {'英文名称': 'S&P 500 Index', '中文名称': '标普500指数', '主要分类': '外生驱动因素', '子分类': '股票市场', '指标类型': 'Coincident', '重要程度': 'High', '发布频率': 'Daily'},
        
        # 市场情绪指标
        {'英文名称': 'VIX Volatility Index', '中文名称': 'VIX波动率指数', '主要分类': '市场情绪', '子分类': '风险情绪', '指标类型': 'Coincident', '重要程度': 'High', '发布频率': 'Daily'},
        {'英文名称': 'Dollar Index (DXY)', '中文名称': '美元指数', '主要分类': '市场情绪', '子分类': '美元强弱', '指标类型': 'Coincident', '重要程度': 'High', '发布频率': 'Daily'},
        {'英文名称': 'COT Report', '中文名称': '交易者承诺报告', '主要分类': '市场情绪', '子分类': '头寸分析', '指标类型': 'Lagging', '重要程度': 'Medium', '发布频率': 'Weekly'},
        {'英文名称': 'Average True Range (ATR)', '中文名称': '平均真实范围', '主要分类': '技术指标', '子分类': '波动性指标', '指标类型': 'Coincident', '重要程度': 'Medium', '发布频率': 'Daily'},
    ]
    
    return pd.DataFrame(data)

def create_visualizations():
    """创建可视化图表"""
    
    # 创建数据
    df = create_indicators_data()
    
    # 设置图表样式
    plt.style.use('seaborn-v0_8')
    fig = plt.figure(figsize=(20, 24))
    
    # 1. 按主要分类分布
    plt.subplot(4, 2, 1)
    category_counts = df['主要分类'].value_counts()
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
    plt.pie(category_counts.values, labels=category_counts.index, autopct='%1.1f%%', 
            colors=colors, startangle=90)
    plt.title('🏦 经济指标按主要分类分布', fontsize=14, fontweight='bold')
    
    # 2. 按指标类型分布
    plt.subplot(4, 2, 2)
    type_counts = df['指标类型'].value_counts()
    type_colors = ['#FF6B6B', '#4ECDC4', '#45B7D1']
    plt.pie(type_counts.values, labels=type_counts.index, autopct='%1.1f%%', 
            colors=type_colors, startangle=90)
    plt.title('📈 经济指标按类型分布', fontsize=14, fontweight='bold')
    
    # 3. 按重要程度分布
    plt.subplot(4, 2, 3)
    importance_counts = df['重要程度'].value_counts()
    imp_colors = ['#FF6B6B', '#FFA726']
    plt.pie(importance_counts.values, labels=importance_counts.index, autopct='%1.1f%%', 
            colors=imp_colors, startangle=90)
    plt.title('🎯 经济指标按重要程度分布', fontsize=14, fontweight='bold')
    
    # 4. 按发布频率分布
    plt.subplot(4, 2, 4)
    freq_counts = df['发布频率'].value_counts()
    freq_colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
    plt.pie(freq_counts.values, labels=freq_counts.index, autopct='%1.1f%%', 
            colors=freq_colors, startangle=90)
    plt.title('⏰ 经济指标按发布频率分布', fontsize=14, fontweight='bold')
    
    # 5. 子分类详细分布
    plt.subplot(4, 2, 5)
    subcategory_counts = df['子分类'].value_counts()
    plt.barh(range(len(subcategory_counts)), subcategory_counts.values, 
             color=plt.cm.Set3(range(len(subcategory_counts))))
    plt.yticks(range(len(subcategory_counts)), subcategory_counts.index)
    plt.xlabel('指标数量')
    plt.title('📊 经济指标子分类详细分布', fontsize=14, fontweight='bold')
    plt.grid(axis='x', alpha=0.3)
    
    # 6. 指标类型 vs 重要程度热力图
    plt.subplot(4, 2, 6)
    heatmap_data = pd.crosstab(df['指标类型'], df['重要程度'])
    sns.heatmap(heatmap_data, annot=True, fmt='d', cmap='YlOrRd', 
                cbar_kws={'label': '指标数量'})
    plt.title('🔥 指标类型 vs 重要程度热力图', fontsize=14, fontweight='bold')
    
    # 7. 核心关注指标（高重要性）分布
    plt.subplot(4, 2, 7)
    high_imp = df[df['重要程度'] == 'High']
    high_type_counts = high_imp['指标类型'].value_counts()
    plt.bar(high_type_counts.index, high_type_counts.values, 
            color=['#FF6B6B', '#4ECDC4', '#45B7D1'])
    plt.xlabel('指标类型')
    plt.ylabel('指标数量')
    plt.title('🔴 高重要性指标按类型分布', fontsize=14, fontweight='bold')
    plt.grid(axis='y', alpha=0.3)
    
    # 8. 发布频率 vs 重要程度
    plt.subplot(4, 2, 8)
    freq_imp_data = pd.crosstab(df['发布频率'], df['重要程度'])
    freq_imp_data.plot(kind='bar', stacked=True, 
                       color=['#FF6B6B', '#FFA726'], ax=plt.gca())
    plt.xlabel('发布频率')
    plt.ylabel('指标数量')
    plt.title('📅 发布频率 vs 重要程度分布', fontsize=14, fontweight='bold')
    plt.legend(title='重要程度')
    plt.xticks(rotation=45)
    plt.grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    
    # 保存图表
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"经济指标分析可视化_{timestamp}.png"
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    plt.show()
    
    return filename

def print_summary_stats():
    """打印统计摘要"""
    df = create_indicators_data()
    
    print("=" * 80)
    print("🏦 专业外汇交易经济指标分析结果")
    print("=" * 80)
    
    print(f"\n📊 总体统计:")
    print(f"   • 指标总数: {len(df)}")
    print(f"   • 高重要性指标: {len(df[df['重要程度'] == 'High'])} ({len(df[df['重要程度'] == 'High'])/len(df)*100:.1f}%)")
    print(f"   • 领先指标: {len(df[df['指标类型'] == 'Leading'])}")
    print(f"   • 同步指标: {len(df[df['指标类型'] == 'Coincident'])}")
    print(f"   • 滞后指标: {len(df[df['指标类型'] == 'Lagging'])}")
    
    print(f"\n🏷️ 按主要分类:")
    for category, count in df['主要分类'].value_counts().items():
        print(f"   • {category}: {count}个指标")
    
    print(f"\n📈 核心关注指标 (高重要性):")
    high_importance = df[df['重要程度'] == 'High'].sort_values('指标类型')
    for i, (_, indicator) in enumerate(high_importance.iterrows(), 1):
        print(f"   {i:2d}. {indicator['英文名称']} ({indicator['中文名称']})")
        print(f"       分类: {indicator['主要分类']} - {indicator['子分类']}")
        print(f"       类型: {indicator['指标类型']} | 频率: {indicator['发布频率']}")
    
    print(f"\n📅 按发布频率分组的核心指标:")
    for freq in ['Daily', 'Weekly', 'Monthly', 'Quarterly']:
        freq_indicators = df[(df['发布频率'] == freq) & (df['重要程度'] == 'High')]
        if len(freq_indicators) > 0:
            print(f"   📊 {freq} ({len(freq_indicators)}个):")
            for _, indicator in freq_indicators.iterrows():
                print(f"      • {indicator['英文名称']}")
    
    print("=" * 80)

def main():
    """主函数"""
    print("🚀 启动经济指标分析和可视化...")
    
    # 打印统计摘要
    print_summary_stats()
    
    # 创建可视化图表
    print("\n📊 正在生成可视化图表...")
    chart_filename = create_visualizations()
    
    # 创建Excel报告
    print("\n📋 正在生成Excel报告...")
    df = create_indicators_data()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    excel_filename = f"经济指标完整分析_{timestamp}.xlsx"
    
    with pd.ExcelWriter(excel_filename, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='指标清单', index=False)
        
        # 创建汇总表
        summary_data = []
        for category in df['主要分类'].unique():
            cat_df = df[df['主要分类'] == category]
            for subcategory in cat_df['子分类'].unique():
                sub_df = cat_df[cat_df['子分类'] == subcategory]
                summary_data.append({
                    '主要分类': category,
                    '子分类': subcategory,
                    '指标数量': len(sub_df),
                    '高重要性数量': len(sub_df[sub_df['重要程度'] == 'High']),
                    '领先指标数': len(sub_df[sub_df['指标类型'] == 'Leading']),
                    '同步指标数': len(sub_df[sub_df['指标类型'] == 'Coincident']),
                    '滞后指标数': len(sub_df[sub_df['指标类型'] == 'Lagging'])
                })
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='分类汇总', index=False)
        
        # 核心指标单独表格
        core_indicators = df[df['重要程度'] == 'High']
        core_indicators.to_excel(writer, sheet_name='核心指标', index=False)
    
    print(f"\n✅ 分析完成！")
    print(f"📊 可视化图表: {chart_filename}")
    print(f"📋 Excel报告: {excel_filename}")
    print(f"📝 详细分析: forex_indicators_summary.md")
    
    print(f"\n🎯 专业建议:")
    print(f"   1. 重点关注{len(df[df['重要程度'] == 'High'])}个高重要性指标")
    print(f"   2. 建立基于{len(df[df['指标类型'] == 'Leading'])}个领先指标的预测体系")
    print(f"   3. 使用{len(df[df['指标类型'] == 'Coincident'])}个同步指标确认当前状况")
    print(f"   4. 通过{len(df[df['指标类型'] == 'Lagging'])}个滞后指标验证趋势")

if __name__ == "__main__":
    main() 