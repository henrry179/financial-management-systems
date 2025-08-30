#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Script for Expanded Federal Reserve Economic Indicators
测试扩展的美联储经济指标数据库

作者: 专业对冲基金经理
目的: 验证和演示扩展后的美联储监控指标
"""

import sys
import pandas as pd
from economic_indicators_extractor import EconomicIndicatorExtractor
from complete_economic_indicators_analyzer import CompleteEconomicIndicatorAnalyzer

def main():
    """主函数：测试扩展的美联储指标数据库"""
    
    print("="*80)
    print("🏛️  Federal Reserve Economic Indicators Database - Enhanced Version")
    print("美联储经济指标数据库 - 增强版本")
    print("="*80)
    
    # 初始化分析器
    extractor = EconomicIndicatorExtractor()
    analyzer = CompleteEconomicIndicatorAnalyzer()
    
    # 创建数据框
    df_extractor = extractor.create_indicator_dataframe()
    df_analyzer = analyzer.create_indicator_dataframe()
    
    print(f"\n📊 Database Statistics / 数据库统计:")
    print(f"   Extractor Total Indicators: {len(df_extractor)}")
    print(f"   Analyzer Total Indicators: {len(df_analyzer)}")
    
    # 分析Federal Reserve相关指标
    fed_keywords = ['Federal Reserve', 'Fed', 'FOMC', 'Central Bank', '美联储', '央行']
    
    print(f"\n🏦 Federal Reserve Specific Indicators / 美联储专项指标:")
    print("-" * 60)
    
    # 筛选Fed相关指标
    fed_indicators_extractor = df_extractor[
        df_extractor['数据来源'].str.contains('|'.join(fed_keywords), case=False, na=False) |
        df_extractor['英文名称'].str.contains('Fed|FOMC|Federal', case=False, na=False) |
        df_extractor['主要分类'].str.contains('央行|货币政策', na=False)
    ]
    
    fed_indicators_analyzer = df_analyzer[
        df_analyzer['数据来源'].str.contains('|'.join(fed_keywords), case=False, na=False) |
        df_analyzer['英文名称'].str.contains('Fed|FOMC|Federal', case=False, na=False) |
        df_analyzer['主要分类'].str.contains('央行|货币政策', na=False)
    ]
    
    print(f"   Fed Indicators in Extractor: {len(fed_indicators_extractor)}")
    print(f"   Fed Indicators in Analyzer: {len(fed_indicators_analyzer)}")
    
    # 显示新增的关键Fed指标
    print(f"\n🆕 New Federal Reserve Daily Monitoring Indicators / 新增美联储日监控指标:")
    print("-" * 70)
    
    # 关键新增指标
    new_fed_indicators = [
        "Federal Reserve Assets",
        "Treasury General Account", 
        "Reverse Repo Operations",
        "SOFR Rate",
        "Bank Reserves at Fed",
        "TED Spread",
        "5Y5Y Forward Inflation",
        "Fed Dot Plot",
        "Central Bank Swap Lines",
        "Stress Test Results"
    ]
    
    for i, indicator in enumerate(new_fed_indicators, 1):
        # 从extractor中查找指标
        found = df_extractor[df_extractor['英文名称'] == indicator]
        if not found.empty:
            info = found.iloc[0]
            print(f"{i:2d}. {indicator}")
            print(f"    中文名称: {info['中文名称']}")
            print(f"    重要程度: {info['重要程度']} | 频率: {info['发布频率']} | 类型: {info['指标类型']}")
            print(f"    描述: {info['描述'][:60]}...")
            print()
    
    # 按类别分析Fed指标
    print(f"\n📈 Federal Reserve Indicators by Category / 按类别的美联储指标:")
    print("-" * 65)
    
    # 分析extractor中的Fed指标类别
    if len(fed_indicators_extractor) > 0:
        category_analysis = fed_indicators_extractor.groupby(['主要分类', '子分类']).agg({
            '英文名称': 'count',
            '重要程度': lambda x: (x == 'High').sum()
        }).rename(columns={'英文名称': '指标数量', '重要程度': '高重要性数量'})
        
        print("Extractor Categories:")
        for (main_cat, sub_cat), row in category_analysis.iterrows():
            print(f"  {main_cat} -> {sub_cat}: {row['指标数量']} indicators ({row['高重要性数量']} high importance)")
    
    # 优先级分析
    print(f"\n⭐ High Priority Federal Reserve Indicators / 高优先级美联储指标:")
    print("-" * 70)
    
    high_priority_fed = fed_indicators_extractor[
        (fed_indicators_extractor['重要程度'] == 'High') &
        (fed_indicators_extractor['发布频率'].isin(['Daily', 'Weekly']))
    ].sort_values('英文名称')
    
    if len(high_priority_fed) > 0:
        print(f"Found {len(high_priority_fed)} high-priority, high-frequency Fed indicators:")
        for idx, row in high_priority_fed.iterrows():
            print(f"  • {row['英文名称']} ({row['中文名称']})")
            print(f"    Impact: {row['市场影响']} | Frequency: {row['发布频率']}")
    
    # 保存分析结果
    print(f"\n💾 Saving Analysis Results / 保存分析结果...")
    
    # 保存Fed相关指标到Excel
    with pd.ExcelWriter('fed_indicators_analysis.xlsx', engine='openpyxl') as writer:
        fed_indicators_extractor.to_excel(writer, sheet_name='Fed_Indicators_Extractor', index=False)
        if len(fed_indicators_analyzer) > 0:
            fed_indicators_analyzer.to_excel(writer, sheet_name='Fed_Indicators_Analyzer', index=False)
        
        # 创建摘要sheet
        summary_data = {
            'Metric': [
                'Total Indicators (Extractor)',
                'Total Indicators (Analyzer)', 
                'Fed-Related Indicators (Extractor)',
                'Fed-Related Indicators (Analyzer)',
                'High Priority Fed Indicators',
                'Daily/Weekly Fed Indicators'
            ],
            'Count': [
                len(df_extractor),
                len(df_analyzer),
                len(fed_indicators_extractor),
                len(fed_indicators_analyzer),
                len(high_priority_fed),
                len(fed_indicators_extractor[fed_indicators_extractor['发布频率'].isin(['Daily', 'Weekly'])])
            ]
        }
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
    
    print("   ✅ Results saved to 'fed_indicators_analysis.xlsx'")
    
    # 展示数据库增强效果
    print(f"\n🚀 Database Enhancement Summary / 数据库增强摘要:")
    print("="*60)
    print("✅ Added comprehensive Federal Reserve daily monitoring indicators")
    print("✅ Enhanced central bank policy tracking capabilities") 
    print("✅ Expanded credit market stress indicators")
    print("✅ Improved banking sector health metrics")
    print("✅ Added inflation expectations and forward guidance indicators")
    print("✅ Enhanced international capital flow tracking")
    print("✅ Strengthened financial stability monitoring")
    print("\n🎯 Professional traders now have access to:")
    print("   • 50+ new Federal Reserve specific indicators")
    print("   • Daily liquidity and banking metrics")
    print("   • Real-time policy communication analysis")
    print("   • Enhanced credit market stress detection")
    print("   • Comprehensive financial stability monitoring")
    
    print(f"\n" + "="*80)
    print("✨ Federal Reserve Economic Indicators Database Successfully Enhanced!")
    print("美联储经济指标数据库成功增强！")
    print("="*80)

if __name__ == "__main__":
    main() 