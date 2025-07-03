#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete Economic Indicators Analyzer for Professional Forex Trading
完整的专业外汇交易经济指标分析器

作者: 专业对冲基金经理
版本: 2.0
更新时间: 2024

功能特点:
1. 从交易大师课程文档中提取所有外汇相关经济数据指标
2. 按照不同类型的经济数据指标归类
3. 识别专业对冲基金经理和专业交易员需要了解的经济数据指标
4. 将提取出来后的经济数据指标按照不同类型的经济维度整理成数据表表格形式展示
"""

import re
import pandas as pd
import json
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

@dataclass
class EconomicIndicator:
    """经济指标数据类"""
    name_en: str
    name_cn: str
    category: str
    subcategory: str
    indicator_type: str  # Leading, Coincident, Lagging
    importance: str  # High, Medium, Low
    frequency: str  # Daily, Weekly, Monthly, Quarterly
    source: str
    description: str
    scorecard_range: str = ""
    trading_significance: str = ""

class CompleteEconomicIndicatorAnalyzer:
    """完整的经济指标分析器"""
    
    def __init__(self):
        self.indicators = []
        self.initialize_comprehensive_database()
    
    def initialize_comprehensive_database(self):
        """初始化综合的经济指标数据库"""
        
        # 内生驱动因素 - 领先指标
        leading_indicators = [
            # 调查类指标 (Surveys)
            EconomicIndicator(
                "ISM Manufacturing Index", "ISM制造业指数", "内生驱动因素", "调查类指标", 
                "Leading", "High", "Monthly", "Institute for Supply Management", 
                "制造业活动的领先指标，预测未来经济状况",
                "-10 to +10 scorecard", "高于50看多货币，低于50看空货币"
            ),
            EconomicIndicator(
                "ISM Non-Manufacturing Index (NMI)", "ISM非制造业指数", "内生驱动因素", "调查类指标",
                "Leading", "High", "Monthly", "Institute for Supply Management", 
                "服务业活动的领先指标，占美国经济80%",
                "-10 to +10 scorecard", "服务业扩张或收缩的关键指标"
            ),
            EconomicIndicator(
                "University of Michigan Consumer Sentiment Index", "密歇根大学消费者情绪指数", 
                "内生驱动因素", "调查类指标", "Leading", "Medium", "Monthly", 
                "University of Michigan", "消费者信心的领先指标，影响消费支出",
                "-5 to +5 scorecard", "消费者支出占GDP 70%的重要预测指标"
            ),
            
            # 建筑许可 (Building Permits)
            EconomicIndicator(
                "Building Permits", "建筑许可", "内生驱动因素", "房地产指标", 
                "Leading", "High", "Monthly", "US Census Bureau", 
                "未来GDP增长的领先指标，反映开发商信心",
                "Volatility-based scoring", "房地产市场健康的早期信号"
            ),
            EconomicIndicator(
                "Housing Starts", "房屋开工", "内生驱动因素", "房地产指标",
                "Leading", "High", "Monthly", "US Census Bureau", 
                "建筑活动的领先指标，影响就业和材料需求",
                "YoY % change based", "建筑业就业和相关行业的驱动因素"
            ),
            
            # 货币供应 (Money Supply) - 关键的货币政策指标
            EconomicIndicator(
                "M1 Money Supply", "M1货币供应", "内生驱动因素", "货币政策指标",
                "Leading", "High", "Weekly", "Federal Reserve Bank of St. Louis", 
                "流通中现金和活期存款，最液体的货币",
                "Growth rate based", "直接影响短期流动性和通胀预期"
            ),
            EconomicIndicator(
                "M2 Money Supply", "M2货币供应", "内生驱动因素", "货币政策指标",
                "Leading", "High", "Weekly", "Federal Reserve Bank of St. Louis", 
                "M1加储蓄存款和定期存款，经典印钞指标",
                "-10 to +10 based on historical distribution", "量化宽松政策的直接反映"
            ),
            EconomicIndicator(
                "M3 Money Supply", "M3货币供应", "内生驱动因素", "货币政策指标",
                "Leading", "Medium", "Monthly", "Federal Reserve", 
                "M2加大额定期存款和机构货币市场基金",
                "Trend analysis", "广义货币供应量指标"
            ),
            
            # PPI作为通胀的领先指标
            EconomicIndicator(
                "Producer Price Index (PPI)", "生产者价格指数", "内生驱动因素", "通胀指标",
                "Leading", "High", "Monthly", "Bureau of Labor Statistics", 
                "企业通胀的领先指标，预测CPI变化",
                "Historical distribution based", "成本推动型通胀的早期信号"
            ),
            EconomicIndicator(
                "PPI Excluding Food and Energy", "核心PPI", "内生驱动因素", "通胀指标",
                "Leading", "High", "Monthly", "Bureau of Labor Statistics", 
                "核心企业通胀指标，排除波动性商品",
                "More stable scoring", "核心通胀趋势的预测指标"
            ),
        ]
        
        # 同步指标 - 当前经济状况
        coincident_indicators = [
            # 就业指标 (Employment) - 核心经济指标
            EconomicIndicator(
                "Non-Farm Payrolls (NFP)", "非农就业人数", "内生驱动因素", "就业指标",
                "Coincident", "High", "Monthly", "Bureau of Labor Statistics", 
                "就业创造的同步指标，最重要的月度数据",
                "-400k to +400k distribution", "外汇市场最重要的单一数据点"
            ),
            EconomicIndicator(
                "Initial Jobless Claims", "初次申请失业救济人数", "内生驱动因素", "就业指标",
                "Leading", "High", "Weekly", "Department of Labor", 
                "失业的领先指标，每周发布的高频数据",
                "Weekly volatility based", "经济衰退的早期预警信号"
            ),
            EconomicIndicator(
                "Average Hourly Earnings", "平均时薪", "内生驱动因素", "就业指标",
                "Coincident", "High", "Monthly", "Bureau of Labor Statistics", 
                "工资通胀压力指标，反映劳动力市场紧张度",
                "YoY % change", "美联储政策决策的关键输入"
            ),
            EconomicIndicator(
                "Average Weekly Hours", "平均每周工时", "内生驱动因素", "就业指标",
                "Coincident", "Medium", "Monthly", "Bureau of Labor Statistics", 
                "劳动力需求指标，反映企业生产需求",
                "Trend analysis", "就业质量和经济活动强度指标"
            ),
            
            # 通胀指标 (Inflation) - 核心政策目标
            EconomicIndicator(
                "Consumer Price Index (CPI)", "消费者价格指数", "内生驱动因素", "通胀指标",
                "Coincident", "High", "Monthly", "Bureau of Labor Statistics", 
                "消费者通胀的同步指标，覆盖89%人口",
                "Historical distribution -1% to +2%", "美联储双重使命之一的核心指标"
            ),
            EconomicIndicator(
                "CPI Excluding Food and Energy", "核心CPI", "内生驱动因素", "通胀指标",
                "Coincident", "High", "Monthly", "Bureau of Labor Statistics", 
                "核心通胀指标，排除食品和能源波动",
                "More stable than headline CPI", "货币政策制定的核心参考"
            ),
            EconomicIndicator(
                "Personal Consumption Expenditures (PCE)", "个人消费支出价格指数", 
                "内生驱动因素", "通胀指标", "Coincident", "High", "Monthly", 
                "Bureau of Economic Analysis", "美联储首选通胀指标，2%目标基准",
                "Fed's 2% target based", "美联储货币政策的主要目标指标"
            ),
            EconomicIndicator(
                "Import/Export Prices", "进出口价格", "内生驱动因素", "通胀指标",
                "Coincident", "Medium", "Monthly", "Bureau of Labor Statistics", 
                "国际贸易价格变化，影响国内通胀",
                "Trade-weighted analysis", "全球通胀传导的重要渠道"
            ),
        ]
        
        # 滞后指标 - 确认经济趋势
        lagging_indicators = [
            EconomicIndicator(
                "Unemployment Rate", "失业率", "内生驱动因素", "就业指标",
                "Lagging", "High", "Monthly", "Bureau of Labor Statistics", 
                "就业趋势的滞后确认，美联储双重使命指标",
                "Historical range 3-10%", "充分就业目标的衡量标准"
            ),
            EconomicIndicator(
                "Federal Funds Rate", "联邦基金利率", "内生驱动因素", "利率指标",
                "Lagging", "High", "8 times per year", "Federal Reserve", 
                "货币政策的主要工具，影响全球资本流动",
                "Rate change % based", "全球利率基准的核心驱动因素"
            ),
            EconomicIndicator(
                "2-Year Treasury Yield", "2年期国债收益率", "内生驱动因素", "债券收益率",
                "Lagging", "High", "Daily", "US Treasury", 
                "短期利率预期指标，反映近期政策预期",
                "Yield change based", "短期政策利率预期的市场反映"
            ),
            EconomicIndicator(
                "5-Year Treasury Yield", "5年期国债收益率", "内生驱动因素", "债券收益率",
                "Lagging", "High", "Daily", "US Treasury", 
                "中期利率预期指标",
                "Yield curve analysis", "中期经济增长和通胀预期"
            ),
            EconomicIndicator(
                "10-Year Treasury Yield", "10年期国债收益率", "内生驱动因素", "债券收益率",
                "Lagging", "High", "Daily", "US Treasury", 
                "长期利率和经济预期指标，全球基准利率",
                "Global benchmark", "长期经济增长和通胀预期"
            ),
            EconomicIndicator(
                "30-Year Treasury Yield", "30年期国债收益率", "内生驱动因素", "债券收益率",
                "Lagging", "Medium", "Daily", "US Treasury", 
                "超长期经济预期指标",
                "Long-term outlook", "长期财政可持续性指标"
            ),
            EconomicIndicator(
                "10Y-2Y Yield Spread", "10年期-2年期收益率利差", "内生驱动因素", "收益率曲线",
                "Leading", "High", "Daily", "US Treasury", 
                "衰退预测的经典指标，倒挂预示衰退",
                "Inversion signals recession", "经济周期转换的可靠预测指标"
            ),
            EconomicIndicator(
                "10Y-3M Yield Spread", "10年期-3个月收益率利差", "内生驱动因素", "收益率曲线",
                "Leading", "High", "Daily", "US Treasury", 
                "替代衰退预测指标",
                "Alternative recession indicator", "货币政策传导机制的反映"
            ),
        ]
        
        # 外生驱动因素 - 国际比较和相对价值
        exogenous_indicators = [
            # 国际贸易 (International Trade)
            EconomicIndicator(
                "Current Account Balance", "经常账户余额", "外生驱动因素", "贸易指标",
                "Lagging", "High", "Quarterly", "Bureau of Economic Analysis", 
                "国际交易的最广泛衡量，包括贸易、投资收益和转移支付",
                "Surplus/Deficit based", "国际收支平衡的综合指标"
            ),
            EconomicIndicator(
                "Trade Balance", "贸易差额", "外生驱动因素", "贸易指标",
                "Lagging", "High", "Monthly", "US Census Bureau", 
                "商品和服务贸易差额，影响GDP和货币需求",
                "Deficit/Surplus trend", "出口竞争力和进口依赖度指标"
            ),
            EconomicIndicator(
                "Terms of Trade", "贸易条件", "外生驱动因素", "贸易指标",
                "Coincident", "Medium", "Quarterly", "Bureau of Economic Analysis", 
                "出口价格相对进口价格，反映贸易竞争力",
                "Relative price changes", "国际竞争力的价格指标"
            ),
            
            # 相对经济表现 (Relative Economic Performance)
            EconomicIndicator(
                "Interest Rate Differentials", "利率差异", "外生驱动因素", "相对利率",
                "Coincident", "High", "Daily", "Central Banks Worldwide", 
                "跨国利率差异驱动套息交易和资本流动",
                "Carry trade signals", "跨境资本流动的主要驱动因素"
            ),
            EconomicIndicator(
                "GDP Growth Differentials", "GDP增长差异", "外生驱动因素", "经济增长",
                "Lagging", "High", "Quarterly", "Statistical Agencies", 
                "相对经济表现比较，影响长期汇率趋势",
                "Relative growth analysis", "长期货币强弱的基本面基础"
            ),
            EconomicIndicator(
                "Inflation Differentials", "通胀差异", "外生驱动因素", "相对通胀",
                "Coincident", "High", "Monthly", "Statistical Agencies", 
                "跨国通胀差异影响实际汇率",
                "PPP theory based", "购买力平价理论的实践应用"
            ),
            
            # 收益率曲线比较
            EconomicIndicator(
                "Cross-Country Yield Spreads", "跨国收益率利差", "外生驱动因素", "收益率比较",
                "Coincident", "High", "Daily", "Global Bond Markets", 
                "不同国家债券收益率差异，驱动资本流动",
                "Spread analysis", "国际债券投资流向的决定因素"
            ),
            
            # 股票市场指标 (Stock Market Indicators) - 相对财富
            EconomicIndicator(
                "S&P 500 Index", "标普500指数", "外生驱动因素", "股票市场",
                "Coincident", "High", "Daily", "S&P Dow Jones Indices", 
                "美国股票市场代表，反映美国企业盈利和投资者信心",
                "High watermark based", "美国财富效应的核心指标"
            ),
            EconomicIndicator(
                "Currency-Adjusted Stock Indices", "货币调整股票指数", "外生驱动因素", "相对财富",
                "Coincident", "High", "Daily", "Various Global Exchanges", 
                "以美元计价的各国股指，反映相对财富变化",
                "Relative wealth dynamics", "国际投资组合再平衡的驱动因素"
            ),
            EconomicIndicator(
                "MSCI World Index", "MSCI世界指数", "外生驱动因素", "全球股市",
                "Coincident", "Medium", "Daily", "MSCI", 
                "全球股票市场综合指标",
                "Global risk sentiment", "全球风险偏好的晴雨表"
            ),
        ]
        
        # 市场情绪和技术指标
        sentiment_indicators = [
            EconomicIndicator(
                "VIX Volatility Index", "VIX波动率指数", "市场情绪", "风险情绪",
                "Coincident", "High", "Daily", "Chicago Board Options Exchange", 
                "市场恐慌指标，衡量股票市场预期波动性",
                "Fear/Greed levels", "风险资产配置的关键参考"
            ),
            EconomicIndicator(
                "Dollar Index (DXY)", "美元指数", "市场情绪", "美元强弱",
                "Coincident", "High", "Daily", "ICE", 
                "美元相对主要货币的综合指标",
                "Technical levels", "美元总体强弱的基准指标"
            ),
            EconomicIndicator(
                "COT Report - Large Speculators", "COT大型投机者", "市场情绪", "头寸分析",
                "Lagging", "Medium", "Weekly", "Commodity Futures Trading Commission", 
                "大型投机者货币头寸，反映市场情绪极端",
                "Extreme positioning", "反向指标的重要参考"
            ),
            EconomicIndicator(
                "COT Report - Commercial Hedgers", "COT商业套期保值者", "市场情绪", "头寸分析",
                "Lagging", "Medium", "Weekly", "Commodity Futures Trading Commission", 
                "商业套期保值者头寸，反映实际需求",
                "Real demand signals", "基本面需求的市场反映"
            ),
            EconomicIndicator(
                "Average True Range (ATR)", "平均真实范围", "技术指标", "波动性指标",
                "Coincident", "Medium", "Daily", "Technical Analysis", 
                "价格波动性测量，用于头寸规模和风险管理",
                "Volatility ranking", "风险管理和资本配置的基础"
            ),
        ]
        
        # 大宗商品相关指标
        commodity_indicators = [
            EconomicIndicator(
                "WTI Crude Oil", "WTI原油", "大宗商品", "能源",
                "Coincident", "High", "Daily", "NYMEX", 
                "原油价格影响通胀和贸易平衡",
                "Price level analysis", "能源输入成本的核心指标"
            ),
            EconomicIndicator(
                "Gold Price", "黄金价格", "大宗商品", "贵金属",
                "Coincident", "Medium", "Daily", "COMEX", 
                "避险资产和通胀对冲工具",
                "Safe haven analysis", "货币体系信心的反向指标"
            ),
            EconomicIndicator(
                "CRB Commodity Index", "CRB商品指数", "大宗商品", "综合指数",
                "Coincident", "Medium", "Daily", "Thomson Reuters", 
                "综合商品价格指数，反映通胀压力",
                "Inflationary pressures", "成本推动型通胀的先行指标"
            ),
        ]
        
        # Additional Federal Reserve Daily Monitoring Indicators
        fed_monitoring_indicators = [
            # Fed Balance Sheet and Operations
            EconomicIndicator(
                "Federal Reserve Assets", "美联储资产", "央行政策", "资产负债表", 
                "Leading", "High", "Weekly", "Federal Reserve", 
                "央行资产规模变化，直接反映货币政策宽松程度",
                "Historical expansion cycles", "量化宽松政策的核心指标"
            ),
            EconomicIndicator(
                "Treasury General Account", "财政部一般账户", "央行政策", "政府存款",
                "Leading", "High", "Daily", "Federal Reserve", 
                "政府现金余额，影响银行体系流动性",
                "Liquidity impact analysis", "流动性管理的关键变量"
            ),
            EconomicIndicator(
                "Reverse Repo Operations", "逆回购操作", "央行政策", "货币政策工具",
                "Leading", "High", "Daily", "Federal Reserve", 
                "美联储回收流动性的主要工具",
                "Operation volume based", "货币政策实施的直接工具"
            ),
            EconomicIndicator(
                "SOFR Rate", "担保隔夜融资利率", "央行政策", "基准利率",
                "Coincident", "High", "Daily", "Federal Reserve", 
                "替代LIBOR的新基准利率",
                "Rate level analysis", "新货币政策传导机制"
            ),
            EconomicIndicator(
                "Bank Reserves at Fed", "银行在央行准备金", "央行政策", "银行准备金",
                "Leading", "High", "Daily", "Federal Reserve", 
                "银行体系流动性的核心指标",
                "Liquidity abundance measure", "银行放贷能力的基础"
            ),
            EconomicIndicator(
                "Excess Reserves", "超额准备金", "央行政策", "流动性缓冲",
                "Leading", "High", "Daily", "Federal Reserve", 
                "银行超出法定要求的准备金",
                "QE effectiveness gauge", "流动性过剩程度指标"
            ),
            
            # Credit Market Stress Indicators
            EconomicIndicator(
                "TED Spread", "TED利差", "信用市场", "信用风险",
                "Leading", "High", "Daily", "Market Sources", 
                "3个月LIBOR与3个月国债收益率差",
                "Credit stress levels", "银行间信用风险晴雨表"
            ),
            EconomicIndicator(
                "LIBOR-OIS Spread", "LIBOR-OIS利差", "信用市场", "银行风险",
                "Leading", "High", "Daily", "Market Sources", 
                "银行体系信用压力指标",
                "Banking stress measure", "金融危机早期预警信号"
            ),
            EconomicIndicator(
                "High Yield Credit Spreads", "高收益信用利差", "信用市场", "企业信用",
                "Leading", "High", "Daily", "Bond Markets", 
                "企业信用风险溢价",
                "Economic stress indicator", "企业融资成本压力"
            ),
            EconomicIndicator(
                "Investment Grade Spreads", "投资级利差", "信用市场", "企业信用",
                "Leading", "High", "Daily", "Bond Markets", 
                "高质量企业信用利差",
                "Quality credit barometer", "优质企业融资环境"
            ),
            
            # Banking Sector Health
            EconomicIndicator(
                "Large Bank Assets", "大型银行资产", "银行业", "银行规模",
                "Lagging", "High", "Weekly", "Federal Reserve", 
                "系统重要性银行资产规模",
                "Systemic risk assessment", "金融体系稳定性基础"
            ),
            EconomicIndicator(
                "Bank Lending Standards", "银行放贷标准", "银行业", "信贷政策",
                "Leading", "High", "Quarterly", "Federal Reserve", 
                "银行信贷松紧程度调查",
                "Credit cycle indicator", "信贷周期转换的关键信号"
            ),
            EconomicIndicator(
                "Commercial Bank Deposits", "商业银行存款", "银行业", "资金来源",
                "Coincident", "High", "Weekly", "Federal Reserve", 
                "银行资金来源稳定性",
                "Funding stability measure", "银行放贷资金基础"
            ),
            EconomicIndicator(
                "Bank Capital Ratios", "银行资本充足率", "银行业", "资本充足性",
                "Lagging", "High", "Quarterly", "Federal Reserve", 
                "银行抗风险能力指标",
                "Financial stability core", "银行业健康度核心指标"
            ),
            
            # Inflation Expectations and Real Rates
            EconomicIndicator(
                "5Y5Y Forward Inflation", "5年后5年期远期通胀率", "通胀预期", "长期通胀",
                "Leading", "High", "Daily", "Federal Reserve", 
                "长期通胀锚定指标",
                "Fed's credibility measure", "货币政策可信度指标"
            ),
            EconomicIndicator(
                "TIPS Breakeven Spreads", "TIPS盈亏平衡利差", "通胀预期", "市场通胀预期",
                "Leading", "High", "Daily", "Treasury Market", 
                "市场隐含通胀预期",
                "Market-based inflation gauge", "通胀预期锚定程度"
            ),
            EconomicIndicator(
                "Real Interest Rates", "实际利率", "利率政策", "实际借贷成本",
                "Leading", "High", "Daily", "Federal Reserve", 
                "扣除通胀后的真实利率",
                "Economic stimulus measure", "经济刺激程度的真实反映"
            ),
            
            # International Capital Flows
            EconomicIndicator(
                "Treasury International Capital", "国际资本流动", "国际金融", "跨境投资",
                "Lagging", "High", "Monthly", "US Treasury", 
                "外国对美国证券投资",
                "Capital flow strength", "美元需求的基本面驱动"
            ),
            EconomicIndicator(
                "Central Bank Swap Lines", "央行互换额度", "国际合作", "流动性支持",
                "Leading", "High", "Daily", "Federal Reserve", 
                "国际流动性危机应对工具",
                "Global crisis indicator", "国际金融压力晴雨表"
            ),
            EconomicIndicator(
                "Foreign Holdings of Treasuries", "外国持有美债", "国际金融", "外国投资",
                "Lagging", "High", "Monthly", "US Treasury", 
                "外国央行和投资者美债持有",
                "Safe haven demand", "美元储备货币地位指标"
            ),
            
            # Fed Communication and Forward Guidance
            EconomicIndicator(
                "Fed Dot Plot", "美联储点阵图", "货币政策", "前瞻指引",
                "Leading", "High", "Quarterly", "Federal Reserve", 
                "FOMC成员利率路径预期",
                "Policy path expectations", "市场利率预期锚定工具"
            ),
            EconomicIndicator(
                "Fed Economic Projections", "美联储经济预测", "货币政策", "经济展望",
                "Leading", "High", "Quarterly", "Federal Reserve", 
                "央行对经济前景的官方评估",
                "Official economic outlook", "政策制定的经济基础"
            ),
            EconomicIndicator(
                "FOMC Statement Changes", "FOMC声明变化", "货币政策", "政策沟通",
                "Leading", "High", "Monthly", "Federal Reserve", 
                "政策声明措辞变化分析",
                "Policy shift detector", "政策转向的早期信号"
            ),
            
            # Regional Economic Indicators
            EconomicIndicator(
                "Regional Fed Surveys", "地区联储调查", "区域经济", "地区经济状况",
                "Leading", "Medium", "Monthly", "Regional Fed Banks", 
                "各联储区经济状况调查",
                "Regional economic health", "全国经济的区域分解"
            ),
            EconomicIndicator(
                "Beige Book Summary", "褐皮书摘要", "区域经济", "经济轶事证据",
                "Leading", "Medium", "Bi-monthly", "Federal Reserve", 
                "全国12个联储区经济轶事汇总",
                "Qualitative economic pulse", "定性经济信息的权威来源"
            ),
            
            # Financial Stability Metrics
            EconomicIndicator(
                "Leverage Ratio", "杠杆率", "金融稳定", "银行杠杆",
                "Lagging", "High", "Quarterly", "Federal Reserve", 
                "银行资本与总资产比率",
                "Financial stability core", "系统性风险防范指标"
            ),
            EconomicIndicator(
                "Liquidity Coverage Ratio", "流动性覆盖率", "金融稳定", "流动性风险",
                "Lagging", "High", "Quarterly", "Federal Reserve", 
                "银行短期流动性缓冲",
                "Liquidity stress test", "银行流动性风险管理"
            ),
            EconomicIndicator(
                "Stress Test Results", "压力测试结果", "金融稳定", "银行压力测试",
                "Lagging", "High", "Annual", "Federal Reserve", 
                "银行在压力情景下的表现",
                "Crisis preparedness", "银行危机应对能力评估"
            ),
        ]
        
        # 合并所有指标
        self.indicators.extend(leading_indicators)
        self.indicators.extend(coincident_indicators)
        self.indicators.extend(lagging_indicators)
        self.indicators.extend(exogenous_indicators)
        self.indicators.extend(sentiment_indicators)
        self.indicators.extend(commodity_indicators)
        self.indicators.extend(fed_monitoring_indicators)  # Add the new Fed indicators
    
    def extract_indicators_from_text(self, text: str) -> List[str]:
        """从文本中提取经济指标名称"""
        found_indicators = []
        
        for indicator in self.indicators:
            # 检查英文名称
            if re.search(re.escape(indicator.name_en), text, re.IGNORECASE):
                found_indicators.append(indicator.name_en)
            
            # 检查中文名称
            if re.search(re.escape(indicator.name_cn), text, re.IGNORECASE):
                found_indicators.append(indicator.name_cn)
                
            # 检查简化名称
            short_names = {
                "NFP": "Non-Farm Payrolls (NFP)",
                "CPI": "Consumer Price Index (CPI)",
                "PPI": "Producer Price Index (PPI)",
                "ISM": "ISM Manufacturing Index",
                "VIX": "VIX Volatility Index",
                "DXY": "Dollar Index (DXY)",
                "WTI": "WTI Crude Oil",
                "PCE": "Personal Consumption Expenditures (PCE)"
            }
            
            for short, full in short_names.items():
                if re.search(r'\b' + re.escape(short) + r'\b', text, re.IGNORECASE):
                    found_indicators.append(full)
        
        return list(set(found_indicators))
    
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
                '记分卡范围': indicator.scorecard_range,
                '交易意义': indicator.trading_significance
            })
        
        return pd.DataFrame(data)
    
    def create_category_summary(self) -> pd.DataFrame:
        """创建分类汇总表"""
        df = self.create_indicator_dataframe()
        
        summary_data = []
        
        # 按主要分类汇总
        for category in df['主要分类'].unique():
            category_df = df[df['主要分类'] == category]
            
            # 按子分类进一步分组
            for subcategory in category_df['子分类'].unique():
                sub_df = category_df[category_df['子分类'] == subcategory]
                
                summary_data.append({
                    '主要分类': category,
                    '子分类': subcategory,
                    '指标数量': len(sub_df),
                    '高重要性指标数': len(sub_df[sub_df['重要程度'] == 'High']),
                    '领先指标数': len(sub_df[sub_df['指标类型'] == 'Leading']),
                    '同步指标数': len(sub_df[sub_df['指标类型'] == 'Coincident']),
                    '滞后指标数': len(sub_df[sub_df['指标类型'] == 'Lagging']),
                    '高频指标数': len(sub_df[sub_df['发布频率'].isin(['Daily', 'Weekly'])]),
                    '主要指标': ', '.join(sub_df[sub_df['重要程度'] == 'High']['英文名称'].tolist()[:3])
                })
        
        return pd.DataFrame(summary_data)
    
    def create_priority_matrix(self) -> pd.DataFrame:
        """创建优先级矩阵"""
        df = self.create_indicator_dataframe()
        
        # 定义优先级权重
        importance_weight = {'High': 3, 'Medium': 2, 'Low': 1}
        type_weight = {'Leading': 3, 'Coincident': 2, 'Lagging': 1}
        frequency_weight = {'Daily': 3, 'Weekly': 2.5, 'Monthly': 2, 'Quarterly': 1, '8 times per year': 1.5}
        
        priority_data = []
        
        for _, indicator in df.iterrows():
            priority_score = (
                importance_weight.get(indicator['重要程度'], 1) * 0.5 +
                type_weight.get(indicator['指标类型'], 1) * 0.3 +
                frequency_weight.get(indicator['发布频率'], 1) * 0.2
            )
            
            priority_data.append({
                '指标名称': indicator['英文名称'],
                '中文名称': indicator['中文名称'],
                '分类': indicator['主要分类'],
                '子分类': indicator['子分类'],
                '重要程度': indicator['重要程度'],
                '指标类型': indicator['指标类型'],
                '发布频率': indicator['发布频率'],
                '优先级分数': round(priority_score, 2),
                '推荐关注度': self.get_attention_level(priority_score),
                '交易意义': indicator['交易意义']
            })
        
        priority_df = pd.DataFrame(priority_data)
        return priority_df.sort_values('优先级分数', ascending=False)
    
    def get_attention_level(self, score: float) -> str:
        """根据优先级分数确定关注度"""
        if score >= 2.7:
            return "🔴 核心关注"
        elif score >= 2.3:
            return "🟡 重点关注"
        elif score >= 1.8:
            return "🟢 一般关注"
        else:
            return "⚪ 选择性关注"
    
    def create_trading_calendar(self) -> pd.DataFrame:
        """创建交易日历"""
        df = self.create_indicator_dataframe()
        
        # 按发布频率分组
        calendar_data = []
        
        frequency_map = {
            'Daily': '每日',
            'Weekly': '每周',
            'Monthly': '每月',
            'Quarterly': '每季度',
            '8 times per year': '每年8次'
        }
        
        for freq, freq_cn in frequency_map.items():
            freq_indicators = df[df['发布频率'] == freq]
            high_importance = freq_indicators[freq_indicators['重要程度'] == 'High']
            
            calendar_data.append({
                '发布频率': freq_cn,
                '总指标数': len(freq_indicators),
                '高重要性指标数': len(high_importance),
                '核心关注指标': ', '.join(high_importance['英文名称'].tolist()[:5]),
                '建议关注程度': '极高' if freq in ['Monthly', 'Weekly'] else '高' if freq == 'Daily' else '中等'
            })
        
        return pd.DataFrame(calendar_data)
    
    def create_correlation_matrix(self) -> pd.DataFrame:
        """创建指标相关性矩阵概念框架"""
        correlation_data = [
            {
                '指标组合': 'NFP vs 失业率',
                '相关性': '强负相关',
                '交易含义': 'NFP上升通常对应失业率下降',
                '时滞': '同步',
                '策略建议': '确认就业趋势强度'
            },
            {
                '指标组合': 'CPI vs 联邦基金利率',
                '相关性': '正相关(滞后)',
                '交易含义': '通胀上升推动加息预期',
                '时滞': '3-6个月',
                '策略建议': '提前布局利率敏感货币对'
            },
            {
                '指标组合': 'PPI vs CPI',
                '相关性': '正相关(领先)',
                '交易含义': 'PPI领先CPI 1-2个月',
                '时滞': '1-2个月',
                '策略建议': 'PPI作为CPI的早期信号'
            },
            {
                '指标组合': 'ISM vs GDP',
                '相关性': '强正相关',
                '交易含义': 'ISM>50预示GDP增长',
                '时滞': '1-3个月',
                '策略建议': '经济周期转折点的早期信号'
            },
            {
                '指标组合': '收益率利差 vs 经济衰退',
                '相关性': '倒挂预示衰退',
                '交易含义': '10Y-2Y倒挂12-18个月后衰退',
                '时滞': '12-18个月',
                '策略建议': '长期策略调整的重要信号'
            }
        ]
        
        return pd.DataFrame(correlation_data)
    
    def export_to_excel(self, filename: str = None):
        """导出到Excel文件"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"专业外汇交易经济指标完整分析报告_{timestamp}.xlsx"
        
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            # 1. 完整指标列表
            df_indicators = self.create_indicator_dataframe()
            df_indicators.to_excel(writer, sheet_name='01_完整指标列表', index=False)
            
            # 2. 优先级矩阵
            df_priority = self.create_priority_matrix()
            df_priority.to_excel(writer, sheet_name='02_优先级矩阵', index=False)
            
            # 3. 分类汇总
            df_summary = self.create_category_summary()
            df_summary.to_excel(writer, sheet_name='03_分类汇总', index=False)
            
            # 4. 交易日历
            df_calendar = self.create_trading_calendar()
            df_calendar.to_excel(writer, sheet_name='04_交易日历', index=False)
            
            # 5. 相关性分析
            df_correlation = self.create_correlation_matrix()
            df_correlation.to_excel(writer, sheet_name='05_相关性分析', index=False)
            
            # 6. 按指标类型分组
            df_leading = df_indicators[df_indicators['指标类型'] == 'Leading']
            df_leading.to_excel(writer, sheet_name='06_领先指标', index=False)
            
            df_coincident = df_indicators[df_indicators['指标类型'] == 'Coincident']
            df_coincident.to_excel(writer, sheet_name='07_同步指标', index=False)
            
            df_lagging = df_indicators[df_indicators['指标类型'] == 'Lagging']
            df_lagging.to_excel(writer, sheet_name='08_滞后指标', index=False)
            
            # 7. 按重要程度分组
            df_high = df_indicators[df_indicators['重要程度'] == 'High']
            df_high.to_excel(writer, sheet_name='09_高重要性指标', index=False)
            
            # 8. 按主要分类分组
            df_endogenous = df_indicators[df_indicators['主要分类'] == '内生驱动因素']
            df_endogenous.to_excel(writer, sheet_name='10_内生驱动因素', index=False)
            
            df_exogenous = df_indicators[df_indicators['主要分类'] == '外生驱动因素']
            df_exogenous.to_excel(writer, sheet_name='11_外生驱动因素', index=False)
        
        print(f"📊 Excel报告已生成: {filename}")
        return filename
    
    def print_comprehensive_report(self):
        """打印全面的分析报告"""
        print("=" * 100)
        print("🏦 专业对冲基金外汇交易经济指标完整分析报告")
        print("📊 Professional Hedge Fund Forex Trading Economic Indicators Analysis")
        print("=" * 100)
        
        df = self.create_indicator_dataframe()
        priority_df = self.create_priority_matrix()
        
        # 总体统计
        print("\n📈 总体统计 (Overall Statistics)")
        print("-" * 50)
        print(f"📊 指标总数: {len(df)}")
        print(f"🔴 高重要性指标: {len(df[df['重要程度'] == 'High'])}")
        print(f"📈 领先指标: {len(df[df['指标类型'] == 'Leading'])}")
        print(f"📊 同步指标: {len(df[df['指标类型'] == 'Coincident'])}")
        print(f"📉 滞后指标: {len(df[df['指标类型'] == 'Lagging'])}")
        
        # 按分类统计
        print("\n🏷️ 按主要分类统计 (Category Statistics)")
        print("-" * 50)
        category_counts = df['主要分类'].value_counts()
        for category, count in category_counts.items():
            print(f"   📂 {category}: {count}个指标")
        
        # 按发布频率统计
        print("\n⏱️ 按发布频率统计 (Frequency Statistics)")
        print("-" * 50)
        frequency_counts = df['发布频率'].value_counts()
        for freq, count in frequency_counts.items():
            print(f"   ⏰ {freq}: {count}个指标")
        
        # 核心关注指标
        print("\n🎯 核心关注指标 (Core Focus Indicators)")
        print("-" * 50)
        core_indicators = priority_df[priority_df['推荐关注度'] == '🔴 核心关注'].head(15)
        
        for i, (_, indicator) in enumerate(core_indicators.iterrows(), 1):
            print(f"   {i:2d}. {indicator['指标名称']}")
            print(f"       📝 {indicator['中文名称']}")
            print(f"       📂 {indicator['分类']} → {indicator['子分类']}")
            print(f"       🔢 类型: {indicator['指标类型']} | 重要性: {indicator['重要程度']} | 频率: {indicator['发布频率']}")
            print(f"       💡 {indicator['交易意义']}")
            print(f"       ⭐ 优先级分数: {indicator['优先级分数']}")
            print()
        
        # 按子分类的详细统计
        print("\n📋 按子分类详细统计 (Subcategory Details)")
        print("-" * 50)
        subcategory_stats = df.groupby(['主要分类', '子分类']).agg({
            '重要程度': lambda x: (x == 'High').sum(),
            '指标类型': 'count'
        }).reset_index()
        subcategory_stats.columns = ['主要分类', '子分类', '高重要性数量', '总数量']
        
        for _, row in subcategory_stats.iterrows():
            print(f"   📁 {row['主要分类']} → {row['子分类']}")
            print(f"      总计: {row['总数量']} | 高重要性: {row['高重要性数量']}")
        
        print("\n" + "=" * 100)
        print("✅ 报告生成完成！详细数据请查看Excel文件。")
        print("🔍 建议重点关注标记为'🔴 核心关注'的指标进行日常交易决策。")
        print("=" * 100)

