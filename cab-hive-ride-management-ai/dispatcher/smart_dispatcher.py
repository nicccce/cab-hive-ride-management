#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
智能派单算法实现
"""

import math
from geopy.distance import geodesic
import logging

# 配置日志
logger = logging.getLogger(__name__)

class SmartDispatcher:
    def __init__(self):
        """
        初始化智能派单器
        """
        pass
    
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
    
    def calculate_driver_score(self, driver, order):
        """
        计算司机评分
        
        Args:
            driver: 司机信息
            order: 订单信息
            
        Returns:
            float: 司机评分
        """
        # 获取司机和订单位置
        driver_location = (driver['latitude'], driver['longitude'])
        pickup_location = (order['pickup_latitude'], order['pickup_longitude'])
        
        # 计算距离分数（距离越近分数越高）
        distance = self.calculate_distance(driver_location, pickup_location)
        distance_score = max(0, 100 - distance)  # 简化的距离评分
        
        # 司机评级分数
        rating_score = driver.get('rating', 5.0) * 20  # 评级满分5.0，转换为100分制
        
        # 服务类型匹配分数
        service_match_score = 0
        if driver.get('service_type') == order.get('service_type'):
            service_match_score = 30
        
        # 综合评分
        total_score = distance_score * 0.5 + rating_score * 0.3 + service_match_score * 0.2
        
        return total_score
    
    def dispatch(self, order_data):
        """
        智能派单主函数
        
        Args:
            order_data: 订单数据
            
        Returns:
            dict: 派单结果
        """
        try:
            # 获取可用司机列表
            available_drivers = order_data.get('available_drivers', [])
            
            if not available_drivers:
                return {
                    "success": False,
                    "message": "没有可用的司机"
                }
            
            # 计算每个司机的评分
            driver_scores = []
            for driver in available_drivers:
                score = self.calculate_driver_score(driver, order_data)
                driver_scores.append({
                    "driver_id": driver['id'],
                    "score": score,
                    "driver_info": driver
                })
            
            # 按评分排序
            driver_scores.sort(key=lambda x: x['score'], reverse=True)
            
            # 选择评分最高的司机
            best_driver = driver_scores[0]
            
            return {
                "success": True,
                "driver_id": best_driver['driver_id'],
                "driver_info": best_driver['driver_info'],
                "score": best_driver['score'],
                "message": "派单成功"
            }
            
        except Exception as e:
            logger.error(f"派单过程中出错: {str(e)}")
            return {
                "success": False,
                "message": f"派单失败: {str(e)}"
            }
    
    def reassign(self, data):
        """
        重新分配司机
        
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
            
            # 计算每个司机的评分
            driver_scores = []
            for driver in available_drivers:
                score = self.calculate_driver_score(driver, order_data)
                driver_scores.append({
                    "driver_id": driver['id'],
                    "score": score,
                    "driver_info": driver
                })
            
            # 按评分排序
            driver_scores.sort(key=lambda x: x['score'], reverse=True)
            
            # 选择评分最高的司机
            best_driver = driver_scores[0]
            
            return {
                "success": True,
                "driver_id": best_driver['driver_id'],
                "driver_info": best_driver['driver_info'],
                "score": best_driver['score'],
                "message": "重新分配成功"
            }
            
        except Exception as e:
            logger.error(f"重新分配司机时出错: {str(e)}")
            return {
                "success": False,
                "message": f"重新分配失败: {str(e)}"
            }

# 创建全局实例
smart_dispatcher = SmartDispatcher()