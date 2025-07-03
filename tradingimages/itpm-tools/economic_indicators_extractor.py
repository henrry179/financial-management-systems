#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Economic Indicators Extractor for Professional Forex Trading
专业外汇交易经济指标提取器

作者: 专业对冲基金经理
目的: 从交易大师课程文档中提取和分类所有外汇相关经济数据指标
"""

import re
import pandas as pd
import json
from typing import Dict, List, Tuple
from dataclasses import dataclass
from datetime import datetime
import numpy as np
import os
import glob
from collections import defaultdict

@dataclass
class EconomicIndicator:
    """经济指标数据类"""
    name_en: str
    name_cn: str
    category: str
    subcategory: str
    indicator_type: str  # Leading, Coincident, Lagging
    importance: str  # High, Medium, Low
    frequency: str  # Daily, Weekly, Monthly, Quarterly, Annual
    source: str
    description: str
    unit: str = ""  # 单位
    market_impact: str = ""  # Market Impact: Currency, Bonds, Equities, Commodities
    volatility_level: str = ""  # High, Medium, Low
    country_region: str = "US"  # 国家/地区
    sector: str = ""  # 行业分类
    calculation_method: str = ""  # 计算方法

class EconomicIndicatorExtractor:
    """经济指标提取器"""
    
    def __init__(self):
        self.indicators = []
        self.initialize_indicator_database()
    
    def initialize_indicator_database(self):
        """初始化专业对冲基金经理需要关注的经济指标数据库"""
        
        # 宏观经济指标 - 领先指标
        macro_leading_indicators = [
            # 调查类指标 (Surveys & Sentiment)
            EconomicIndicator(
                "ISM Manufacturing Index", "ISM制造业指数", "宏观经济", "调查类指标", 
                "Leading", "High", "Monthly", "ISM", "制造业活动的领先指标",
                "指数", "Currency,Bonds,Equities", "High", "US", "制造业", "采购经理调查"
            ),
            EconomicIndicator(
                "ISM Non-Manufacturing Index (NMI)", "ISM非制造业指数", "宏观经济", "调查类指标",
                "Leading", "High", "Monthly", "ISM", "服务业活动的领先指标",
                "指数", "Currency,Bonds,Equities", "High", "US", "服务业", "采购经理调查"
            ),
            EconomicIndicator(
                "University of Michigan Consumer Sentiment Index (UMCSI)", "密歇根大学消费者情绪指数", 
                "宏观经济", "调查类指标", "Leading", "Medium", "Monthly", "University of Michigan", 
                "消费者信心的领先指标",
                "指数", "Currency,Equities", "Medium", "US", "消费", "消费者调查"
            ),
            # 全球制造业PMI
            EconomicIndicator(
                "Eurozone Manufacturing PMI", "欧元区制造业PMI", "宏观经济", "调查类指标",
                "Leading", "High", "Monthly", "S&P Global", "欧元区制造业活动领先指标",
                "指数", "Currency,Bonds", "High", "EU", "制造业", "采购经理调查"
            ),
            EconomicIndicator(
                "China Caixin Manufacturing PMI", "中国财新制造业PMI", "宏观经济", "调查类指标",
                "Leading", "High", "Monthly", "Caixin/S&P Global", "中国制造业活动领先指标",
                "指数", "Currency,Commodities", "High", "CN", "制造业", "采购经理调查"
            ),
            EconomicIndicator(
                "UK Manufacturing PMI", "英国制造业PMI", "宏观经济", "调查类指标",
                "Leading", "High", "Monthly", "S&P Global", "英国制造业活动领先指标",
                "指数", "Currency,Bonds", "High", "UK", "制造业", "采购经理调查"
            ),
            
            # 建筑许可 (Building Permits & Real Estate)
            EconomicIndicator(
                "Building Permits", "建筑许可", "宏观经济", "房地产指标", 
                "Leading", "High", "Monthly", "US Census Bureau", "未来GDP增长的领先指标",
                "千套", "Currency,Bonds", "Medium", "US", "房地产", "政府许可统计"
            ),
            EconomicIndicator(
                "Housing Starts", "房屋开工", "宏观经济", "房地产指标",
                "Leading", "High", "Monthly", "US Census Bureau", "建筑活动的领先指标",
                "千套", "Currency,Bonds", "Medium", "US", "房地产", "实际开工统计"
            ),
            EconomicIndicator(
                "Existing Home Sales", "成屋销售", "宏观经济", "房地产指标",
                "Coincident", "Medium", "Monthly", "NAR", "房地产市场活跃度指标",
                "百万套/年", "Currency,Bonds", "Medium", "US", "房地产", "销售统计"
            ),
            EconomicIndicator(
                "New Home Sales", "新屋销售", "宏观经济", "房地产指标",
                "Leading", "Medium", "Monthly", "US Census Bureau", "新房需求指标",
                "千套/月", "Currency,Bonds", "Medium", "US", "房地产", "销售统计"
            ),
            EconomicIndicator(
                "Case-Shiller Home Price Index", "凯斯-席勒房价指数", "宏观经济", "房地产指标",
                "Lagging", "Medium", "Monthly", "S&P Dow Jones", "房价走势指标",
                "指数", "Currency,Bonds", "Medium", "US", "房地产", "房价指数"
            ),
            
            # 货币供应 (Money Supply & Central Bank Policy)
            EconomicIndicator(
                "M1 Money Supply", "M1货币供应", "宏观经济", "货币政策指标",
                "Leading", "High", "Weekly", "Federal Reserve", "流通中现金和活期存款",
                "万亿美元", "Currency,Bonds", "High", "US", "货币政策", "央行统计"
            ),
            EconomicIndicator(
                "M2 Money Supply", "M2货币供应", "宏观经济", "货币政策指标",
                "Leading", "High", "Weekly", "Federal Reserve", "M1加储蓄存款和定期存款",
                "万亿美元", "Currency,Bonds", "High", "US", "货币政策", "央行统计"
            ),
            EconomicIndicator(
                "Federal Reserve Balance Sheet", "美联储资产负债表", "宏观经济", "货币政策指标",
                "Leading", "High", "Weekly", "Federal Reserve", "央行资产负债表规模",
                "万亿美元", "Currency,Bonds", "High", "US", "货币政策", "央行统计"
            ),
            EconomicIndicator(
                "FOMC Meeting Minutes", "FOMC会议纪要", "宏观经济", "货币政策指标",
                "Leading", "High", "Quarterly", "Federal Reserve", "货币政策决策细节",
                "定性", "Currency,Bonds,Equities", "High", "US", "货币政策", "会议纪要"
            ),
        ]
        
        # 宏观经济 - 同步指标
        macro_coincident_indicators = [
            # 就业指标 (Employment)
            EconomicIndicator(
                "Non-Farm Payrolls (NFP)", "非农就业人数", "宏观经济", "就业指标",
                "Coincident", "High", "Monthly", "Bureau of Labor Statistics", "就业创造的同步指标",
                "千人", "Currency,Bonds,Equities", "High", "US", "就业", "就业统计"
            ),
            EconomicIndicator(
                "Initial Jobless Claims", "初次申请失业救济人数", "宏观经济", "就业指标",
                "Leading", "High", "Weekly", "Department of Labor", "失业的领先指标",
                "千人", "Currency,Bonds", "High", "US", "就业", "失业救济申请"
            ),
            EconomicIndicator(
                "Continuing Jobless Claims", "持续申请失业救济人数", "宏观经济", "就业指标",
                "Lagging", "Medium", "Weekly", "Department of Labor", "失业持续程度指标",
                "千人", "Currency,Bonds", "Medium", "US", "就业", "失业救济申请"
            ),
            EconomicIndicator(
                "Average Hourly Earnings", "平均时薪", "宏观经济", "就业指标",
                "Coincident", "High", "Monthly", "Bureau of Labor Statistics", "工资通胀压力指标",
                "美元/小时", "Currency,Bonds", "High", "US", "就业", "工资统计"
            ),
            EconomicIndicator(
                "Average Weekly Hours", "平均每周工时", "宏观经济", "就业指标",
                "Coincident", "Medium", "Monthly", "Bureau of Labor Statistics", "劳动力需求指标",
                "小时", "Currency,Equities", "Medium", "US", "就业", "工时统计"
            ),
            EconomicIndicator(
                "Labor Force Participation Rate", "劳动参与率", "宏观经济", "就业指标",
                "Lagging", "Medium", "Monthly", "Bureau of Labor Statistics", "劳动力市场参与度",
                "%", "Currency,Equities", "Medium", "US", "就业", "劳动力统计"
            ),
            EconomicIndicator(
                "Job Openings (JOLTS)", "职位空缺数", "宏观经济", "就业指标",
                "Leading", "Medium", "Monthly", "Bureau of Labor Statistics", "劳动力需求领先指标",
                "百万", "Currency,Bonds", "Medium", "US", "就业", "就业机会统计"
            ),
            
            # 通胀指标 (Inflation)
            EconomicIndicator(
                "Consumer Price Index (CPI)", "消费者价格指数", "宏观经济", "通胀指标",
                "Coincident", "High", "Monthly", "Bureau of Labor Statistics", "消费者通胀的同步指标",
                "年率%", "Currency,Bonds,Equities", "High", "US", "通胀", "价格调查"
            ),
            EconomicIndicator(
                "CPI Excluding Food and Energy", "核心CPI", "宏观经济", "通胀指标",
                "Coincident", "High", "Monthly", "Bureau of Labor Statistics", "核心通胀指标",
                "年率%", "Currency,Bonds,Equities", "High", "US", "通胀", "价格调查"
            ),
            EconomicIndicator(
                "Producer Price Index (PPI)", "生产者价格指数", "宏观经济", "通胀指标",
                "Leading", "High", "Monthly", "Bureau of Labor Statistics", "企业通胀的领先指标",
                "年率%", "Currency,Bonds,Commodities", "High", "US", "通胀", "价格调查"
            ),
            EconomicIndicator(
                "Personal Consumption Expenditures (PCE)", "个人消费支出价格指数", "宏观经济", "通胀指标",
                "Coincident", "High", "Monthly", "Bureau of Economic Analysis", "美联储首选通胀指标",
                "年率%", "Currency,Bonds", "High", "US", "通胀", "消费支出统计"
            ),
            EconomicIndicator(
                "Core PCE Price Index", "核心PCE价格指数", "宏观经济", "通胀指标",
                "Coincident", "High", "Monthly", "Bureau of Economic Analysis", "美联储核心通胀指标",
                "年率%", "Currency,Bonds", "High", "US", "通胀", "消费支出统计"
            ),
            EconomicIndicator(
                "Import Price Index", "进口价格指数", "宏观经济", "通胀指标",
                "Leading", "Medium", "Monthly", "Bureau of Labor Statistics", "进口通胀压力指标",
                "年率%", "Currency,Commodities", "Medium", "US", "通胀", "进口价格"
            ),
            EconomicIndicator(
                "Export Price Index", "出口价格指数", "宏观经济", "通胀指标",
                "Coincident", "Medium", "Monthly", "Bureau of Labor Statistics", "出口价格竞争力指标",
                "年率%", "Currency,Commodities", "Medium", "US", "通胀", "出口价格"
            ),
        ]
        
        # 宏观经济 - 滞后指标
        macro_lagging_indicators = [
            EconomicIndicator(
                "Unemployment Rate", "失业率", "宏观经济", "就业指标",
                "Lagging", "High", "Monthly", "Bureau of Labor Statistics", "就业趋势的滞后确认",
                "%", "Currency,Bonds,Equities", "High", "US", "就业", "劳动力统计"
            ),
            EconomicIndicator(
                "Federal Funds Rate", "联邦基金利率", "宏观经济", "利率指标",
                "Lagging", "High", "Monthly", "Federal Reserve", "货币政策的主要工具",
                "%", "Currency,Bonds,Equities", "High", "US", "货币政策", "央行政策"
            ),
            EconomicIndicator(
                "2-Year Treasury Yield", "2年期国债收益率", "宏观经济", "债券收益率",
                "Lagging", "High", "Daily", "US Treasury", "短期利率预期指标",
                "%", "Currency,Bonds", "High", "US", "债券市场", "国债拍卖"
            ),
            EconomicIndicator(
                "10-Year Treasury Yield", "10年期国债收益率", "宏观经济", "债券收益率",
                "Lagging", "High", "Daily", "US Treasury", "长期利率和经济预期指标",
                "%", "Currency,Bonds,Equities", "High", "US", "债券市场", "国债拍卖"
            ),
            EconomicIndicator(
                "10Y-2Y Yield Spread", "10年期-2年期收益率利差", "宏观经济", "债券收益率",
                "Leading", "High", "Daily", "US Treasury", "衰退预测的经典指标",
                "基点", "Currency,Bonds,Equities", "High", "US", "债券市场", "收益率计算"
            ),
            EconomicIndicator(
                "3-Month Treasury Yield", "3个月国债收益率", "宏观经济", "债券收益率",
                "Coincident", "Medium", "Daily", "US Treasury", "短期资金成本指标",
                "%", "Currency,Bonds", "Medium", "US", "债券市场", "国债拍卖"
            ),
            EconomicIndicator(
                "30-Year Treasury Yield", "30年期国债收益率", "宏观经济", "债券收益率",
                "Lagging", "Medium", "Daily", "US Treasury", "超长期利率预期",
                "%", "Currency,Bonds", "Medium", "US", "债券市场", "国债拍卖"
            ),
        ]
        
        # 外生驱动因素
        exogenous_indicators = [
            # 国际贸易 (International Trade)
            EconomicIndicator(
                "Current Account Balance", "经常账户余额", "外生驱动因素", "贸易指标",
                "Lagging", "High", "Quarterly", "Bureau of Economic Analysis", "国际交易的最广泛衡量",
                "十亿美元", "Currency", "High", "US", "贸易", "国际收支统计"
            ),
            EconomicIndicator(
                "Trade Balance", "贸易差额", "外生驱动因素", "贸易指标",
                "Lagging", "High", "Monthly", "Census Bureau", "商品和服务贸易差额",
                "十亿美元", "Currency", "High", "US", "贸易", "贸易统计"
            ),
            EconomicIndicator(
                "Terms of Trade", "贸易条件", "外生驱动因素", "贸易指标",
                "Coincident", "Medium", "Quarterly", "Bureau of Economic Analysis", "出口价格相对进口价格",
                "指数", "Currency,Commodities", "Medium", "US", "贸易", "价格比较"
            ),
            
            # 相对经济表现 (Relative Economic Performance)
            EconomicIndicator(
                "Interest Rate Differentials", "利率差异", "外生驱动因素", "相对利率",
                "Coincident", "High", "Daily", "Central Banks", "跨国利率差异驱动套息交易",
                "基点", "Currency", "High", "Global", "利率", "利率比较"
            ),
            EconomicIndicator(
                "GDP Growth Differentials", "GDP增长差异", "外生驱动因素", "经济增长",
                "Lagging", "High", "Quarterly", "Statistical Agencies", "相对经济表现比较",
                "%", "Currency", "High", "Global", "经济增长", "GDP统计"
            ),
            
            # 股票市场指标 (Stock Market Indicators)
            EconomicIndicator(
                "S&P 500 Index", "标普500指数", "外生驱动因素", "股票市场",
                "Coincident", "High", "Daily", "S&P Dow Jones", "美国股票市场代表",
                "点数", "Currency,Equities", "High", "US", "股票市场", "市值加权指数"
            ),
            EconomicIndicator(
                "Currency-Adjusted Stock Indices", "货币调整股票指数", "外生驱动因素", "相对财富",
                "Coincident", "High", "Daily", "Various Exchanges", "相对财富动态指标",
                "指数", "Currency", "High", "Global", "股票市场", "汇率调整指数"
            ),
        ]
        
        # 市场情绪和波动率指标
        volatility_sentiment_indicators = [
            EconomicIndicator(
                "VIX Volatility Index", "VIX波动率指数", "市场情绪", "风险情绪",
                "Coincident", "High", "Daily", "CBOE", "市场恐慌指标",
                "指数", "Currency,Equities", "High", "US", "股票市场", "期权隐含波动率"
            ),
            EconomicIndicator(
                "VVIX (VIX of VIX)", "VVIX指数", "市场情绪", "风险情绪",
                "Coincident", "Medium", "Daily", "CBOE", "波动率的波动率指标",
                "指数", "Equities", "High", "US", "股票市场", "波动率期权"
            ),
            EconomicIndicator(
                "VXN (NASDAQ Volatility Index)", "纳斯达克波动率指数", "市场情绪", "风险情绪",
                "Coincident", "High", "Daily", "CBOE", "科技股波动率指标",
                "指数", "Currency,Equities", "High", "US", "股票市场", "期权隐含波动率"
            ),
            EconomicIndicator(
                "RVX (Russell 2000 Volatility Index)", "罗素2000波动率指数", "市场情绪", "风险情绪",
                "Coincident", "Medium", "Daily", "CBOE", "小盘股波动率指标",
                "指数", "Currency,Equities", "Medium", "US", "股票市场", "期权隐含波动率"
            ),
            EconomicIndicator(
                "MOVE Index (Bond Volatility)", "MOVE指数", "市场情绪", "债券波动率",
                "Coincident", "High", "Daily", "ICE", "债券市场波动率指标",
                "指数", "Currency,Bonds", "High", "US", "债券市场", "期权隐含波动率"
            ),
            EconomicIndicator(
                "DXY Volatility", "美元指数波动率", "市场情绪", "汇率波动率",
                "Coincident", "High", "Daily", "ICE", "美元波动率指标",
                "指数", "Currency", "High", "US", "外汇市场", "汇率波动率"
            ),
            EconomicIndicator(
                "COT Report (Commitment of Traders)", "交易者承诺报告", "市场情绪", "头寸分析",
                "Lagging", "Medium", "Weekly", "CFTC", "大型交易者头寸分析",
                "合约数", "Currency,Commodities", "Medium", "US", "期货市场", "头寸统计"
            ),
            EconomicIndicator(
                "Put/Call Ratio", "看跌/看涨期权比率", "市场情绪", "期权指标",
                "Coincident", "Medium", "Daily", "CBOE", "市场情绪指标",
                "比率", "Equities", "Medium", "US", "股票市场", "期权交易量"
            ),
            EconomicIndicator(
                "Fear & Greed Index", "恐惧贪婪指数", "市场情绪", "综合情绪",
                "Coincident", "Medium", "Daily", "CNN", "市场情绪综合指标",
                "指数", "Equities", "Medium", "US", "股票市场", "情绪综合"
            ),
        ]
        
        # 微观经济指标
        micro_indicators = [
            # 企业财务指标
            EconomicIndicator(
                "Corporate Earnings Growth", "企业盈利增长", "微观经济", "企业盈利",
                "Lagging", "High", "Quarterly", "S&P", "企业盈利能力指标",
                "%", "Equities", "High", "US", "企业财务", "财报统计"
            ),
            EconomicIndicator(
                "Revenue Growth Rate", "营收增长率", "微观经济", "企业收入",
                "Lagging", "High", "Quarterly", "Companies", "企业收入增长指标",
                "%", "Equities", "High", "US", "企业财务", "财报统计"
            ),
            EconomicIndicator(
                "Profit Margin", "利润率", "微观经济", "企业效率",
                "Lagging", "High", "Quarterly", "Companies", "企业盈利效率指标",
                "%", "Equities", "High", "US", "企业财务", "财报计算"
            ),
            EconomicIndicator(
                "Return on Equity (ROE)", "净资产收益率", "微观经济", "投资回报",
                "Lagging", "High", "Quarterly", "Companies", "股东投资回报指标",
                "%", "Equities", "High", "US", "企业财务", "财报计算"
            ),
            EconomicIndicator(
                "Debt-to-Equity Ratio", "负债权益比", "微观经济", "财务杠杆",
                "Lagging", "Medium", "Quarterly", "Companies", "企业杠杆水平指标",
                "比率", "Equities,Bonds", "Medium", "US", "企业财务", "财报计算"
            ),
            EconomicIndicator(
                "Free Cash Flow", "自由现金流", "微观经济", "现金管理",
                "Lagging", "High", "Quarterly", "Companies", "企业现金创造能力",
                "十亿美元", "Equities", "High", "US", "企业财务", "现金流量表"
            ),
            
            # 银行和信贷指标
            EconomicIndicator(
                "Bank Credit Growth", "银行信贷增长", "微观经济", "信贷指标",
                "Leading", "High", "Monthly", "Federal Reserve", "信贷扩张指标",
                "%", "Currency,Bonds,Equities", "High", "US", "银行业", "信贷统计"
            ),
            EconomicIndicator(
                "Commercial Paper Outstanding", "商业票据余额", "微观经济", "短期融资",
                "Leading", "Medium", "Weekly", "Federal Reserve", "短期企业融资指标",
                "十亿美元", "Currency,Bonds", "Medium", "US", "货币市场", "融资统计"
            ),
            EconomicIndicator(
                "Consumer Credit Growth", "消费信贷增长", "微观经济", "消费金融",
                "Leading", "High", "Monthly", "Federal Reserve", "消费者借贷指标",
                "%", "Currency,Equities", "High", "US", "消费金融", "信贷统计"
            ),
            EconomicIndicator(
                "Credit Default Swap Spreads", "信用违约掉期利差", "微观经济", "信用风险",
                "Leading", "High", "Daily", "Various", "信用风险指标",
                "基点", "Currency,Bonds", "High", "Global", "信用市场", "CDS价格"
            ),
            EconomicIndicator(
                "High Yield Bond Spreads", "高收益债券利差", "微观经济", "信用风险",
                "Leading", "High", "Daily", "Various", "企业信用风险指标",
                "基点", "Currency,Bonds", "High", "US", "债券市场", "收益率利差"
            ),
        ]
        
        # 产业指标
        sector_indicators = [
            # 制造业指标
            EconomicIndicator(
                "Industrial Production Index", "工业生产指数", "产业指标", "制造业",
                "Coincident", "High", "Monthly", "Federal Reserve", "工业生产活动指标",
                "指数", "Currency,Equities,Commodities", "High", "US", "制造业", "生产统计"
            ),
            EconomicIndicator(
                "Capacity Utilization", "产能利用率", "产业指标", "制造业",
                "Coincident", "Medium", "Monthly", "Federal Reserve", "制造业产能使用效率",
                "%", "Currency,Commodities", "Medium", "US", "制造业", "产能统计"
            ),
            EconomicIndicator(
                "Factory Orders", "工厂订单", "产业指标", "制造业",
                "Leading", "Medium", "Monthly", "Census Bureau", "制造业需求指标",
                "十亿美元", "Currency,Equities", "Medium", "US", "制造业", "订单统计"
            ),
            EconomicIndicator(
                "Durable Goods Orders", "耐用品订单", "产业指标", "制造业",
                "Leading", "High", "Monthly", "Census Bureau", "制造业投资指标",
                "十亿美元", "Currency,Equities", "High", "US", "制造业", "订单统计"
            ),
            
            # 能源指标
            EconomicIndicator(
                "WTI Crude Oil Price", "WTI原油价格", "产业指标", "能源",
                "Coincident", "High", "Daily", "NYMEX", "能源成本指标",
                "美元/桶", "Currency,Commodities", "High", "Global", "能源", "期货价格"
            ),
            EconomicIndicator(
                "Brent Crude Oil Price", "布伦特原油价格", "产业指标", "能源",
                "Coincident", "High", "Daily", "ICE", "国际能源价格基准",
                "美元/桶", "Currency,Commodities", "High", "Global", "能源", "期货价格"
            ),
            EconomicIndicator(
                "Natural Gas Price", "天然气价格", "产业指标", "能源",
                "Coincident", "Medium", "Daily", "NYMEX", "天然气成本指标",
                "美元/MMBtu", "Currency,Commodities", "Medium", "US", "能源", "期货价格"
            ),
            EconomicIndicator(
                "Gasoline Price", "汽油价格", "产业指标", "能源消费",
                "Coincident", "Medium", "Daily", "EIA", "消费者能源成本",
                "美元/加仑", "Currency,Equities", "Medium", "US", "能源", "零售价格"
            ),
            EconomicIndicator(
                "Oil Inventory (EIA)", "原油库存", "产业指标", "能源供应",
                "Leading", "Medium", "Weekly", "EIA", "原油供需平衡指标",
                "百万桶", "Commodities", "Medium", "US", "能源", "库存统计"
            ),
            
            # 科技指标
            EconomicIndicator(
                "NASDAQ 100 Index", "纳斯达克100指数", "产业指标", "科技",
                "Coincident", "High", "Daily", "NASDAQ", "科技股综合指标",
                "点数", "Currency,Equities", "High", "US", "科技", "股价指数"
            ),
            EconomicIndicator(
                "Semiconductor Billings", "半导体计费", "产业指标", "科技",
                "Leading", "Medium", "Monthly", "SIA", "半导体行业需求指标",
                "十亿美元", "Equities", "Medium", "Global", "科技", "行业统计"
            ),
            EconomicIndicator(
                "Software and IT Services Revenue", "软件和IT服务收入", "产业指标", "科技服务",
                "Lagging", "Medium", "Quarterly", "Various", "科技服务行业指标",
                "十亿美元", "Equities", "Medium", "Global", "科技", "行业收入"
            ),
        ]
        
        # 外汇和国际指标
        forex_international_indicators = [
            # 主要汇率指标
            EconomicIndicator(
                "USD Index (DXY)", "美元指数", "外汇市场", "美元强度",
                "Coincident", "High", "Daily", "ICE", "美元综合强度指标",
                "指数", "Currency", "High", "US", "外汇", "汇率指数"
            ),
            EconomicIndicator(
                "EUR/USD Exchange Rate", "欧元/美元汇率", "外汇市场", "主要货币对",
                "Coincident", "High", "Daily", "Forex Market", "欧美汇率指标",
                "汇率", "Currency", "High", "Global", "外汇", "即期汇率"
            ),
            EconomicIndicator(
                "GBP/USD Exchange Rate", "英镑/美元汇率", "外汇市场", "主要货币对",
                "Coincident", "High", "Daily", "Forex Market", "英美汇率指标",
                "汇率", "Currency", "High", "Global", "外汇", "即期汇率"
            ),
            EconomicIndicator(
                "USD/JPY Exchange Rate", "美元/日元汇率", "外汇市场", "主要货币对",
                "Coincident", "High", "Daily", "Forex Market", "美日汇率指标",
                "汇率", "Currency", "High", "Global", "外汇", "即期汇率"
            ),
            EconomicIndicator(
                "USD/CHF Exchange Rate", "美元/瑞郎汇率", "外汇市场", "主要货币对",
                "Coincident", "Medium", "Daily", "Forex Market", "美瑞汇率指标",
                "汇率", "Currency", "Medium", "Global", "外汇", "即期汇率"
            ),
            EconomicIndicator(
                "AUD/USD Exchange Rate", "澳元/美元汇率", "外汇市场", "商品货币",
                "Coincident", "Medium", "Daily", "Forex Market", "澳美汇率指标",
                "汇率", "Currency,Commodities", "Medium", "Global", "外汇", "即期汇率"
            ),
            EconomicIndicator(
                "USD/CAD Exchange Rate", "美元/加元汇率", "外汇市场", "商品货币",
                "Coincident", "Medium", "Daily", "Forex Market", "美加汇率指标",
                "汇率", "Currency,Commodities", "Medium", "Global", "外汇", "即期汇率"
            ),
            EconomicIndicator(
                "USD/CNY Exchange Rate", "美元/人民币汇率", "外汇市场", "新兴市场",
                "Coincident", "High", "Daily", "Forex Market", "美中汇率指标",
                "汇率", "Currency", "High", "Global", "外汇", "即期汇率"
            ),
            
            # 外汇储备和国际流动性
            EconomicIndicator(
                "Foreign Exchange Reserves", "外汇储备", "外汇市场", "储备资产",
                "Lagging", "High", "Monthly", "Central Banks", "国家外汇储备指标",
                "十亿美元", "Currency", "High", "Global", "外汇", "储备统计"
            ),
            EconomicIndicator(
                "International Capital Flows", "国际资本流动", "外汇市场", "资本流动",
                "Leading", "High", "Monthly", "Various", "跨境资本流动指标",
                "十亿美元", "Currency", "High", "Global", "外汇", "资本流动统计"
            ),
            EconomicIndicator(
                "Cross-Border Bank Lending", "跨境银行放贷", "外汇市场", "国际信贷",
                "Leading", "Medium", "Quarterly", "BIS", "国际银行信贷指标",
                "十亿美元", "Currency", "Medium", "Global", "外汇", "银行统计"
            ),
        ]
        
        # Additional Federal Reserve Daily Monitoring Indicators
        fed_daily_indicators = [
            # Federal Reserve Bank Operations
            EconomicIndicator(
                "Federal Reserve Assets", "美联储资产", "央行操作", "资产负债表",
                "Leading", "High", "Weekly", "Federal Reserve", "央行资产规模变化",
                "万亿美元", "Currency,Bonds", "High", "US", "货币政策", "央行资产"
            ),
            EconomicIndicator(
                "Treasury General Account (TGA)", "财政部一般账户", "央行操作", "政府存款",
                "Leading", "High", "Daily", "Federal Reserve", "政府现金余额影响流动性",
                "十亿美元", "Currency,Bonds", "High", "US", "流动性", "政府账户"
            ),
            EconomicIndicator(
                "Reverse Repo Operations", "逆回购操作", "央行操作", "货币政策工具",
                "Leading", "High", "Daily", "Federal Reserve", "货币政策实施工具",
                "十亿美元", "Currency,Bonds", "High", "US", "货币政策", "市场操作"
            ),
            EconomicIndicator(
                "Fed Funds Effective Rate", "联邦基金有效利率", "央行操作", "利率指标",
                "Coincident", "High", "Daily", "Federal Reserve", "实际货币市场利率",
                "%", "Currency,Bonds", "High", "US", "货币政策", "市场利率"
            ),
            EconomicIndicator(
                "SOFR (Secured Overnight Financing Rate)", "担保隔夜融资利率", "央行操作", "基准利率",
                "Coincident", "High", "Daily", "Federal Reserve", "新基准利率替代LIBOR",
                "%", "Currency,Bonds", "High", "US", "货币政策", "基准利率"
            ),
            EconomicIndicator(
                "Primary Dealer Credit Facility", "一级交易商信贷便利", "央行操作", "流动性工具",
                "Leading", "Medium", "Daily", "Federal Reserve", "银行体系流动性指标",
                "十亿美元", "Currency,Bonds", "Medium", "US", "银行", "央行便利"
            ),
            EconomicIndicator(
                "Term Auction Facility", "定期拍卖便利", "央行操作", "流动性投放",
                "Leading", "Medium", "Weekly", "Federal Reserve", "银行流动性拍卖机制",
                "十亿美元", "Currency,Bonds", "Medium", "US", "银行", "流动性拍卖"
            ),
            
            # Banking Sector Indicators (Fed Supervised)
            EconomicIndicator(
                "Bank Reserves at Fed", "银行在央行准备金", "银行指标", "准备金",
                "Leading", "High", "Daily", "Federal Reserve", "银行体系流动性核心指标",
                "万亿美元", "Currency,Bonds", "High", "US", "银行", "准备金"
            ),
            EconomicIndicator(
                "Required Reserves", "法定准备金", "银行指标", "监管要求",
                "Lagging", "High", "Weekly", "Federal Reserve", "银行法定准备金要求",
                "十亿美元", "Currency,Bonds", "High", "US", "银行", "监管要求"
            ),
            EconomicIndicator(
                "Excess Reserves", "超额准备金", "银行指标", "流动性缓冲",
                "Leading", "High", "Daily", "Federal Reserve", "银行超额流动性指标",
                "万亿美元", "Currency,Bonds", "High", "US", "银行", "流动性管理"
            ),
            EconomicIndicator(
                "Large Bank Assets", "大型银行资产", "银行指标", "银行规模",
                "Lagging", "High", "Weekly", "Federal Reserve", "系统重要性银行资产",
                "万亿美元", "Currency,Bonds,Equities", "High", "US", "银行", "资产规模"
            ),
            EconomicIndicator(
                "Bank Lending Standards", "银行放贷标准", "银行指标", "信贷政策",
                "Leading", "High", "Quarterly", "Federal Reserve", "银行信贷松紧程度调查",
                "净百分比", "Currency,Bonds,Equities", "High", "US", "信贷", "贷款标准"
            ),
            EconomicIndicator(
                "Commercial Bank Deposits", "商业银行存款", "银行指标", "资金来源",
                "Coincident", "High", "Weekly", "Federal Reserve", "银行资金来源指标",
                "万亿美元", "Currency,Bonds", "High", "US", "银行", "存款统计"
            ),
            EconomicIndicator(
                "Small Business Lending", "小企业放贷", "银行指标", "信贷投放",
                "Leading", "Medium", "Monthly", "Federal Reserve", "小企业信贷可得性",
                "十亿美元", "Currency,Equities", "Medium", "US", "信贷", "小企业融资"
            ),
            
            # Treasury Market Indicators (Fed Monitored)
            EconomicIndicator(
                "TIPS Breakeven Inflation", "TIPS盈亏平衡通胀率", "债券市场", "通胀预期",
                "Leading", "High", "Daily", "US Treasury", "市场隐含通胀预期",
                "%", "Currency,Bonds", "High", "US", "通胀预期", "市场定价"
            ),
            EconomicIndicator(
                "5Y5Y Forward Inflation", "5年后5年期远期通胀率", "债券市场", "长期通胀预期",
                "Leading", "High", "Daily", "Federal Reserve", "长期通胀锚定指标",
                "%", "Currency,Bonds", "High", "US", "通胀预期", "远期利率"
            ),
            EconomicIndicator(
                "Real Interest Rates", "实际利率", "债券市场", "实际收益",
                "Leading", "High", "Daily", "Federal Reserve", "扣除通胀的真实利率",
                "%", "Currency,Bonds,Equities", "High", "US", "利率", "实际收益"
            ),
            EconomicIndicator(
                "Treasury Auction Bid-to-Cover", "国债拍卖投标倍数", "债券市场", "需求强度",
                "Leading", "Medium", "Weekly", "US Treasury", "国债市场需求指标",
                "倍数", "Currency,Bonds", "Medium", "US", "债券市场", "拍卖结果"
            ),
            EconomicIndicator(
                "Foreign Holdings of Treasuries", "外国持有美债", "债券市场", "国际需求",
                "Lagging", "High", "Monthly", "US Treasury", "国际资本流入指标",
                "万亿美元", "Currency,Bonds", "High", "US", "资本流动", "外国投资"
            ),
            
            # Credit Market Stress Indicators
            EconomicIndicator(
                "TED Spread", "TED利差", "信用市场", "流动性风险",
                "Leading", "High", "Daily", "Market Data", "银行间信用风险指标",
                "基点", "Currency,Bonds", "High", "US", "信用风险", "利差分析"
            ),
            EconomicIndicator(
                "LIBOR-OIS Spread", "LIBOR-OIS利差", "信用市场", "银行信用风险",
                "Leading", "High", "Daily", "Market Data", "银行体系信用压力",
                "基点", "Currency,Bonds", "High", "Global", "信用风险", "利差分析"
            ),
            EconomicIndicator(
                "Corporate Bond Issuance", "企业债券发行", "信用市场", "融资活动",
                "Leading", "Medium", "Weekly", "SIFMA", "企业融资需求指标",
                "十亿美元", "Currency,Bonds", "Medium", "US", "企业融资", "债券发行"
            ),
            EconomicIndicator(
                "Municipal Bond Yields", "市政债券收益率", "信用市场", "地方政府融资",
                "Coincident", "Medium", "Daily", "Municipal Market", "地方政府信用状况",
                "%", "Bonds", "Medium", "US", "地方政府", "信用利差"
            ),
            
            # Labor Market Granularity (Fed Districts)
            EconomicIndicator(
                "Regional Fed Employment Indices", "地区联储就业指数", "劳动力市场", "区域就业",
                "Coincident", "Medium", "Monthly", "Regional Fed Banks", "各联储区就业状况",
                "指数", "Currency,Equities", "Medium", "US", "区域就业", "联储调查"
            ),
            EconomicIndicator(
                "Beige Book Employment Conditions", "褐皮书就业状况", "劳动力市场", "定性分析",
                "Leading", "Medium", "Bi-monthly", "Federal Reserve", "各地区就业定性描述",
                "定性指标", "Currency,Equities", "Medium", "US", "就业质量", "调研报告"
            ),
            EconomicIndicator(
                "Wage Growth by Fed District", "按联储区工资增长", "劳动力市场", "区域工资",
                "Coincident", "Medium", "Quarterly", "Regional Fed Banks", "地区工资通胀差异",
                "%", "Currency", "Medium", "US", "工资通胀", "区域分析"
            ),
            
            # Financial Stability Indicators
            EconomicIndicator(
                "Leverage Ratio of Banks", "银行杠杆率", "金融稳定", "银行杠杆",
                "Lagging", "High", "Quarterly", "Federal Reserve", "银行资本充足性",
                "%", "Currency,Bonds", "High", "US", "银行监管", "资本比率"
            ),
            EconomicIndicator(
                "Liquidity Coverage Ratio", "流动性覆盖率", "金融稳定", "流动性管理",
                "Lagging", "High", "Quarterly", "Federal Reserve", "银行流动性缓冲",
                "%", "Currency,Bonds", "High", "US", "银行监管", "流动性比率"
            ),
            EconomicIndicator(
                "Net Stable Funding Ratio", "净稳定资金比率", "金融稳定", "资金稳定性",
                "Lagging", "Medium", "Quarterly", "Federal Reserve", "银行资金来源稳定性",
                "%", "Bonds", "Medium", "US", "银行监管", "资金结构"
            ),
            EconomicIndicator(
                "Systemically Important Banks Buffer", "系统重要性银行缓冲", "金融稳定", "系统性风险",
                "Lagging", "High", "Quarterly", "Federal Reserve", "大银行额外资本要求",
                "%", "Currency,Bonds,Equities", "High", "US", "系统性风险", "资本缓冲"
            ),
            
            # International and Cross-Border Flows
            EconomicIndicator(
                "Treasury International Capital (TIC)", "国际资本流动", "国际资本", "跨境投资",
                "Lagging", "High", "Monthly", "US Treasury", "国际资本流动详细数据",
                "十亿美元", "Currency", "High", "US", "资本流动", "跨境投资"
            ),
            EconomicIndicator(
                "Central Bank Swap Lines Usage", "央行互换额度使用", "国际合作", "流动性支持",
                "Leading", "High", "Daily", "Federal Reserve", "国际流动性支持指标",
                "十亿美元", "Currency", "High", "Global", "国际合作", "央行合作"
            ),
            EconomicIndicator(
                "Foreign Exchange Intervention", "外汇干预", "汇率政策", "市场干预",
                "Leading", "Medium", "Daily", "US Treasury", "官方汇率政策行动",
                "十亿美元", "Currency", "Medium", "US", "汇率政策", "市场干预"
            ),
            
            # Economic Projections and Guidance
            EconomicIndicator(
                "Fed Dot Plot", "美联储点阵图", "货币政策", "利率指引",
                "Leading", "High", "Quarterly", "Federal Reserve", "FOMC成员利率预期",
                "利率%", "Currency,Bonds,Equities", "High", "US", "前瞻指引", "政策预期"
            ),
            EconomicIndicator(
                "Fed Economic Projections", "美联储经济预测", "货币政策", "经济展望",
                "Leading", "High", "Quarterly", "Federal Reserve", "央行经济前景评估",
                "各项%", "Currency,Bonds,Equities", "High", "US", "经济预测", "官方展望"
            ),
            EconomicIndicator(
                "Fed Communication Tone", "美联储沟通基调", "货币政策", "政策沟通",
                "Leading", "High", "Daily", "Federal Reserve", "央行沟通策略分析",
                "鸽派/鹰派", "Currency,Bonds,Equities", "High", "US", "政策沟通", "语调分析"
            ),
        ]
        
        # 合并所有指标
        self.indicators.extend(macro_leading_indicators)
        self.indicators.extend(macro_coincident_indicators)
        self.indicators.extend(macro_lagging_indicators)
        self.indicators.extend(exogenous_indicators)
        self.indicators.extend(volatility_sentiment_indicators)
        self.indicators.extend(micro_indicators)
        self.indicators.extend(sector_indicators)
        self.indicators.extend(forex_international_indicators)
        self.indicators.extend(fed_daily_indicators)
    
    def create_indicator_dataframe(self) -> pd.DataFrame:
        """创建指标数据框"""
        data = []
        for indicator in self.indicators:
            data.append({
                '英文名称': indicator.name_en,
                '中文名称': indicator.name_cn,
                '主要分类': indicator.category,
                '子分类': indicator.subcategory,
                '指标类型': indicator.indicator_type,
                '重要程度': indicator.importance,
                '发布频率': indicator.frequency,
                '数据来源': indicator.source,
                '描述': indicator.description,
                '单位': indicator.unit,
                '市场影响': indicator.market_impact,
                '波动程度': indicator.volatility_level,
                '国家地区': indicator.country_region,
                '行业分类': indicator.sector,
                '计算方法': indicator.calculation_method
            })
        
        return pd.DataFrame(data)
    
    def create_summary_statistics(self) -> Dict:
        """创建指标摘要统计"""
        df = self.create_indicator_dataframe()
        
        summary = {
            '总指标数量': len(df),
            '按分类统计': df['主要分类'].value_counts().to_dict(),
            '按重要程度统计': df['重要程度'].value_counts().to_dict(),
            '按指标类型统计': df['指标类型'].value_counts().to_dict(),
            '按发布频率统计': df['发布频率'].value_counts().to_dict(),
            '按国家地区统计': df['国家地区'].value_counts().to_dict(),
            '按行业分类统计': df['行业分类'].value_counts().to_dict(),
            '按波动程度统计': df['波动程度'].value_counts().to_dict()
        }
        
        return summary
    
    def filter_indicators(self, **kwargs) -> pd.DataFrame:
        """根据条件筛选指标"""
        df = self.create_indicator_dataframe()
        
        for key, value in kwargs.items():
            if key in df.columns:
                if isinstance(value, list):
                    df = df[df[key].isin(value)]
                else:
                    df = df[df[key] == value]
        
        return df
    
    def get_high_importance_indicators(self) -> pd.DataFrame:
        """获取高重要性指标"""
        return self.filter_indicators(重要程度='High')
    
    def get_leading_indicators(self) -> pd.DataFrame:
        """获取领先指标"""
        return self.filter_indicators(指标类型='Leading')
    
    def get_currency_impact_indicators(self) -> pd.DataFrame:
        """获取对货币市场有影响的指标"""
        df = self.create_indicator_dataframe()
        return df[df['市场影响'].str.contains('Currency', na=False)]
    
    def get_daily_indicators(self) -> pd.DataFrame:
        """获取每日发布的指标"""
        return self.filter_indicators(发布频率='Daily')
    
    def create_trading_priority_matrix(self) -> pd.DataFrame:
        """创建交易优先级矩阵"""
        df = self.create_indicator_dataframe()
        
        # 创建优先级评分
        importance_score = {'High': 3, 'Medium': 2, 'Low': 1}
        volatility_score = {'High': 3, 'Medium': 2, 'Low': 1}
        frequency_score = {'Daily': 4, 'Weekly': 3, 'Monthly': 2, 'Quarterly': 1, 'Annual': 0}
        
        df['重要性评分'] = df['重要程度'].map(importance_score)
        df['波动性评分'] = df['波动程度'].map(volatility_score)
        df['频率评分'] = df['发布频率'].map(frequency_score)
        
        # 计算综合优先级评分
        df['优先级评分'] = (df['重要性评分'] * 0.5 + 
                           df['波动性评分'] * 0.3 + 
                           df['频率评分'] * 0.2)
        
        # 按优先级排序
        df = df.sort_values('优先级评分', ascending=False)
        
        return df[['英文名称', '中文名称', '主要分类', '子分类', '重要程度', 
                  '波动程度', '发布频率', '市场影响', '优先级评分']]
    
    def export_to_excel(self, filename: str = None):
        """导出到Excel文件"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"经济指标分析报告_{timestamp}.xlsx"
        
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            # 1. 完整指标列表
            df_indicators = self.create_indicator_dataframe()
            df_indicators.to_excel(writer, sheet_name='完整指标列表', index=False)
            
            # 2. 交易优先级矩阵
            df_priority = self.create_trading_priority_matrix()
            df_priority.to_excel(writer, sheet_name='交易优先级矩阵', index=False)
            
            # 3. 高重要性指标
            df_high_importance = self.get_high_importance_indicators()
            df_high_importance.to_excel(writer, sheet_name='高重要性指标', index=False)
            
            # 4. 领先指标
            df_leading = self.get_leading_indicators()
            df_leading.to_excel(writer, sheet_name='领先指标', index=False)
            
            # 5. 外汇影响指标
            df_currency = self.get_currency_impact_indicators()
            df_currency.to_excel(writer, sheet_name='外汇影响指标', index=False)
            
            # 6. 每日指标
            df_daily = self.get_daily_indicators()
            df_daily.to_excel(writer, sheet_name='每日指标', index=False)
            
            # 7. 按分类统计
            categories = ['宏观经济', '外生驱动因素', '微观经济', '产业指标', '市场情绪', '外汇市场', '大宗商品', '技术指标']
            for category in categories:
                df_cat = self.filter_indicators(主要分类=category)
                if not df_cat.empty:
                    sheet_name = f'{category}指标'
                    df_cat.to_excel(writer, sheet_name=sheet_name, index=False)
            
            # 8. 摘要统计
            summary = self.create_summary_statistics()
            df_summary = pd.DataFrame(list(summary.items()), columns=['统计项目', '数值'])
            df_summary.to_excel(writer, sheet_name='指标统计摘要', index=False)
            
            # 9. 按重要程度分类
            for importance in ['High', 'Medium', 'Low']:
                df_imp = self.filter_indicators(重要程度=importance)
                if not df_imp.empty:
                    sheet_name = f'{importance}重要性指标'
                    df_imp.to_excel(writer, sheet_name=sheet_name, index=False)
            
            # 10. 按发布频率分类
            for frequency in ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual']:
                df_freq = self.filter_indicators(发布频率=frequency)
                if not df_freq.empty:
                    sheet_name = f'{frequency}频率指标'
                    df_freq.to_excel(writer, sheet_name=sheet_name, index=False)
            
        print(f"Excel报告已生成: {filename}")
        print(f"包含 {len(self.indicators)} 个经济指标")
        print("工作表包括:")
        print("- 完整指标列表")
        print("- 交易优先级矩阵") 
        print("- 各类别专项分析")
        print("- 统计摘要报告")
        return filename
    
    def export_json_database(self, filename: str = None):
        """导出JSON格式的指标数据库"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"经济指标数据库_{timestamp}.json"
        
        indicators_dict = []
        for indicator in self.indicators:
            indicators_dict.append({
                'name_en': indicator.name_en,
                'name_cn': indicator.name_cn,
                'category': indicator.category,
                'subcategory': indicator.subcategory,
                'indicator_type': indicator.indicator_type,
                'importance': indicator.importance,
                'frequency': indicator.frequency,
                'source': indicator.source,
                'description': indicator.description,
                'unit': indicator.unit,
                'market_impact': indicator.market_impact,
                'volatility_level': indicator.volatility_level,
                'country_region': indicator.country_region,
                'sector': indicator.sector,
                'calculation_method': indicator.calculation_method
            })
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({
                'metadata': {
                    'total_indicators': len(indicators_dict),
                    'created_date': datetime.now().isoformat(),
                    'description': '专业外汇交易经济指标数据库'
                },
                'indicators': indicators_dict
            }, f, ensure_ascii=False, indent=2)
        
        print(f"JSON数据库已生成: {filename}")
        return filename

def update_readme_from_json(json_file: str, output_path: str = None):
    """根据 JSON 数据库生成/更新 README.md 文档

    参数
    ----
    json_file : str
        指向由 ``export_json_database`` 生成的 JSON 文件路径。
    output_path : str, optional
        README.md 的输出路径。默认与 ``json_file`` 位于同一目录下，
        文件名固定为 ``README.md``。
    """
    if output_path is None:
        # 默认写入 economicdataserieslist/README.md
        output_path = os.path.join(os.path.dirname(__file__), "README.md")

    # 读取 JSON 数据
    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    indicators = data.get("indicators", [])
    if not indicators:
        print("⚠️  JSON 文件中未找到指标数据，无法生成 README.md")
        return

    df = pd.DataFrame(indicators)

    # 中文列名称映射，便于与现有 DataFrame API 兼容
    df.rename(columns={
        "name_en": "英文名称",
        "name_cn": "中文名称",
        "category": "主要分类",
        "subcategory": "子分类",
        "indicator_type": "指标类型",
        "frequency": "发布频率",
        "importance": "重要性",
        "source": "数据来源",
    }, inplace=True)

    total = len(df)
    updated_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines: List[str] = []
    lines.append(f"# 经济指标数据库 (共 {total} 项)\n")
    lines.append("\n")
    lines.append(f"> 最近更新: {updated_time}\n")
    lines.append(f"> 描述: 专业外汇交易经济指标数据库\n")
    lines.append("\n")

    # 按主要分类 & 子分类组织
    for category in df["主要分类"].unique():
        df_cat = df[df["主要分类"] == category]
        lines.append(f"## {category}\n\n")
        for subcat in df_cat["子分类"].unique():
            df_sub = df_cat[df_cat["子分类"] == subcat]
            lines.append(f"### {subcat} ({len(df_sub)})\n\n")
            lines.append("| 中文名称 | 英文名称 | 类型 | 频率 | 重要性 | 来源 |\n")
            lines.append("|---|---|---|---|---|---|\n")
            for _, row in df_sub.iterrows():
                lines.append(
                    f"| {row['中文名称']} | {row['英文名称']} | {row['指标类型']} | {row['发布频率']} | {row['重要性']} | {row['数据来源']} |\n"
                )
            lines.append("\n")

    # 写入文件
    with open(output_path, "w", encoding="utf-8") as f_out:
        f_out.writelines(lines)

    print(f"📄 README.md 已生成/更新 -> {output_path}")


def export_text_analysis_report(extractor: "EconomicIndicatorExtractor", top_n: int = 20, filename: str = None) -> str:
    """输出文字版的经济指标增强型分析报告 (Markdown)

    Parameters
    ----------
    extractor : EconomicIndicatorExtractor
        已初始化并包含指标数据的提取器。
    top_n : int, default 20
        在优先级矩阵中选取前多少条进行重点展示。
    filename : str, optional
        输出文件名。若为空，则根据当前时间戳自动生成。

    Returns
    -------
    str
        生成的 Markdown 文件路径。
    """
    if filename is None:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"经济指标文字版分析报告_{ts}.md"
        # 默认放到与脚本相同目录
        filename = os.path.join(os.path.dirname(__file__), filename)

    df_priority = extractor.create_trading_priority_matrix()
    top_df = df_priority.head(top_n)
    summary = extractor.create_summary_statistics()

    lines: List[str] = []
    lines.append("# 经济指标增强型文字分析报告\n\n")
    lines.append(f"> 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

    # 概览
    lines.append("## 概览\n\n")
    lines.append(f"- 指标总数: **{summary['总指标数量']}**\n")
    lines.append(f"- 主要分类数量: **{len(summary['按分类统计'])}**\n")
    lines.append(f"- 覆盖国家/地区: **{len(summary['按国家地区统计'])}**\n")
    lines.append(f"- 覆盖行业: **{len(summary['按行业分类统计'])}**\n\n")

    # 交易优先级 TopN
    lines.append(f"## 交易优先级 TOP {top_n}\n\n")
    lines.append("| 排名 | 中文名称 | 英文名称 | 主要分类 | 子分类 | 重要程度 | 波动程度 | 频率 | 评分 |\n")
    lines.append("|---|---|---|---|---|---|---|---|---|\n")
    for idx, row in top_df.iterrows():
        lines.append(
            f"| {idx+1} | {row['中文名称']} | {row['英文名称']} | {row['主要分类']} | {row['子分类']} | {row['重要程度']} | {row['波动程度']} | {row['发布频率']} | {row['优先级评分']:.2f} |\n"
        )
    lines.append("\n")

    # 分类统计
    lines.append("## 分类统计\n\n")
    for cat, count in summary['按分类统计'].items():
        lines.append(f"- **{cat}**: {count} 项指标\n")
    lines.append("\n")

    # 重要性统计
    lines.append("## 重要性分布\n\n")
    for imp, count in summary['按重要程度统计'].items():
        lines.append(f"- {imp}: {count} 项\n")
    lines.append("\n")

    # 发布频率统计
    lines.append("## 发布频率分布\n\n")
    for freq, count in summary['按发布频率统计'].items():
        lines.append(f"- {freq}: {count} 项\n")
    lines.append("\n")

    # 保存
    with open(filename, "w", encoding="utf-8") as f_out:
        f_out.writelines(lines)

    print(f"📝 文字版分析报告已生成 -> {filename}")
    return filename

def main():
    """主函数"""
    print("🚀 启动增强版经济指标提取器...")
    print("="*60)
    
    # 创建提取器实例
    extractor = EconomicIndicatorExtractor()
    
    # 显示基本统计信息
    summary = extractor.create_summary_statistics()
    print(f"📊 指标数据库统计:")
    print(f"   总指标数量: {summary['总指标数量']}")
    print(f"   主要分类: {len(summary['按分类统计'])} 类")
    print(f"   涵盖国家/地区: {len(summary['按国家地区统计'])} 个")
    print(f"   涵盖行业: {len(summary['按行业分类统计'])} 个")
    print("")
    
    # 显示分类统计
    print("📈 按分类统计:")
    for category, count in summary['按分类统计'].items():
        print(f"   {category}: {count} 个指标")
    print("")
    
    # 显示重要性统计
    print("⭐ 按重要程度统计:")
    for importance, count in summary['按重要程度统计'].items():
        print(f"   {importance}: {count} 个指标")
    print("")
    
    # 显示高优先级指标
    priority_matrix = extractor.create_trading_priority_matrix()
    print("🎯 交易优先级最高的前10个指标:")
    top_10 = priority_matrix.head(10)
    for idx, row in top_10.iterrows():
        print(f"   {row['中文名称']} ({row['英文名称']}) - 评分: {row['优先级评分']:.2f}")
    print("")
    
    # 导出Excel报告
    print("📁 生成分析报告...")
    excel_filename = extractor.export_to_excel()
    
    # 导出JSON数据库
    json_filename = extractor.export_json_database()
    
    # ------------------------------------------------------------------
    # 自动生成/更新 README.md
    # ------------------------------------------------------------------
    try:
        update_readme_from_json(json_filename)
    except Exception as e:
        print(f"⚠️  更新 README.md 失败: {e}")
    
    # ------------------------------------------------------------------
    # 生成文字版增强型分析报告 (Markdown)
    # ------------------------------------------------------------------
    try:
        text_report = export_text_analysis_report(extractor, top_n=20)
        print(f"📝 文字版报告路径: {text_report}")
    except Exception as e:
        print(f"⚠️  文字版报告生成失败: {e}")
    
    print("")
    print("="*60)
    print("✅ 分析完成！")
    print(f"📋 Excel详细报告: {excel_filename}")
    print(f"💾 JSON数据库: {json_filename}")
    print("")
    print("📖 Excel报告包含以下工作表:")
    print("   • 完整指标列表 - 所有经济指标详情")
    print("   • 交易优先级矩阵 - 按重要性排序的指标")
    print("   • 高重要性指标 - High级别重要指标")
    print("   • 领先指标 - 经济活动的领先指标")
    print("   • 外汇影响指标 - 对外汇市场有重大影响的指标")
    print("   • 每日指标 - 每日发布的实时指标")
    print("   • 各分类专项分析 - 宏观、微观、产业等细分")
    print("   • 按重要性和频率分类的专项工作表")
    print("")
    print("🎯 建议使用方式:")
    print("   1. 查看'交易优先级矩阵'确定重点关注指标")
    print("   2. 根据交易策略选择相应的指标类别")
    print("   3. 使用'每日指标'工作表制定日常监控清单")
    print("   4. 参考'领先指标'进行前瞻性分析")
    print("   • 查看文字版报告获取快速概览 (README.md 同目录)")
    print("="*60)

if __name__ == "__main__":
    main() 