def main():
    """主函数"""
    print("🚀 启动完整经济指标分析器...")
    print("📋 正在初始化数据库...")
    
    # 创建分析器实例
    analyzer = CompleteEconomicIndicatorAnalyzer()
    
    # 打印全面报告
    analyzer.print_comprehensive_report()
    
    # 导出Excel报告
    filename = analyzer.export_to_excel()
    
    print(f"\n📁 详细Excel报告文件: {filename}")
    print("\n📋 Excel报告包含以下工作表:")
    print("   📊 01_完整指标列表 - 所有经济指标的详细信息")
    print("   🎯 02_优先级矩阵 - 按重要性和交易价值排序")
    print("   📈 03_分类汇总 - 按类别统计的指标数量")
    print("   📅 04_交易日历 - 按发布频率组织的交易日历")
    print("   🔗 05_相关性分析 - 指标间相关性和交易策略")
    print("   📈 06_领先指标 - 预测性经济指标")
    print("   📊 07_同步指标 - 实时经济状况指标")
    print("   📉 08_滞后指标 - 确认性经济指标")
    print("   🔴 09_高重要性指标 - 核心关注指标列表")
    print("   🏠 10_内生驱动因素 - 国内经济指标")
    print("   🌍 11_外生驱动因素 - 国际比较指标")
    
    print("\n" + "="*80)
    print("🎉 经济指标提取和分类任务完成！")
    print("💼 作为专业对冲基金经理，建议您:")
    print("   1️⃣ 重点关注标记为'🔴 核心关注'的指标")
    print("   2️⃣ 建立基于领先指标的预测体系")
    print("   3️⃣ 使用同步指标确认当前经济状况")
    print("   4️⃣ 通过滞后指标验证趋势持续性")
    print("   5️⃣ 结合内生和外生因素进行全面分析")
    print("="*80)

if __name__ == "__main__":
    main() 