#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
风险分析算法实现
"""

import math
from datetime import datetime
import logging

# 配置日志
logger = logging.getLogger(__name__)

class RiskAnalyzer:
    def __init__(self):
        """
        初始化风险分析器
        """
        pass
    
    def analyze_order_risk(self, order_data):
        """
        分析订单风险
        
        Args:
            order_data: 订单数据
            
        Returns:
            tuple: (风险评分, 风险因素列表)
        """
        try:
            risk_factors = []
            risk_score = 0
            
            # 1. 时间风险分析
            time_risk = self._analyze_time_risk(order_data)
            if time_risk > 0:
                risk_factors.append({
                    "factor": "time_risk",
                    "description": "时间风险",
                    "score": time_risk
                })
                risk_score += time_risk
            
            # 2. 地理位置风险分析
            location_risk = self._analyze_location_risk(order_data)
            if location_risk > 0:
                risk_factors.append({
                    "factor": "location_risk",
                    "description": "地理位置风险",
                    "score": location_risk
                })
                risk_score += location_risk
            
            # 3. 用户历史行为风险分析
            user_risk = self._analyze_user_risk(order_data)
            if user_risk > 0:
                risk_factors.append({
                    "factor": "user_risk",
                    "description": "用户历史行为风险",
                    "score": user_risk
                })
                risk_score += user_risk
            
            # 4. 价格异常风险分析
            price_risk = self._analyze_price_risk(order_data)
            if price_risk > 0:
                risk_factors.append({
                    "factor": "price_risk",
                    "description": "价格异常风险",
                    "score": price_risk
                })
                risk_score += price_risk
            
            # 限制风险评分在0-100之间
            risk_score = min(100, max(0, risk_score))
            
            return risk_score, risk_factors
            
        except Exception as e:
            logger.error(f"分析订单风险时出错: {str(e)}")
            return 0, []
    
    def _analyze_time_risk(self, order_data):
        """
        分析时间风险
        
        Args:
            order_data: 订单数据
            
        Returns:
            float: 时间风险评分
        """
        try:
            # 获取订单时间
            order_time_str = order_data.get('order_time')
            if not order_time_str:
                return 0
            
            # 解析时间
            order_time = datetime.fromisoformat(order_time_str.replace('Z', '+00:00'))
            
            # 获取当前时间
            current_time = datetime.now(order_time.tzinfo)
            
            # 计算时间差（小时）
            time_diff_hours = abs((current_time - order_time).total_seconds() / 3600)
            
            # 如果订单时间与当前时间相差过大，增加风险评分
            if time_diff_hours > 24:
                return min(30, time_diff_hours)  # 最高30分风险
            
            return 0
        except Exception as e:
            logger.error(f"分析时间风险时出错: {str(e)}")
            return 0
    
    def _analyze_location_risk(self, order_data):
        """
        分析地理位置风险
        
        Args:
            order_data: 订单数据
            
        Returns:
            float: 地理位置风险评分
        """
        try:
            pickup_lat = order_data.get('pickup_latitude')
            pickup_lng = order_data.get('pickup_longitude')
            dropoff_lat = order_data.get('dropoff_latitude')
            dropoff_lng = order_data.get('dropoff_longitude')
            
            # 检查坐标是否有效
            if None in [pickup_lat, pickup_lng, dropoff_lat, dropoff_lng]:
                return 20  # 坐标不完整，较高风险
            
            # 检查是否为特殊区域（这里简化处理，实际应用中可能需要查询数据库）
            # 例如：机场、火车站等高风险区域
            high_risk_areas = [
                # (lat, lng, radius_km)
                (39.9042, 116.4074, 5),  # 北京市中心
            ]
            
            for area_lat, area_lng, radius in high_risk_areas:
                # 计算距离
                distance = self._calculate_distance(
                    (pickup_lat, pickup_lng),
                    (area_lat, area_lng)
                )
                
                # 如果在高风险区域内，增加风险评分
                if distance <= radius:
                    return 25
            
            return 0
        except Exception as e:
            logger.error(f"分析地理位置风险时出错: {str(e)}")
            return 0
    
    def _analyze_user_risk(self, order_data):
        """
        分析用户历史行为风险
        
        Args:
            order_data: 订单数据
            
        Returns:
            float: 用户风险评分
        """
        try:
            user_history = order_data.get('user_history', {})
            
            # 取消订单率
            cancel_rate = user_history.get('cancel_rate', 0)
            cancel_risk = cancel_rate * 100 * 0.3  # 取消率权重0.3
            
            # 投诉率
            complaint_rate = user_history.get('complaint_rate', 0)
            complaint_risk = complaint_rate * 100 * 0.4  # 投诉率权重0.4
            
            # 用户评分
            user_rating = user_history.get('rating', 5.0)
            rating_risk = max(0, (5.0 - user_rating) * 10)  # 用户评分越低风险越高
            
            # 综合用户风险
            user_risk = cancel_risk + complaint_risk + rating_risk
            
            return min(30, user_risk)  # 最高30分风险
        except Exception as e:
            logger.error(f"分析用户风险时出错: {str(e)}")
            return 0
    
    def _analyze_price_risk(self, order_data):
        """
        分析价格异常风险
        
        Args:
            order_data: 订单数据
            
        Returns:
            float: 价格风险评分
        """
        try:
            # 获取订单价格
            order_price = order_data.get('price', 0)
            
            # 获取预估价格范围
            estimated_min_price = order_data.get('estimated_min_price', 0)
            estimated_max_price = order_data.get('estimated_max_price', 0)
            
            # 检查价格是否在合理范围内
            if order_price < estimated_min_price * 0.5:
                # 价格过低，可能存在欺诈风险
                return 25
            elif order_price > estimated_max_price * 2:
                # 价格过高，可能存在问题
                return 20
            
            return 0
        except Exception as e:
            logger.error(f"分析价格风险时出错: {str(e)}")
            return 0
    
    def _calculate_distance(self, loc1, loc2):
        """
        计算两个地理位置之间的距离（简化计算）
        
        Args:
            loc1: 位置1 (纬度, 经度)
            loc2: 位置2 (纬度, 经度)
            
        Returns:
            float: 距离（公里）
        """
        try:
            lat1, lng1 = loc1
            lat2, lng2 = loc2
            
            # 简化的距离计算（Haversine公式）
            R = 6371  # 地球半径（公里）
            dLat = math.radians(lat2 - lat1)
            dLon = math.radians(lng2 - lng1)
            a = math.sin(dLat/2) * math.sin(dLat/2) + \
                math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
                math.sin(dLon/2) * math.sin(dLon/2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            distance = R * c
            
            return distance
        except Exception as e:
            logger.error(f"计算距离时出错: {str(e)}")
            return float('inf')
    
    def detect_anomaly(self, data):
        """
        检测异常行为
        
        Args:
            data: 检测数据
            
        Returns:
            tuple: (是否异常, 置信度, 详细信息)
        """
        try:
            # 这里可以实现更复杂的异常检测算法
            # 例如：使用机器学习模型检测异常
            
            behaviors = data.get('behaviors', [])
            
            # 简单的异常检测逻辑
            anomaly_count = 0
            total_count = len(behaviors)
            
            # 定义异常行为模式
            anomaly_patterns = [
                "frequent_cancellation",  # 频繁取消订单
                "abnormal_route",         # 异常路线
                "suspicious_payment",     # 可疑支付行为
                "fake_account"            # 虚假账户
            ]
            
            # 检查是否存在异常行为
            detected_anomalies = []
            for behavior in behaviors:
                if behavior in anomaly_patterns:
                    anomaly_count += 1
                    detected_anomalies.append(behavior)
            
            # 计算异常概率
            if total_count > 0:
                anomaly_probability = anomaly_count / total_count
            else:
                anomaly_probability = 0
            
            # 判断是否为异常（阈值设为0.3）
            is_anomaly = anomaly_probability > 0.3
            
            # 计算置信度
            confidence = min(1.0, anomaly_probability * 2)  # 放大置信度
            
            return is_anomaly, confidence, {
                "anomaly_count": anomaly_count,
                "total_count": total_count,
                "anomaly_probability": anomaly_probability,
                "detected_anomalies": detected_anomalies
            }
            
        except Exception as e:
            logger.error(f"检测异常行为时出错: {str(e)}")
            return False, 0, {}

# 创建全局实例
risk_analyzer = RiskAnalyzer()