"""
财务预测模型
包含收入支出预测、风险评估、投资建议等机器学习功能
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error, classification_report
import joblib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)


class FinancialPredictor:
    """财务预测模型类"""
    
    def __init__(self):
        self.income_model = None
        self.expense_model = None
        self.risk_model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
        # 模型参数
        self.rf_params = {
            'n_estimators': 100,
            'max_depth': 10,
            'min_samples_split': 5,
            'random_state': 42
        }
        
        self.gb_params = {
            'n_estimators': 100,
            'learning_rate': 0.1,
            'max_depth': 6,
            'random_state': 42
        }
    
    def prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """准备特征数据"""
        try:
            # 时间特征
            data['month'] = pd.to_datetime(data['date']).dt.month
            data['day_of_week'] = pd.to_datetime(data['date']).dt.dayofweek
            data['quarter'] = pd.to_datetime(data['date']).dt.quarter
            data['is_weekend'] = data['day_of_week'].isin([5, 6]).astype(int)
            
            # 滚动统计特征
            data = data.sort_values('date')
            data['amount_7d_avg'] = data['amount'].rolling(window=7, min_periods=1).mean()
            data['amount_30d_avg'] = data['amount'].rolling(window=30, min_periods=1).mean()
            data['amount_7d_std'] = data['amount'].rolling(window=7, min_periods=1).std()
            
            # 类别特征编码
            if 'category' in data.columns:
                data['category_encoded'] = self.label_encoder.fit_transform(data['category'].astype(str))
            
            # 用户行为特征
            user_stats = data.groupby('user_id').agg({
                'amount': ['mean', 'std', 'count'],
                'category': 'nunique'
            }).round(2)
            user_stats.columns = ['user_avg_amount', 'user_std_amount', 'user_transaction_count', 'user_category_count']
            data = data.merge(user_stats, left_on='user_id', right_index=True, how='left')
            
            # 填充缺失值
            data = data.fillna(0)
            
            return data
            
        except Exception as e:
            logger.error(f"特征准备失败: {e}")
            raise
    
    def train_income_prediction_model(self, data: pd.DataFrame) -> Dict[str, Any]:
        """训练收入预测模型"""
        try:
            logger.info("开始训练收入预测模型...")
            
            # 筛选收入数据
            income_data = data[data['type'] == 'income'].copy()
            if len(income_data) < 50:
                raise ValueError("收入数据不足，至少需要50条记录")
            
            # 准备特征
            income_data = self.prepare_features(income_data)
            
            # 选择特征列
            feature_cols = [
                'month', 'day_of_week', 'quarter', 'is_weekend',
                'amount_7d_avg', 'amount_30d_avg', 'amount_7d_std',
                'user_avg_amount', 'user_std_amount', 'user_transaction_count'
            ]
            
            X = income_data[feature_cols]
            y = income_data['amount']
            
            # 数据标准化
            X_scaled = self.scaler.fit_transform(X)
            
            # 划分训练测试集
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )
            
            # 训练模型
            self.income_model = RandomForestRegressor(**self.rf_params)
            self.income_model.fit(X_train, y_train)
            
            # 评估模型
            y_pred = self.income_model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            
            # 特征重要性
            feature_importance = dict(zip(feature_cols, self.income_model.feature_importances_))
            
            logger.info(f"收入预测模型训练完成，MAE: {mae:.2f}")
            
            return {
                'model_type': 'income_prediction',
                'mae': mae,
                'feature_importance': feature_importance,
                'train_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
        except Exception as e:
            logger.error(f"收入预测模型训练失败: {e}")
            raise
    
    def train_expense_prediction_model(self, data: pd.DataFrame) -> Dict[str, Any]:
        """训练支出预测模型"""
        try:
            logger.info("开始训练支出预测模型...")
            
            # 筛选支出数据
            expense_data = data[data['type'] == 'expense'].copy()
            if len(expense_data) < 50:
                raise ValueError("支出数据不足，至少需要50条记录")
            
            # 准备特征
            expense_data = self.prepare_features(expense_data)
            
            # 选择特征列
            feature_cols = [
                'month', 'day_of_week', 'quarter', 'is_weekend',
                'category_encoded', 'amount_7d_avg', 'amount_30d_avg', 'amount_7d_std',
                'user_avg_amount', 'user_std_amount', 'user_transaction_count'
            ]
            
            X = expense_data[feature_cols]
            y = expense_data['amount']
            
            # 数据标准化
            X_scaled = self.scaler.fit_transform(X)
            
            # 划分训练测试集
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )
            
            # 训练模型
            self.expense_model = RandomForestRegressor(**self.rf_params)
            self.expense_model.fit(X_train, y_train)
            
            # 评估模型
            y_pred = self.expense_model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            
            # 特征重要性
            feature_importance = dict(zip(feature_cols, self.expense_model.feature_importances_))
            
            logger.info(f"支出预测模型训练完成，MAE: {mae:.2f}")
            
            return {
                'model_type': 'expense_prediction',
                'mae': mae,
                'feature_importance': feature_importance,
                'train_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
        except Exception as e:
            logger.error(f"支出预测模型训练失败: {e}")
            raise
    
    def train_risk_assessment_model(self, data: pd.DataFrame) -> Dict[str, Any]:
        """训练风险评估模型"""
        try:
            logger.info("开始训练风险评估模型...")
            
            # 计算风险标签（基于支出波动性）
            user_risk = data.groupby('user_id').agg({
                'amount': ['std', 'mean', 'count']
            })
            user_risk.columns = ['amount_std', 'amount_mean', 'transaction_count']
            user_risk['risk_score'] = (
                user_risk['amount_std'] / user_risk['amount_mean'].clip(lower=1)
            ) * np.log(user_risk['transaction_count'] + 1)
            
            # 将风险分为三个等级
            user_risk['risk_level'] = pd.cut(
                user_risk['risk_score'],
                bins=3,
                labels=['low', 'medium', 'high']
            )
            
            # 准备训练数据
            risk_data = data.merge(
                user_risk[['risk_level']], 
                left_on='user_id', 
                right_index=True, 
                how='left'
            )
            risk_data = risk_data.dropna(subset=['risk_level'])
            
            if len(risk_data) < 100:
                raise ValueError("风险评估数据不足，至少需要100条记录")
            
            # 准备特征
            risk_data = self.prepare_features(risk_data)
            
            # 选择特征列
            feature_cols = [
                'amount', 'month', 'day_of_week', 'quarter',
                'amount_7d_avg', 'amount_30d_avg', 'amount_7d_std',
                'user_avg_amount', 'user_std_amount', 'user_transaction_count'
            ]
            
            X = risk_data[feature_cols]
            y = risk_data['risk_level']
            
            # 标签编码
            y_encoded = self.label_encoder.fit_transform(y)
            
            # 数据标准化
            X_scaled = self.scaler.fit_transform(X)
            
            # 划分训练测试集
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
            )
            
            # 训练模型
            self.risk_model = GradientBoostingClassifier(**self.gb_params)
            self.risk_model.fit(X_train, y_train)
            
            # 评估模型
            y_pred = self.risk_model.predict(X_test)
            classification_rep = classification_report(
                y_test, y_pred, 
                target_names=self.label_encoder.classes_,
                output_dict=True
            )
            
            # 特征重要性
            feature_importance = dict(zip(feature_cols, self.risk_model.feature_importances_))
            
            logger.info("风险评估模型训练完成")
            
            return {
                'model_type': 'risk_assessment',
                'classification_report': classification_rep,
                'feature_importance': feature_importance,
                'train_samples': len(X_train),
                'test_samples': len(X_test),
                'risk_classes': list(self.label_encoder.classes_)
            }
            
        except Exception as e:
            logger.error(f"风险评估模型训练失败: {e}")
            raise
    
    def train_all_models(self, data: pd.DataFrame) -> Dict[str, Any]:
        """训练所有模型"""
        try:
            logger.info("开始训练所有财务预测模型...")
            
            results = {}
            
            # 训练收入预测模型
            if len(data[data['type'] == 'income']) >= 50:
                results['income'] = self.train_income_prediction_model(data)
            else:
                logger.warning("收入数据不足，跳过收入预测模型训练")
            
            # 训练支出预测模型
            if len(data[data['type'] == 'expense']) >= 50:
                results['expense'] = self.train_expense_prediction_model(data)
            else:
                logger.warning("支出数据不足，跳过支出预测模型训练")
            
            # 训练风险评估模型
            if len(data) >= 100:
                results['risk'] = self.train_risk_assessment_model(data)
            else:
                logger.warning("数据不足，跳过风险评估模型训练")
            
            self.is_trained = True
            logger.info("所有模型训练完成")
            
            return {
                'status': 'success',
                'models_trained': list(results.keys()),
                'training_results': results,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"模型训练失败: {e}")
            raise
    
    def predict_income(self, user_data: Dict[str, Any], days_ahead: int = 30) -> Dict[str, Any]:
        """预测未来收入"""
        try:
            if self.income_model is None:
                raise ValueError("收入预测模型未训练")
            
            predictions = []
            base_date = datetime.now()
            
            for i in range(days_ahead):
                pred_date = base_date + timedelta(days=i)
                
                # 准备特征
                features = {
                    'month': pred_date.month,
                    'day_of_week': pred_date.weekday(),
                    'quarter': (pred_date.month - 1) // 3 + 1,
                    'is_weekend': 1 if pred_date.weekday() >= 5 else 0,
                    'amount_7d_avg': user_data.get('avg_income_7d', 0),
                    'amount_30d_avg': user_data.get('avg_income_30d', 0),
                    'amount_7d_std': user_data.get('std_income_7d', 0),
                    'user_avg_amount': user_data.get('user_avg_income', 0),
                    'user_std_amount': user_data.get('user_std_income', 0),
                    'user_transaction_count': user_data.get('user_transaction_count', 0)
                }
                
                feature_array = np.array([list(features.values())])
                feature_scaled = self.scaler.transform(feature_array)
                
                predicted_amount = self.income_model.predict(feature_scaled)[0]
                
                predictions.append({
                    'date': pred_date.strftime('%Y-%m-%d'),
                    'predicted_income': max(0, predicted_amount),
                    'confidence': 'medium'  # 可以基于预测间隔计算
                })
            
            total_predicted = sum(p['predicted_income'] for p in predictions)
            
            return {
                'total_predicted_income': total_predicted,
                'daily_predictions': predictions,
                'prediction_period_days': days_ahead,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"收入预测失败: {e}")
            raise
    
    def predict_expense(self, user_data: Dict[str, Any], days_ahead: int = 30) -> Dict[str, Any]:
        """预测未来支出"""
        try:
            if self.expense_model is None:
                raise ValueError("支出预测模型未训练")
            
            predictions = []
            base_date = datetime.now()
            
            for i in range(days_ahead):
                pred_date = base_date + timedelta(days=i)
                
                # 准备特征
                features = {
                    'month': pred_date.month,
                    'day_of_week': pred_date.weekday(),
                    'quarter': (pred_date.month - 1) // 3 + 1,
                    'is_weekend': 1 if pred_date.weekday() >= 5 else 0,
                    'category_encoded': user_data.get('primary_category_encoded', 0),
                    'amount_7d_avg': user_data.get('avg_expense_7d', 0),
                    'amount_30d_avg': user_data.get('avg_expense_30d', 0),
                    'amount_7d_std': user_data.get('std_expense_7d', 0),
                    'user_avg_amount': user_data.get('user_avg_expense', 0),
                    'user_std_amount': user_data.get('user_std_expense', 0),
                    'user_transaction_count': user_data.get('user_transaction_count', 0)
                }
                
                feature_array = np.array([list(features.values())])
                feature_scaled = self.scaler.transform(feature_array)
                
                predicted_amount = self.expense_model.predict(feature_scaled)[0]
                
                predictions.append({
                    'date': pred_date.strftime('%Y-%m-%d'),
                    'predicted_expense': max(0, predicted_amount),
                    'confidence': 'medium'
                })
            
            total_predicted = sum(p['predicted_expense'] for p in predictions)
            
            return {
                'total_predicted_expense': total_predicted,
                'daily_predictions': predictions,
                'prediction_period_days': days_ahead,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"支出预测失败: {e}")
            raise
    
    def assess_risk(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """评估用户财务风险"""
        try:
            if self.risk_model is None:
                raise ValueError("风险评估模型未训练")
            
            # 准备特征
            features = {
                'amount': user_data.get('recent_transaction_amount', 0),
                'month': datetime.now().month,
                'day_of_week': datetime.now().weekday(),
                'quarter': (datetime.now().month - 1) // 3 + 1,
                'amount_7d_avg': user_data.get('avg_amount_7d', 0),
                'amount_30d_avg': user_data.get('avg_amount_30d', 0),
                'amount_7d_std': user_data.get('std_amount_7d', 0),
                'user_avg_amount': user_data.get('user_avg_amount', 0),
                'user_std_amount': user_data.get('user_std_amount', 0),
                'user_transaction_count': user_data.get('user_transaction_count', 0)
            }
            
            feature_array = np.array([list(features.values())])
            feature_scaled = self.scaler.transform(feature_array)
            
            # 预测风险等级
            risk_proba = self.risk_model.predict_proba(feature_scaled)[0]
            risk_level = self.risk_model.predict(feature_scaled)[0]
            risk_class = self.label_encoder.classes_[risk_level]
            
            # 生成风险建议
            risk_advice = self._generate_risk_advice(risk_class, user_data)
            
            return {
                'risk_level': risk_class,
                'risk_probability': {
                    'low': float(risk_proba[0]),
                    'medium': float(risk_proba[1]),
                    'high': float(risk_proba[2])
                },
                'risk_score': float(np.max(risk_proba)),
                'advice': risk_advice,
                'assessed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"风险评估失败: {e}")
            raise
    
    def _generate_risk_advice(self, risk_level: str, user_data: Dict[str, Any]) -> List[str]:
        """生成风险建议"""
        advice = []
        
        if risk_level == 'high':
            advice.extend([
                "您的财务风险较高，建议立即采取行动",
                "考虑削减不必要的支出",
                "建立紧急储备基金",
                "寻求专业财务咨询师的建议"
            ])
        elif risk_level == 'medium':
            advice.extend([
                "您的财务状况中等，有改进空间",
                "建议制定详细的预算计划",
                "增加储蓄比例",
                "定期检查和调整投资组合"
            ])
        else:  # low risk
            advice.extend([
                "您的财务风险较低，保持良好习惯",
                "可以考虑适当的投资机会",
                "继续维持稳健的财务管理",
                "考虑长期理财规划"
            ])
        
        # 基于用户数据的个性化建议
        avg_expense = user_data.get('user_avg_expense', 0)
        avg_income = user_data.get('user_avg_income', 0)
        
        if avg_income > 0:
            expense_ratio = avg_expense / avg_income
            if expense_ratio > 0.8:
                advice.append("支出占收入比例过高，建议控制支出")
            elif expense_ratio < 0.5:
                advice.append("储蓄比例良好，可考虑投资增值")
        
        return advice
    
    def generate_financial_insights(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成财务洞察报告"""
        try:
            insights = {
                'summary': {},
                'predictions': {},
                'risk_assessment': {},
                'recommendations': [],
                'generated_at': datetime.now().isoformat()
            }
            
            # 基础统计洞察
            insights['summary'] = {
                'avg_monthly_income': user_data.get('avg_monthly_income', 0),
                'avg_monthly_expense': user_data.get('avg_monthly_expense', 0),
                'savings_rate': self._calculate_savings_rate(user_data),
                'transaction_frequency': user_data.get('transaction_frequency', 0),
                'top_expense_categories': user_data.get('top_categories', [])
            }
            
            # 预测洞察
            if self.income_model and self.expense_model:
                income_pred = self.predict_income(user_data, 30)
                expense_pred = self.predict_expense(user_data, 30)
                
                insights['predictions'] = {
                    'next_30_days_income': income_pred['total_predicted_income'],
                    'next_30_days_expense': expense_pred['total_predicted_expense'],
                    'predicted_net_cash_flow': (
                        income_pred['total_predicted_income'] - 
                        expense_pred['total_predicted_expense']
                    )
                }
            
            # 风险评估洞察
            if self.risk_model:
                risk_assessment = self.assess_risk(user_data)
                insights['risk_assessment'] = risk_assessment
            
            # 智能建议
            insights['recommendations'] = self._generate_smart_recommendations(insights, user_data)
            
            return insights
            
        except Exception as e:
            logger.error(f"财务洞察生成失败: {e}")
            raise
    
    def _calculate_savings_rate(self, user_data: Dict[str, Any]) -> float:
        """计算储蓄率"""
        income = user_data.get('avg_monthly_income', 0)
        expense = user_data.get('avg_monthly_expense', 0)
        
        if income > 0:
            return max(0, (income - expense) / income)
        return 0
    
    def _generate_smart_recommendations(self, insights: Dict[str, Any], user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """生成智能建议"""
        recommendations = []
        
        # 基于储蓄率的建议
        savings_rate = insights['summary']['savings_rate']
        if savings_rate < 0.1:
            recommendations.append({
                'type': 'savings',
                'priority': 'high',
                'title': '提高储蓄率',
                'description': '当前储蓄率较低，建议将月收入的至少10%用于储蓄',
                'action_items': [
                    '制定详细的月度预算',
                    '削减非必要支出',
                    '设置自动储蓄计划'
                ]
            })
        elif savings_rate > 0.3:
            recommendations.append({
                'type': 'investment',
                'priority': 'medium',
                'title': '考虑投资增值',
                'description': '储蓄率良好，可考虑适当投资以获得更好收益',
                'action_items': [
                    '了解低风险投资产品',
                    '分散投资降低风险',
                    '定期评估投资表现'
                ]
            })
        
        # 基于现金流预测的建议
        if 'predictions' in insights:
            predicted_cash_flow = insights['predictions'].get('predicted_net_cash_flow', 0)
            if predicted_cash_flow < 0:
                recommendations.append({
                    'type': 'cash_flow',
                    'priority': 'high',
                    'title': '现金流预警',
                    'description': '预测下月现金流为负，需要立即采取行动',
                    'action_items': [
                        '检查即将到来的大额支出',
                        '寻找额外收入来源',
                        '推迟非紧急支出'
                    ]
                })
        
        # 基于风险评估的建议
        if 'risk_assessment' in insights:
            risk_level = insights['risk_assessment'].get('risk_level', 'low')
            if risk_level == 'high':
                recommendations.append({
                    'type': 'risk_management',
                    'priority': 'high',
                    'title': '财务风险管理',
                    'description': '当前财务风险较高，建议立即优化财务结构',
                    'action_items': insights['risk_assessment'].get('advice', [])
                })
        
        return recommendations
    
    def save_models(self, model_path: str) -> bool:
        """保存训练好的模型"""
        try:
            model_data = {
                'income_model': self.income_model,
                'expense_model': self.expense_model,
                'risk_model': self.risk_model,
                'scaler': self.scaler,
                'label_encoder': self.label_encoder,
                'is_trained': self.is_trained,
                'saved_at': datetime.now().isoformat()
            }
            
            joblib.dump(model_data, model_path)
            logger.info(f"模型已保存到: {model_path}")
            return True
            
        except Exception as e:
            logger.error(f"模型保存失败: {e}")
            return False
    
    def load_models(self, model_path: str) -> bool:
        """加载已训练的模型"""
        try:
            model_data = joblib.load(model_path)
            
            self.income_model = model_data.get('income_model')
            self.expense_model = model_data.get('expense_model')
            self.risk_model = model_data.get('risk_model')
            self.scaler = model_data.get('scaler')
            self.label_encoder = model_data.get('label_encoder')
            self.is_trained = model_data.get('is_trained', False)
            
            logger.info(f"模型已从 {model_path} 加载")
            return True
            
        except Exception as e:
            logger.error(f"模型加载失败: {e}")
            return False