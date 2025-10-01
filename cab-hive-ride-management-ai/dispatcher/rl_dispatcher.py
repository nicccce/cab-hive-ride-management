#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
基于强化学习的智能派单算法实现
"""

import numpy as np
import pandas as pd
from collections import defaultdict
import json
import logging
import pickle
import os
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler
from geopy.distance import geodesic
import math

# 配置日志
logger = logging.getLogger(__name__)

class RLDispatcher:
    def __init__(self, learning_rate=0.1, discount_factor=0.95, epsilon=0.1, 
                 q_table_file='q_table.pkl', scaler_file='scaler.pkl'):
        """
        初始化强化学习派单器
        
        Args:
            learning_rate: 学习率
            discount_factor: 折扣因子
            epsilon: ε-贪婪策略参数
            q_table_file: Q表文件路径
            scaler_file: 特征缩放器文件路径
        """
        self.learning_rate = learning_rate
        self.discount_factor = discount_factor
        self.epsilon = epsilon
        self.q_table_file = q_table_file
        self.scaler_file = scaler_file
        
        # 初始化Q表
        self.q_table = defaultdict(lambda: np.zeros(2))  # 0: 不选择, 1: 选择
        
        # 初始化特征缩放器
        self.scaler = StandardScaler()
        
        # 加载已保存的模型（如果存在）
        self.load_model()
        
        # 特征名称
        self.feature_names = [
            'distance_score', 'rating_score', 'service_match_score', 
            'experience_score', 'traffic_score', 'weather_score',
            'time_of_day_score', 'demand_supply_score'
        ]
    
    def save_model(self):
        """保存模型到文件"""
        try:
            # 保存Q表
            with open(self.q_table_file, 'wb') as f:
                pickle.dump(dict(self.q_table), f)
            
            # 保存特征缩放器
            with open(self.scaler_file, 'wb') as f:
                pickle.dump(self.scaler, f)
                
            logger.info("强化学习模型保存成功")
        except Exception as e:
            logger.error(f"保存模型时出错: {str(e)}")
    
    def load_model(self):
        """从文件加载模型"""
        try:
            # 加载Q表
            if os.path.exists(self.q_table_file):
                with open(self.q_table_file, 'rb') as f:
                    loaded_q_table = pickle.load(f)
                    self.q_table.update(loaded_q_table)
                logger.info("Q表加载成功")
            
            # 加载特征缩放器
            if os.path.exists(self.scaler_file):
                with open(self.scaler_file, 'rb') as f:
                    self.scaler = pickle.load(f)
                logger.info("特征缩放器加载成功")
        except Exception as e:
            logger.error(f"加载模型时出错: {str(e)}")
    
    def extract_features(self, driver, order, context=None):
        """
        提取司机-订单特征向量
        
        Args:
            driver: 司机信息
            order: 订单信息
            context: 上下文信息（交通、天气等）
            
        Returns:
            np.array: 特征向量
        """
        try:
            # 获取司机和订单位置
            driver_location = (driver['latitude'], driver['longitude'])
            pickup_location = (order['pickup_latitude'], order['pickup_longitude'])
            dropoff_location = (order['dropoff_latitude'], order['dropoff_longitude'])
            
            # 1. 距离分数（距离越近分数越高）
            distance = self.calculate_distance(driver_location, pickup_location)
            distance_score = max(0, 100 - distance * 2)  # 调整权重
            
            # 2. 司机评级分数
            rating_score = driver.get('rating', 5.0) * 20  # 评级满分5.0，转换为100分制
            
            # 3. 服务类型匹配分数
            service_match_score = 0
            if driver.get('service_type') == order.get('service_type'):
                service_match_score = 30
            
            # 4. 经验分数（完成订单数）
            experience_score = min(100, driver.get('completed_orders', 0) / 10)  # 每10单增加1分
            
            # 5. 交通状况分数（从上下文获取）
            traffic_score = 100
            if context and 'traffic' in context:
                # 假设交通状况1-5，5为最拥堵
                traffic_level = context.get('traffic', 3)
                traffic_score = 100 - (traffic_level - 1) * 20  # 越拥堵分数越低
            
            # 6. 天气状况分数（从上下文获取）
            weather_score = 100
            if context and 'weather' in context:
                # 假设天气状况1-5，5为最恶劣
                weather_condition = context.get('weather', 1)
                weather_score = 100 - (weather_condition - 1) * 15  # 天气越恶劣分数越低
            
            # 7. 时间段分数
            time_of_day_score = self._calculate_time_score(order)
            
            # 8. 供需关系分数
            demand_supply_score = self._calculate_demand_supply_score(driver, order, context)
            
            # 构建特征向量
            features = np.array([
                distance_score, rating_score, service_match_score,
                experience_score, traffic_score, weather_score,
                time_of_day_score, demand_supply_score
            ])
            
            return features
            
        except Exception as e:
            logger.error(f"提取特征时出错: {str(e)}")
            # 返回默认特征
            return np.array([50.0] * 8)
    
    def _calculate_time_score(self, order):
        """
        计算时间段分数
        
        Args:
            order: 订单信息
            
        Returns:
            float: 时间段分数
        """
        try:
            # 获取订单时间
            order_time_str = order.get('order_time')
            if not order_time_str:
                return 50  # 默认分数
            
            # 解析时间
            order_time = datetime.fromisoformat(order_time_str.replace('Z', '+00:00'))
            
            # 根据时间段分配分数
            hour = order_time.hour
            if 7 <= hour <= 9:  # 早高峰
                return 80
            elif 17 <= hour <= 19:  # 晚高峰
                return 85
            elif 22 <= hour <= 24 or 0 <= hour <= 6:  # 夜间
                return 70
            else:  # 平峰期
                return 60
        except Exception as e:
            logger.error(f"计算时间段分数时出错: {str(e)}")
            return 50
    
    def _calculate_demand_supply_score(self, driver, order, context):
        """
        计算供需关系分数
        
        Args:
            driver: 司机信息
            order: 订单信息
            context: 上下文信息
            
        Returns:
            float: 供需关系分数
        """
        try:
            if not context:
                return 50
            
            # 获取该区域的司机数和订单数
            available_drivers_count = context.get('available_drivers_count', 10)
            pending_orders_count = context.get('pending_orders_count', 5)
            
            # 计算供需比
            if available_drivers_count > 0:
                demand_supply_ratio = pending_orders_count / available_drivers_count
            else:
                demand_supply_ratio = float('inf')
            
            # 根据供需比分配分数
            # 供需比越高（需求大于供给），分数越高
            if demand_supply_ratio > 2:
                return 90  # 严重供不应求
            elif demand_supply_ratio > 1.5:
                return 80  # 供不应求
            elif demand_supply_ratio > 1:
                return 70  # 略微供不应求
            elif demand_supply_ratio > 0.5:
                return 60  # 供需平衡
            else:
                return 50  # 供过于求
                
        except Exception as e:
            logger.error(f"计算供需关系分数时出错: {str(e)}")
            return 50
    
    def calculate_distance(self, loc1, loc2):
        """
        计算两个地理位置之间的距离（公里）
        
        Args:
            loc1: 起点位置 (纬度, 经度)
            loc2: 终点位置 (纬度, 经度)
            
        Returns:
            float: 两点之间的距离（公里）
        """
        try:
            distance = geodesic(loc1, loc2).kilometers
            return distance
        except Exception as e:
            logger.error(f"计算距离时出错: {str(e)}")
            return float('inf')
    
    def get_state_key(self, features):
        """
        将特征向量转换为状态键
        
        Args:
            features: 特征向量
            
        Returns:
            str: 状态键
        """
        # 将连续特征离散化
        discretized_features = []
        for feature in features:
            # 将特征值离散化为10个区间
            discretized_value = int(feature // 10)
            discretized_features.append(discretized_value)
        
        # 将特征向量转换为字符串作为状态键
        return ','.join(map(str, discretized_features))
    
    def choose_action(self, state_key):
        """
        根据ε-贪婪策略选择动作
        
        Args:
            state_key: 状态键
            
        Returns:
            int: 动作（0: 不选择, 1: 选择）
        """
        # ε-贪婪策略
        if np.random.random() < self.epsilon:
            # 随机选择动作
            return np.random.choice([0, 1])
        else:
            # 选择Q值最大的动作
            return np.argmax(self.q_table[state_key])
    
    def update_q_table(self, state_key, action, reward, next_state_key):
        """
        更新Q表
        
        Args:
            state_key: 当前状态键
            action: 动作
            reward: 奖励
            next_state_key: 下一状态键
        """
        # 获取当前Q值
        current_q = self.q_table[state_key][action]
        
        # 获取下一状态的最大Q值
        next_max_q = np.max(self.q_table[next_state_key])
        
        # 更新Q值
        new_q = current_q + self.learning_rate * (reward + self.discount_factor * next_max_q - current_q)
        self.q_table[state_key][action] = new_q
    
    def calculate_reward(self, driver, order, assignment_result):
        """
        计算奖励值
        
        Args:
            driver: 司机信息
            order: 订单信息
            assignment_result: 分配结果
            
        Returns:
            float: 奖励值
        """
        try:
            reward = 0
            
            # 1. 基础奖励（成功分配）
            if assignment_result.get('success', False):
                reward += 50
            
            # 2. 距离奖励（距离越近奖励越高）
            driver_location = (driver['latitude'], driver['longitude'])
            pickup_location = (order['pickup_latitude'], order['pickup_longitude'])
            distance = self.calculate_distance(driver_location, pickup_location)
            distance_reward = max(0, 20 - distance)  # 距离每公里减少1分奖励
            reward += distance_reward
            
            # 3. 评级奖励（司机评级越高奖励越高）
            rating_reward = driver.get('rating', 5.0) * 5
            reward += rating_reward
            
            # 4. 经验奖励（经验越丰富奖励越高）
            experience_reward = min(20, driver.get('completed_orders', 0) / 50)  # 每50单增加1分奖励
            reward += experience_reward
            
            # 5. 服务匹配奖励
            if driver.get('service_type') == order.get('service_type'):
                reward += 15
            
            # 6. 惩罚项（如果分配失败）
            if not assignment_result.get('success', False):
                reward -= 30
            
            return reward
            
        except Exception as e:
            logger.error(f"计算奖励时出错: {str(e)}")
            return 0
    
    def dispatch(self, order_data):
        """
        基于强化学习的智能派单主函数
        
        Args:
            order_data: 订单数据
            
        Returns:
            dict: 派单结果
        """
        try:
            # 获取可用司机列表
            available_drivers = order_data.get('available_drivers', [])
            context = order_data.get('context', {})
            
            if not available_drivers:
                return {
                    "success": False,
                    "message": "没有可用的司机"
                }
            
            # 为每个司机计算特征和Q值
            driver_scores = []
            
            for driver in available_drivers:
                # 提取特征
                features = self.extract_features(driver, order_data, context)
                
                # 标准化特征
                features_scaled = self.scaler.fit_transform(features.reshape(1, -1)).flatten()
                
                # 获取状态键
                state_key = self.get_state_key(features_scaled)
                
                # 获取Q值
                q_values = self.q_table[state_key]
                
                # 计算综合评分（结合Q值和特征）
                q_score = np.max(q_values)  # 最大Q值
                feature_score = np.mean(features_scaled)  # 特征平均值
                
                # 综合评分
                total_score = q_score * 0.6 + feature_score * 0.4
                
                driver_scores.append({
                    "driver_id": driver['id'],
                    "score": total_score,
                    "q_values": q_values,
                    "features": features_scaled,
                    "driver_info": driver
                })
            
            # 按评分排序
            driver_scores.sort(key=lambda x: x['score'], reverse=True)
            
            # 选择评分最高的司机
            best_driver = driver_scores[0]
            
            # 更新Q表（模拟环境反馈）
            self._update_q_table_with_feedback(best_driver, order_data)
            
            return {
                "success": True,
                "driver_id": best_driver['driver_id'],
                "driver_info": best_driver['driver_info'],
                "score": best_driver['score'],
                "q_values": best_driver['q_values'].tolist(),
                "features": best_driver['features'].tolist(),
                "message": "派单成功"
            }
            
        except Exception as e:
            logger.error(f"派单过程中出错: {str(e)}")
            return {
                "success": False,
                "message": f"派单失败: {str(e)}"
            }
    
    def _update_q_table_with_feedback(self, selected_driver, order_data):
        """
        根据反馈更新Q表
        
        Args:
            selected_driver: 选中的司机信息
            order_data: 订单数据
        """
        try:
            # 模拟分配结果（在实际应用中，这应该来自真实的反馈）
            assignment_result = {
                "success": True,
                "completion_time": 30,  # 分钟
                "rating": 4.8
            }
            
            # 提取特征
            context = order_data.get('context', {})
            features = self.extract_features(selected_driver['driver_info'], order_data, context)
            
            # 标准化特征
            features_scaled = self.scaler.fit_transform(features.reshape(1, -1)).flatten()
            
            # 获取状态键
            state_key = self.get_state_key(features_scaled)
            
            # 计算奖励
            reward = self.calculate_reward(selected_driver['driver_info'], order_data, assignment_result)
            
            # 模拟下一状态（简化处理）
            next_state_key = state_key  # 在实际应用中，这应该是下一时刻的状态
            
            # 更新Q表
            action = 1  # 选择该司机
            self.update_q_table(state_key, action, reward, next_state_key)
            
            # 保存模型
            self.save_model()
            
        except Exception as e:
            logger.error(f"更新Q表时出错: {str(e)}")
    
    def reassign(self, data):
        """
        基于强化学习的重新分配司机
        
        Args:
            data: 重新分配数据
            
        Returns:
            dict: 重新分配结果
        """
        try:
            # 这里可以实现更复杂的重新分配逻辑
            # 例如：考虑司机当前状态、历史订单等
            
            order_data = data.get('order', {})
            excluded_drivers = data.get('excluded_drivers', [])
            context = data.get('context', {})
            
            # 获取可用司机列表（排除已排除的司机）
            available_drivers = [
                driver for driver in order_data.get('available_drivers', [])
                if driver['id'] not in excluded_drivers
            ]
            
            if not available_drivers:
                return {
                    "success": False,
                    "message": "没有可用的司机"
                }
            
            # 为每个司机计算特征和Q值
            driver_scores = []
            
            for driver in available_drivers:
                # 提取特征
                features = self.extract_features(driver, order_data, context)
                
                # 标准化特征
                features_scaled = self.scaler.fit_transform(features.reshape(1, -1)).flatten()
                
                # 获取状态键
                state_key = self.get_state_key(features_scaled)
                
                # 获取Q值
                q_values = self.q_table[state_key]
                
                # 计算综合评分
                q_score = np.max(q_values)
                feature_score = np.mean(features_scaled)
                
                # 综合评分
                total_score = q_score * 0.6 + feature_score * 0.4
                
                driver_scores.append({
                    "driver_id": driver['id'],
                    "score": total_score,
                    "q_values": q_values,
                    "features": features_scaled,
                    "driver_info": driver
                })
            
            # 按评分排序
            driver_scores.sort(key=lambda x: x['score'], reverse=True)
            
            # 选择评分最高的司机
            best_driver = driver_scores[0]
            
            # 更新Q表（模拟环境反馈）
            self._update_q_table_with_feedback(best_driver, order_data)
            
            return {
                "success": True,
                "driver_id": best_driver['driver_id'],
                "driver_info": best_driver['driver_info'],
                "score": best_driver['score'],
                "q_values": best_driver['q_values'].tolist(),
                "features": best_driver['features'].tolist(),
                "message": "重新分配成功"
            }
            
        except Exception as e:
            logger.error(f"重新分配司机时出错: {str(e)}")
            return {
                "success": False,
                "message": f"重新分配失败: {str(e)}"
            }

# 创建全局实例
rl_dispatcher = RLDispatcher()