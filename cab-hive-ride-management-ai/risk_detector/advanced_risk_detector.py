#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
高级风险检测器
使用孤立森林和自动编码器进行异常检测
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras import layers, Model
import logging
from datetime import datetime
import math

# 配置日志
logger = logging.getLogger(__name__)

class Autoencoder(Model):
    """自动编码器模型"""
    def __init__(self, input_dim, encoding_dim=16):
        super(Autoencoder, self).__init__()
        self.encoding_dim = encoding_dim
        
        # 编码器
        self.encoder = tf.keras.Sequential([
            layers.Dense(64, activation='relu', input_shape=(input_dim,)),
            layers.Dense(32, activation='relu'),
            layers.Dense(encoding_dim, activation='relu')
        ])
        
        # 解码器
        self.decoder = tf.keras.Sequential([
            layers.Dense(32, activation='relu', input_shape=(encoding_dim,)),
            layers.Dense(64, activation='relu'),
            layers.Dense(input_dim, activation='sigmoid')
        ])

    def call(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

class AdvancedRiskDetector:
    def __init__(self):
        """
        初始化高级风险检测器
        """
        self.isolation_forest = None
        self.autoencoder = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_columns = [
            'pickup_latitude', 'pickup_longitude',
            'dropoff_latitude', 'dropoff_longitude',
            'price', 'estimated_min_price', 'estimated_max_price',
            'user_cancel_rate', 'user_complaint_rate', 'user_rating',
            'hour_of_day', 'day_of_week'
        ]
    
    def _extract_features(self, data):
        """
        从原始数据中提取特征
        
        Args:
            data: 原始数据
            
        Returns:
            np.array: 特征矩阵
        """
        try:
            features = []
            
            for record in data:
                feature_row = []
                
                # 地理位置特征
                feature_row.append(record.get('pickup_latitude', 0))
                feature_row.append(record.get('pickup_longitude', 0))
                feature_row.append(record.get('dropoff_latitude', 0))
                feature_row.append(record.get('dropoff_longitude', 0))
                
                # 价格特征
                feature_row.append(record.get('price', 0))
                feature_row.append(record.get('estimated_min_price', 0))
                feature_row.append(record.get('estimated_max_price', 0))
                
                # 用户行为特征
                user_history = record.get('user_history', {})
                feature_row.append(user_history.get('cancel_rate', 0))
                feature_row.append(user_history.get('complaint_rate', 0))
                feature_row.append(user_history.get('rating', 5.0))
                
                # 时间特征
                order_time_str = record.get('order_time')
                if order_time_str:
                    order_time = datetime.fromisoformat(order_time_str.replace('Z', '+00:00'))
                    feature_row.append(order_time.hour)
                    feature_row.append(order_time.weekday())
                else:
                    feature_row.extend([0, 0])
                
                features.append(feature_row)
            
            return np.array(features)
        except Exception as e:
            logger.error(f"提取特征时出错: {str(e)}")
            # 返回默认特征
            return np.zeros((len(data), len(self.feature_columns)))
    
    def train(self, training_data):
        """
        训练风险检测模型
        
        Args:
            training_data: 训练数据列表
        """
        try:
            if not training_data:
                raise ValueError("训练数据不能为空")
            
            # 提取特征
            X = self._extract_features(training_data)
            
            # 数据标准化
            X_scaled = self.scaler.fit_transform(X)
            
            # 训练孤立森林
            self.isolation_forest = IsolationForest(
                contamination=0.1,  # 异常值比例
                random_state=42,
                n_estimators=100
            )
            self.isolation_forest.fit(X_scaled)
            
            # 训练自动编码器
            input_dim = X_scaled.shape[1]
            self.autoencoder = Autoencoder(input_dim, encoding_dim=16)
            self.autoencoder.compile(optimizer='adam', loss='mse')
            
            # 训练自动编码器
            self.autoencoder.fit(
                X_scaled, X_scaled,
                epochs=50,
                batch_size=32,
                validation_split=0.2,
                verbose=0
            )
            
            self.is_trained = True
            logger.info("高级风险检测器训练完成")
            
        except Exception as e:
            logger.error(f"训练风险检测器时出错: {str(e)}")
            raise
    
    def detect_anomaly_isolation_forest(self, data):
        """
        使用孤立森林检测异常
        
        Args:
            data: 检测数据
            
        Returns:
            tuple: (异常标签, 异常分数)
        """
        try:
            if not self.is_trained or self.isolation_forest is None:
                raise ValueError("模型尚未训练")
            
            # 提取特征
            X = self._extract_features([data] if isinstance(data, dict) else data)
            
            # 数据标准化
            X_scaled = self.scaler.transform(X)
            
            # 预测
            anomaly_labels = self.isolation_forest.predict(X_scaled)
            anomaly_scores = self.isolation_forest.decision_function(X_scaled)
            
            # 转换标签 (-1表示异常, 1表示正常)
            # 转换为 (True表示异常, False表示正常)
            is_anomaly = anomaly_labels == -1
            
            return is_anomaly, anomaly_scores
            
        except Exception as e:
            logger.error(f"使用孤立森林检测异常时出错: {str(e)}")
            return np.array([False]), np.array([0.0])
    
    def detect_anomaly_autoencoder(self, data, threshold=0.1):
        """
        使用自动编码器检测异常
        
        Args:
            data: 检测数据
            threshold: 重构误差阈值
            
        Returns:
            tuple: (是否异常, 重构误差)
        """
        try:
            if not self.is_trained or self.autoencoder is None:
                raise ValueError("模型尚未训练")
            
            # 提取特征
            X = self._extract_features([data] if isinstance(data, dict) else data)
            
            # 数据标准化
            X_scaled = self.scaler.transform(X)
            
            # 预测
            reconstructed = self.autoencoder.predict(X_scaled, verbose=0)
            
            # 计算重构误差
            mse = np.mean(np.power(X_scaled - reconstructed, 2), axis=1)
            
            # 判断是否异常
            is_anomaly = mse > threshold
            
            return is_anomaly, mse
            
        except Exception as e:
            logger.error(f"使用自动编码器检测异常时出错: {str(e)}")
            return np.array([False]), np.array([0.0])
    
    def detect_anomaly_ensemble(self, data):
        """
        使用集成方法检测异常（结合孤立森林和自动编码器）
        
        Args:
            data: 检测数据
            
        Returns:
            dict: 检测结果
        """
        try:
            if not self.is_trained:
                raise ValueError("模型尚未训练")
            
            # 分别使用两种方法检测
            is_anomaly_if, scores_if = self.detect_anomaly_isolation_forest(data)
            is_anomaly_ae, scores_ae = self.detect_anomaly_autoencoder(data)
            
            # 集成结果（简单投票）
            ensemble_anomaly = (is_anomaly_if.astype(int) + is_anomaly_ae.astype(int)) >= 1
            
            # 计算置信度（平均分数）
            confidence = (np.abs(scores_if) + scores_ae) / 2
            
            return {
                "is_anomaly": ensemble_anomaly[0] if len(ensemble_anomaly) == 1 else ensemble_anomaly,
                "confidence": confidence[0] if len(confidence) == 1 else confidence,
                "details": {
                    "isolation_forest": {
                        "is_anomaly": is_anomaly_if[0] if len(is_anomaly_if) == 1 else is_anomaly_if,
                        "score": scores_if[0] if len(scores_if) == 1 else scores_if
                    },
                    "autoencoder": {
                        "is_anomaly": is_anomaly_ae[0] if len(is_anomaly_ae) == 1 else is_anomaly_ae,
                        "reconstruction_error": scores_ae[0] if len(scores_ae) == 1 else scores_ae
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"集成异常检测时出错: {str(e)}")
            return {
                "is_anomaly": False,
                "confidence": 0.0,
                "details": {}
            }
    
    def analyze_order_risk(self, order_data):
        """
        分析订单风险（兼容旧接口）
        
        Args:
            order_data: 订单数据
            
        Returns:
            tuple: (风险评分, 风险因素列表)
        """
        try:
            if not self.is_trained:
                # 如果模型未训练，返回默认风险评估
                return 0, []
            
            # 使用集成方法检测异常
            result = self.detect_anomaly_ensemble(order_data)
            
            # 转换为风险评分
            risk_score = 0
            risk_factors = []
            
            if result["is_anomaly"]:
                # 异常订单，风险评分较高
                risk_score = min(100, result["confidence"] * 100)
                
                # 添加风险因素
                risk_factors.append({
                    "factor": "anomaly_detection",
                    "description": "异常行为检测",
                    "score": risk_score,
                    "confidence": result["confidence"],
                    "details": result["details"]
                })
            
            return risk_score, risk_factors
            
        except Exception as e:
            logger.error(f"分析订单风险时出错: {str(e)}")
            return 0, []

# 创建全局实例
advanced_risk_detector = AdvancedRiskDetector()