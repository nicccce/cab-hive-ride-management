#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
模型训练和更新管理模块
"""

import os
import json
import logging
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import threading
import time

# 配置日志
logger = logging.getLogger(__name__)

class ModelTrainer:
    """模型训练器"""
    
    def __init__(self, model_dir='./models'):
        """
        初始化模型训练器
        
        Args:
            model_dir: 模型存储目录
        """
        self.model_dir = model_dir
        self.models = {}
        self.training_history = {}
        
        # 确保模型目录存在
        os.makedirs(model_dir, exist_ok=True)
    
    def train_rl_dispatcher(self, training_data, model_name='rl_dispatcher'):
        """
        训练强化学习调度器模型
        
        Args:
            training_data: 训练数据
            model_name: 模型名称
            
        Returns:
            dict: 训练结果
        """
        try:
            logger.info(f"开始训练强化学习调度器模型: {model_name}")
            
            # 从dispatcher模块导入RLDispatcher
            from dispatcher.rl_dispatcher import RLDispatcher
            
            # 创建RL调度器实例
            rl_dispatcher = RLDispatcher()
            
            # 准备训练数据
            states, actions, rewards = self._prepare_rl_training_data(training_data)
            
            # 训练模型
            training_result = rl_dispatcher.train(states, actions, rewards)
            
            # 保存模型
            model_path = os.path.join(self.model_dir, f"{model_name}.pkl")
            rl_dispatcher.save_model(model_path)
            
            # 记录训练历史
            self.training_history[model_name] = {
                'timestamp': datetime.now().isoformat(),
                'training_result': training_result,
                'model_path': model_path
            }
            
            logger.info(f"强化学习调度器模型训练完成: {model_name}")
            return {
                'model_name': model_name,
                'model_path': model_path,
                'training_result': training_result
            }
            
        except Exception as e:
            logger.error(f"训练强化学习调度器模型失败: {str(e)}")
            raise
    
    def train_risk_detector(self, training_data, model_name='advanced_risk_detector'):
        """
        训练高级风险检测器模型
        
        Args:
            training_data: 训练数据
            model_name: 模型名称
            
        Returns:
            dict: 训练结果
        """
        try:
            logger.info(f"开始训练高级风险检测器模型: {model_name}")
            
            # 从risk_detector模块导入AdvancedRiskDetector
            from risk_detector.advanced_risk_detector import AdvancedRiskDetector
            
            # 创建高级风险检测器实例
            risk_detector = AdvancedRiskDetector()
            
            # 训练模型
            risk_detector.train(training_data)
            
            # 保存模型
            model_path = os.path.join(self.model_dir, f"{model_name}.pkl")
            self._save_object(risk_detector, model_path)
            
            # 记录训练历史
            self.training_history[model_name] = {
                'timestamp': datetime.now().isoformat(),
                'model_path': model_path
            }
            
            logger.info(f"高级风险检测器模型训练完成: {model_name}")
            return {
                'model_name': model_name,
                'model_path': model_path
            }
            
        except Exception as e:
            logger.error(f"训练高级风险检测器模型失败: {str(e)}")
            raise
    
    def _prepare_rl_training_data(self, training_data):
        """
        准备强化学习训练数据
        
        Args:
            training_data: 原始训练数据
            
        Returns:
            tuple: (states, actions, rewards)
        """
        try:
            states = []
            actions = []
            rewards = []
            
            for record in training_data:
                # 提取状态特征
                state = self._extract_state_features(record)
                states.append(state)
                
                # 提取动作
                action = record.get('selected_driver_id', 0)
                actions.append(action)
                
                # 提取奖励
                reward = record.get('reward', 0)
                rewards.append(reward)
            
            return np.array(states), np.array(actions), np.array(rewards)
            
        except Exception as e:
            logger.error(f"准备强化学习训练数据失败: {str(e)}")
            raise
    
    def _extract_state_features(self, record):
        """
        从记录中提取状态特征
        
        Args:
            record: 数据记录
            
        Returns:
            np.array: 状态特征向量
        """
        try:
            features = []
            
            # 订单特征
            features.append(record.get('passenger_count', 1))
            features.append(record.get('price', 0))
            
            # 地理位置特征
            features.append(record.get('pickup_latitude', 0))
            features.append(record.get('pickup_longitude', 0))
            features.append(record.get('dropoff_latitude', 0))
            features.append(record.get('dropoff_longitude', 0))
            
            # 时间特征
            order_time_str = record.get('order_time')
            if order_time_str:
                order_time = datetime.fromisoformat(order_time_str.replace('Z', '+00:00'))
                features.append(order_time.hour)
                features.append(order_time.weekday())
            else:
                features.extend([0, 0])
            
            # 司机特征
            available_drivers = record.get('available_drivers', [])
            features.append(len(available_drivers))
            
            # 平均司机评级
            avg_rating = np.mean([d.get('rating', 5.0) for d in available_drivers]) if available_drivers else 5.0
            features.append(avg_rating)
            
            return np.array(features)
            
        except Exception as e:
            logger.error(f"提取状态特征失败: {str(e)}")
            # 返回默认特征
            return np.zeros(10)
    
    def _save_object(self, obj, filepath):
        """
        保存Python对象到文件
        
        Args:
            obj: 要保存的对象
            filepath: 文件路径
        """
        try:
            with open(filepath, 'wb') as f:
                pickle.dump(obj, f)
            logger.info(f"对象已保存到: {filepath}")
        except Exception as e:
            logger.error(f"保存对象失败: {str(e)}")
            raise
    
    def load_model(self, model_name):
        """
        加载模型
        
        Args:
            model_name: 模型名称
            
        Returns:
            object: 加载的模型对象
        """
        try:
            model_path = os.path.join(self.model_dir, f"{model_name}.pkl")
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"模型文件不存在: {model_path}")
            
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            
            self.models[model_name] = model
            logger.info(f"模型已加载: {model_name}")
            return model
            
        except Exception as e:
            logger.error(f"加载模型失败: {str(e)}")
            raise
    
    def get_training_history(self):
        """
        获取训练历史
        
        Returns:
            dict: 训练历史记录
        """
        return self.training_history
    
    def schedule_training(self, model_name, training_func, training_data, interval_hours=24):
        """
        安排定期训练任务
        
        Args:
            model_name: 模型名称
            training_func: 训练函数
            training_data: 训练数据
            interval_hours: 训练间隔（小时）
        """
        def training_job():
            while True:
                try:
                    logger.info(f"开始定期训练任务: {model_name}")
                    result = training_func(training_data, model_name)
                    logger.info(f"定期训练任务完成: {model_name}, 结果: {result}")
                except Exception as e:
                    logger.error(f"定期训练任务失败: {model_name}, 错误: {str(e)}")
                
                # 等待下次训练
                time.sleep(interval_hours * 3600)
        
        # 启动训练线程
        training_thread = threading.Thread(target=training_job, daemon=True)
        training_thread.start()
        
        logger.info(f"已安排定期训练任务: {model_name}, 间隔: {interval_hours}小时")

class ModelUpdater:
    """模型更新器"""
    
    def __init__(self, model_trainer):
        """
        初始化模型更新器
        
        Args:
            model_trainer: 模型训练器实例
        """
        self.model_trainer = model_trainer
        self.update_policies = {}
    
    def register_update_policy(self, model_name, policy_func):
        """
        注册模型更新策略
        
        Args:
            model_name: 模型名称
            policy_func: 更新策略函数
        """
        self.update_policies[model_name] = policy_func
        logger.info(f"注册模型更新策略: {model_name}")
    
    def check_and_update_model(self, model_name, current_data, performance_threshold=0.8):
        """
        检查并更新模型
        
        Args:
            model_name: 模型名称
            current_data: 当前数据
            performance_threshold: 性能阈值
            
        Returns:
            bool: 是否更新了模型
        """
        try:
            # 检查是否需要更新
            if model_name in self.update_policies:
                policy_func = self.update_policies[model_name]
                should_update = policy_func(current_data, performance_threshold)
                
                if should_update:
                    logger.info(f"模型性能下降，开始更新模型: {model_name}")
                    
                    # 重新训练模型
                    if model_name == 'rl_dispatcher':
                        result = self.model_trainer.train_rl_dispatcher(current_data, model_name)
                    elif model_name == 'advanced_risk_detector':
                        result = self.model_trainer.train_risk_detector(current_data, model_name)
                    else:
                        logger.warning(f"未知模型类型，无法更新: {model_name}")
                        return False
                    
                    logger.info(f"模型更新完成: {model_name}, 结果: {result}")
                    return True
                else:
                    logger.info(f"模型性能良好，无需更新: {model_name}")
                    return False
            else:
                logger.warning(f"未找到模型更新策略: {model_name}")
                return False
                
        except Exception as e:
            logger.error(f"检查并更新模型失败: {model_name}, 错误: {str(e)}")
            return False

# 创建全局实例
model_trainer = ModelTrainer()
model_updater = ModelUpdater(model_trainer)