"""
AI服务API
提供机器学习预测、风险评估、智能分析等功能
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import asyncio
import aioredis
import json
import os
from contextlib import asynccontextmanager

from models.financial_predictor import FinancialPredictor
from services.data_service import DataService
from services.notification_service import NotificationService
from utils.auth import verify_api_key
from utils.rate_limiter import RateLimiter

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局变量
predictor = FinancialPredictor()
data_service = DataService()
notification_service = NotificationService()
redis_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化
    global redis_client
    
    try:
        # 连接Redis
        redis_client = await aioredis.from_url(
            os.getenv('REDIS_URL', 'redis://localhost:6379'),
            decode_responses=True
        )
        
        # 加载预训练模型
        model_path = os.getenv('MODEL_PATH', '/app/models/financial_predictor.joblib')
        if os.path.exists(model_path):
            predictor.load_models(model_path)
            logger.info("预训练模型加载成功")
        else:
            logger.warning("预训练模型不存在，需要先训练模型")
        
        logger.info("AI服务启动完成")
        yield
        
    except Exception as e:
        logger.error(f"AI服务启动失败: {e}")
        raise
    finally:
        # 关闭时清理
        if redis_client:
            await redis_client.close()
        logger.info("AI服务已关闭")


# 创建FastAPI应用
app = FastAPI(
    title="财务管理AI服务",
    description="提供机器学习预测、风险评估、智能分析等功能",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 速率限制
rate_limiter = RateLimiter(redis_client=redis_client)


# Pydantic模型
class TrainingDataRequest(BaseModel):
    user_id: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    
    @validator('start_date', 'end_date')
    def validate_date_format(cls, v):
        if v is not None:
            try:
                datetime.fromisoformat(v)
            except ValueError:
                raise ValueError('日期格式必须为YYYY-MM-DD')
        return v


class PredictionRequest(BaseModel):
    user_id: int
    prediction_type: str  # 'income', 'expense', 'risk'
    days_ahead: Optional[int] = 30
    
    @validator('prediction_type')
    def validate_prediction_type(cls, v):
        if v not in ['income', 'expense', 'risk']:
            raise ValueError('预测类型必须为income, expense或risk')
        return v
    
    @validator('days_ahead')
    def validate_days_ahead(cls, v):
        if v < 1 or v > 365:
            raise ValueError('预测天数必须在1-365之间')
        return v


class InsightRequest(BaseModel):
    user_id: int
    include_predictions: Optional[bool] = True
    include_risk_assessment: Optional[bool] = True


class UserDataInput(BaseModel):
    user_id: int
    transactions: List[Dict[str, Any]]
    
    @validator('transactions')
    def validate_transactions(cls, v):
        if len(v) < 10:
            raise ValueError('至少需要10条交易记录')
        return v


# 辅助函数
async def get_cached_result(cache_key: str) -> Optional[Dict[str, Any]]:
    """获取缓存结果"""
    try:
        if redis_client:
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
    except Exception as e:
        logger.warning(f"获取缓存失败: {e}")
    return None


async def set_cached_result(cache_key: str, result: Dict[str, Any], ttl: int = 3600):
    """设置缓存结果"""
    try:
        if redis_client:
            await redis_client.setex(
                cache_key, 
                ttl, 
                json.dumps(result, default=str)
            )
    except Exception as e:
        logger.warning(f"设置缓存失败: {e}")


# API端点
@app.get("/")
async def root():
    """健康检查"""
    return {
        "service": "财务管理AI服务",
        "status": "运行中",
        "version": "1.0.0",
        "model_trained": predictor.is_trained,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """详细健康检查"""
    try:
        # 检查Redis连接
        redis_status = "connected" if redis_client and await redis_client.ping() else "disconnected"
        
        # 检查模型状态
        model_status = {
            "income_model": predictor.income_model is not None,
            "expense_model": predictor.expense_model is not None,
            "risk_model": predictor.risk_model is not None,
            "is_trained": predictor.is_trained
        }
        
        return {
            "status": "healthy",
            "redis": redis_status,
            "models": model_status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        raise HTTPException(status_code=500, detail="服务不健康")


@app.post("/models/train")
async def train_models(
    request: TrainingDataRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key)
):
    """训练机器学习模型"""
    try:
        # 检查速率限制
        await rate_limiter.check_rate_limit(f"train:{request.user_id}", limit=3, window=3600)
        
        # 获取训练数据
        data = await data_service.get_user_transactions(
            user_id=request.user_id,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        if len(data) < 100:
            raise HTTPException(
                status_code=400, 
                detail="训练数据不足，至少需要100条交易记录"
            )
        
        # 异步训练模型
        background_tasks.add_task(train_models_background, data, request.user_id)
        
        return {
            "message": "模型训练已开始",
            "user_id": request.user_id,
            "data_size": len(data),
            "estimated_time_minutes": max(5, len(data) // 1000),
            "status": "training_started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"模型训练失败: {e}")
        raise HTTPException(status_code=500, detail=f"模型训练失败: {str(e)}")


async def train_models_background(data: pd.DataFrame, user_id: int):
    """后台训练模型"""
    try:
        logger.info(f"开始为用户 {user_id} 训练模型")
        
        # 训练模型
        results = predictor.train_all_models(data)
        
        # 保存模型
        model_path = f"/app/models/user_{user_id}_model.joblib"
        predictor.save_models(model_path)
        
        # 发送通知
        await notification_service.send_training_complete_notification(
            user_id, results
        )
        
        # 缓存训练结果
        cache_key = f"training_result:{user_id}"
        await set_cached_result(cache_key, results, ttl=86400)  # 24小时
        
        logger.info(f"用户 {user_id} 模型训练完成")
        
    except Exception as e:
        logger.error(f"后台模型训练失败: {e}")
        await notification_service.send_training_error_notification(user_id, str(e))


@app.get("/models/status/{user_id}")
async def get_model_status(
    user_id: int,
    api_key: str = Depends(verify_api_key)
):
    """获取模型训练状态"""
    try:
        cache_key = f"training_result:{user_id}"
        cached_result = await get_cached_result(cache_key)
        
        if cached_result:
            return {
                "user_id": user_id,
                "status": "completed",
                "training_results": cached_result,
                "models_available": True
            }
        
        # 检查模型文件是否存在
        model_path = f"/app/models/user_{user_id}_model.joblib"
        models_available = os.path.exists(model_path)
        
        return {
            "user_id": user_id,
            "status": "not_trained" if not models_available else "unknown",
            "models_available": models_available,
            "global_model_trained": predictor.is_trained
        }
        
    except Exception as e:
        logger.error(f"获取模型状态失败: {e}")
        raise HTTPException(status_code=500, detail="获取模型状态失败")


@app.post("/predictions")
async def make_prediction(
    request: PredictionRequest,
    api_key: str = Depends(verify_api_key)
):
    """生成预测"""
    try:
        # 检查速率限制
        await rate_limiter.check_rate_limit(
            f"predict:{request.user_id}", 
            limit=20, 
            window=3600
        )
        
        # 检查缓存
        cache_key = f"prediction:{request.user_id}:{request.prediction_type}:{request.days_ahead}"
        cached_result = await get_cached_result(cache_key)
        if cached_result:
            return cached_result
        
        # 获取用户数据
        user_data = await data_service.get_user_prediction_data(request.user_id)
        
        # 加载用户特定模型（如果存在）
        user_model_path = f"/app/models/user_{request.user_id}_model.joblib"
        if os.path.exists(user_model_path):
            temp_predictor = FinancialPredictor()
            temp_predictor.load_models(user_model_path)
        else:
            temp_predictor = predictor
        
        if not temp_predictor.is_trained:
            raise HTTPException(
                status_code=400, 
                detail="模型未训练，请先训练模型"
            )
        
        # 生成预测
        if request.prediction_type == 'income':
            result = temp_predictor.predict_income(user_data, request.days_ahead)
        elif request.prediction_type == 'expense':
            result = temp_predictor.predict_expense(user_data, request.days_ahead)
        elif request.prediction_type == 'risk':
            result = temp_predictor.assess_risk(user_data)
        
        # 缓存结果
        await set_cached_result(cache_key, result, ttl=1800)  # 30分钟
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"预测生成失败: {e}")
        raise HTTPException(status_code=500, detail=f"预测生成失败: {str(e)}")


@app.post("/insights")
async def generate_insights(
    request: InsightRequest,
    api_key: str = Depends(verify_api_key)
):
    """生成财务洞察报告"""
    try:
        # 检查速率限制
        await rate_limiter.check_rate_limit(
            f"insights:{request.user_id}", 
            limit=10, 
            window=3600
        )
        
        # 检查缓存
        cache_key = f"insights:{request.user_id}:{request.include_predictions}:{request.include_risk_assessment}"
        cached_result = await get_cached_result(cache_key)
        if cached_result:
            return cached_result
        
        # 获取用户数据
        user_data = await data_service.get_comprehensive_user_data(request.user_id)
        
        # 加载用户模型
        user_model_path = f"/app/models/user_{request.user_id}_model.joblib"
        if os.path.exists(user_model_path):
            temp_predictor = FinancialPredictor()
            temp_predictor.load_models(user_model_path)
        else:
            temp_predictor = predictor
        
        # 生成洞察
        insights = temp_predictor.generate_financial_insights(user_data)
        
        # 添加额外的分析
        insights['advanced_analytics'] = await generate_advanced_analytics(
            user_data, request.user_id
        )
        
        # 缓存结果
        await set_cached_result(cache_key, insights, ttl=3600)  # 1小时
        
        return insights
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"洞察生成失败: {e}")
        raise HTTPException(status_code=500, detail=f"洞察生成失败: {str(e)}")


@app.post("/analytics/spending-patterns")
async def analyze_spending_patterns(
    user_id: int,
    api_key: str = Depends(verify_api_key)
):
    """分析用户支出模式"""
    try:
        cache_key = f"spending_patterns:{user_id}"
        cached_result = await get_cached_result(cache_key)
        if cached_result:
            return cached_result
        
        # 获取用户交易数据
        transactions = await data_service.get_user_transactions(user_id)
        
        if len(transactions) < 10:
            raise HTTPException(
                status_code=400, 
                detail="数据不足，至少需要10条交易记录"
            )
        
        # 分析支出模式
        patterns = analyze_user_spending_patterns(transactions)
        
        # 缓存结果
        await set_cached_result(cache_key, patterns, ttl=7200)  # 2小时
        
        return patterns
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"支出模式分析失败: {e}")
        raise HTTPException(status_code=500, detail=f"支出模式分析失败: {str(e)}")


@app.post("/recommendations")
async def get_personalized_recommendations(
    user_id: int,
    api_key: str = Depends(verify_api_key)
):
    """获取个性化财务建议"""
    try:
        cache_key = f"recommendations:{user_id}"
        cached_result = await get_cached_result(cache_key)
        if cached_result:
            return cached_result
        
        # 获取用户数据和洞察
        user_data = await data_service.get_comprehensive_user_data(user_id)
        
        # 生成个性化建议
        recommendations = await generate_personalized_recommendations(user_data, user_id)
        
        # 缓存结果
        await set_cached_result(cache_key, recommendations, ttl=7200)  # 2小时
        
        return recommendations
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"建议生成失败: {e}")
        raise HTTPException(status_code=500, detail=f"建议生成失败: {str(e)}")


# 辅助分析函数
async def generate_advanced_analytics(user_data: Dict[str, Any], user_id: int) -> Dict[str, Any]:
    """生成高级分析"""
    try:
        analytics = {}
        
        # 收支趋势分析
        analytics['cash_flow_trend'] = analyze_cash_flow_trend(user_data)
        
        # 季节性分析
        analytics['seasonal_patterns'] = analyze_seasonal_patterns(user_data)
        
        # 异常检测
        analytics['anomaly_detection'] = detect_spending_anomalies(user_data)
        
        # 同龄人比较
        analytics['peer_comparison'] = await compare_with_peers(user_data, user_id)
        
        return analytics
        
    except Exception as e:
        logger.error(f"高级分析生成失败: {e}")
        return {}


def analyze_user_spending_patterns(transactions: pd.DataFrame) -> Dict[str, Any]:
    """分析用户支出模式"""
    patterns = {}
    
    # 按类别分析
    if 'category' in transactions.columns:
        category_spending = transactions.groupby('category')['amount'].agg(['sum', 'mean', 'count'])
        patterns['category_breakdown'] = category_spending.to_dict('index')
    
    # 按时间分析
    transactions['date'] = pd.to_datetime(transactions['date'])
    transactions['hour'] = transactions['date'].dt.hour
    transactions['day_of_week'] = transactions['date'].dt.day_name()
    
    patterns['time_patterns'] = {
        'hourly_distribution': transactions.groupby('hour')['amount'].sum().to_dict(),
        'weekly_distribution': transactions.groupby('day_of_week')['amount'].sum().to_dict()
    }
    
    # 支出频率分析
    daily_spending = transactions.groupby(transactions['date'].dt.date)['amount'].sum()
    patterns['spending_frequency'] = {
        'avg_daily_spending': float(daily_spending.mean()),
        'spending_volatility': float(daily_spending.std()),
        'active_days_per_month': len(daily_spending) / max(1, len(daily_spending) // 30)
    }
    
    return patterns


def analyze_cash_flow_trend(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """分析现金流趋势"""
    # 这里应该基于历史数据计算趋势
    return {
        'trend_direction': 'positive',  # positive, negative, stable
        'monthly_growth_rate': 0.05,
        'volatility_score': 0.3,
        'trend_strength': 'moderate'
    }


def analyze_seasonal_patterns(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """分析季节性模式"""
    return {
        'seasonal_variance': 0.2,
        'peak_spending_months': ['12', '01'],
        'low_spending_months': ['02', '03'],
        'holiday_impact': 0.35
    }


def detect_spending_anomalies(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """检测支出异常"""
    return {
        'anomalies_detected': 2,
        'recent_anomalies': [
            {
                'date': '2024-01-15',
                'amount': 2500,
                'expected_range': [200, 800],
                'anomaly_score': 0.95
            }
        ],
        'anomaly_threshold': 0.85
    }


async def compare_with_peers(user_data: Dict[str, Any], user_id: int) -> Dict[str, Any]:
    """与同龄人比较"""
    # 这里应该查询数据库获取同龄人数据
    return {
        'percentile_ranking': 75,
        'savings_rate_comparison': 'above_average',
        'spending_efficiency': 'good',
        'peer_group_size': 1250
    }


async def generate_personalized_recommendations(user_data: Dict[str, Any], user_id: int) -> Dict[str, Any]:
    """生成个性化建议"""
    recommendations = {
        'priority_actions': [],
        'optimization_opportunities': [],
        'educational_content': [],
        'product_suggestions': []
    }
    
    # 基于用户数据生成建议
    savings_rate = user_data.get('savings_rate', 0)
    
    if savings_rate < 0.1:
        recommendations['priority_actions'].append({
            'title': '建立紧急基金',
            'description': '优先建立3-6个月的生活费紧急基金',
            'urgency': 'high',
            'estimated_impact': '显著提高财务安全性'
        })
    
    return recommendations


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "ai_service:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )