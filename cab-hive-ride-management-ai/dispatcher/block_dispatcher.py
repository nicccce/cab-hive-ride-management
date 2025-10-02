#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
基于地图分块的智能派单算法实现
支持三维度综合考量：距离、用户等待时间、司机评价质量
"""

import math
import time
from geopy.distance import geodesic
import logging
from typing import Dict, List, Tuple, Optional
import numpy as np

# 配置日志
logger = logging.getLogger(__name__)

class BlockDispatcher:
    def __init__(self, grid_size: float = 0.02):
        """
        初始化基于地图分块的派单器
        
        Args:
            grid_size: 网格大小（经纬度单位），默认约2公里
        """
        self.grid_size = grid_size
        self.block_cache = {}  # 区块缓存，存储司机和订单信息
        
    def lat_lng_to_block_id(self, latitude: float, longitude: float) -> str:
        """
        将经纬度转换为区块ID
        
        Args:
            latitude: 纬度
            longitude: 经度
            
        Returns:
            str: 区块ID，格式为"block_x_y"
        """
        try:
            # 计算区块坐标
            block_x = int(latitude / self.grid_size)
            block_y = int(longitude / self.grid_size)
            return f"block_{block_x}_{block_y}"
        except Exception as e:
            logger.error(f"转换经纬度到区块ID时出错: {str(e)}")
            return "block_0_0"
    
    def get_adjacent_blocks(self, block_id: str, radius: int = 1) -> List[str]:
        """
        获取相邻区块
        
        Args:
            block_id: 当前区块ID
            radius: 搜索半径（区块数）
            
        Returns:
            List[str]: 相邻区块ID列表
        """
        try:
            # 解析区块坐标
            _, x_str, y_str = block_id.split('_')
            x = int(x_str)
            y = int(y_str)
            
            adjacent_blocks = []
            
            # 生成相邻区块
            for dx in range(-radius, radius + 1):
                for dy in range(-radius, radius + 1):
                    if dx == 0 and dy == 0:
                        continue  # 跳过当前区块
                    adjacent_blocks.append(f"block_{x + dx}_{y + dy}")
            
            return adjacent_blocks
        except Exception as e:
            logger.error(f"获取相邻区块时出错: {str(e)}")
            return []
    
    def calculate_distance(self, loc1: Tuple[float, float], loc2: Tuple[float, float]) -> float:
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
    
    def calculate_distance_score(self, driver_loc: Tuple[float, float], 
                               order_pickup_loc: Tuple[float, float]) -> float:
        """
        计算距离分数（距离越近分数越高）
        
        Args:
            driver_loc: 司机位置
            order_pickup_loc: 订单上车位置
            
        Returns:
            float: 距离分数（0-100）
        """
        try:
            distance = self.calculate_distance(driver_loc, order_pickup_loc)
            # 距离分数公式：距离越近分数越高，最大距离限制为50公里
            if distance <= 5:
                score = 100  # 5公里内满分
            elif distance <= 20:
                score = 80 + (20 - distance) * 1  # 5-20公里线性递减
            elif distance <= 50:
                score = 60 + (50 - distance) * 0.4  # 20-50公里线性递减
            else:
                score = 0  # 超过50公里为0分
            
            return max(0, min(100, score))
        except Exception as e:
            logger.error(f"计算距离分数时出错: {str(e)}")
            return 0
    
    def calculate_waiting_time_score(self, order_creation_time: str) -> float:
        """
        计算用户等待时间分数（等待时间越长分数越高）
        
        Args:
            order_creation_time: 订单创建时间（ISO格式字符串）
            
        Returns:
            float: 等待时间分数（0-100）
        """
        try:
            # 解析订单创建时间
            from datetime import datetime
            order_time = datetime.fromisoformat(order_creation_time.replace('Z', '+00:00'))
            current_time = datetime.now()
            
            # 计算等待时间（分钟）
            waiting_minutes = (current_time - order_time).total_seconds() / 60
            
            # 等待时间分数：等待时间越长，优先级越高
            if waiting_minutes <= 3:
                score = 20  # 3分钟内低优先级
            elif waiting_minutes <= 10:
                score = 50  # 3-10分钟中等优先级
            elif waiting_minutes <= 20:
                score = 80  # 10-20分钟高优先级
            else:
                score = 100  # 超过20分钟最高优先级
            
            return score
        except Exception as e:
            logger.error(f"计算等待时间分数时出错: {str(e)}")
            return 50
    
    def calculate_driver_quality_score(self, driver_info: Dict) -> float:
        """
        计算司机质量分数（基于评价、经验等）
        
        Args:
            driver_info: 司机信息字典
            
        Returns:
            float: 司机质量分数（0-100）
        """
        try:
            # 评级分数（0-50分）
            rating = driver_info.get('rating', 5.0)
            rating_score = min(50, rating * 10)  # 5星满分对应50分
            
            # 经验分数（0-30分）
            completed_orders = driver_info.get('completed_orders', 0)
            experience_score = min(30, completed_orders * 0.3)  # 每10单加3分
            
            # 服务类型匹配分数（0-20分）
            service_type = driver_info.get('service_type', '')
            # 这里可以根据实际业务逻辑判断服务类型匹配度
            service_match_score = 20 if service_type == 'premium' else 10
            
            total_score = rating_score + experience_score + service_match_score
            return min(100, total_score)
        except Exception as e:
            logger.error(f"计算司机质量分数时出错: {str(e)}")
            return 50
    
    def calculate_comprehensive_score(self, driver: Dict, order: Dict, 
                                   weights: Dict[str, float] = None) -> float:
        """
        计算综合评分（三维度加权）
        
        Args:
            driver: 司机信息
            order: 订单信息
            weights: 权重配置，默认：距离40%，等待时间30%，司机质量30%
            
        Returns:
            float: 综合评分（0-100）
        """
        # 默认权重
        if weights is None:
            weights = {
                'distance': 0.4,
                'waiting_time': 0.3,
                'driver_quality': 0.3
            }
        
        try:
            # 获取位置信息
            driver_loc = (driver['latitude'], driver['longitude'])
            pickup_loc = (order['pickup_latitude'], order['pickup_longitude'])
            
            # 计算各维度分数
            distance_score = self.calculate_distance_score(driver_loc, pickup_loc)
            waiting_time_score = self.calculate_waiting_time_score(order.get('created_at', ''))
            driver_quality_score = self.calculate_driver_quality_score(driver)
            
            # 加权综合评分
            comprehensive_score = (
                distance_score * weights['distance'] +
                waiting_time_score * weights['waiting_time'] +
                driver_quality_score * weights['driver_quality']
            )
            
            logger.info(f"司机 {driver['id']} 综合评分: "
                       f"距离={distance_score:.1f}, "
                       f"等待时间={waiting_time_score:.1f}, "
                       f"司机质量={driver_quality_score:.1f}, "
                       f"综合={comprehensive_score:.1f}")
            
            return comprehensive_score
            
        except Exception as e:
            logger.error(f"计算综合评分时出错: {str(e)}")
            return 0
    
    def find_best_driver_in_blocks(self, order: Dict, 
                                 target_blocks: List[str], 
                                 available_drivers: List[Dict]) -> Optional[Dict]:
        """
        在指定区块列表中寻找最佳司机
        
        Args:
            order: 订单信息
            target_blocks: 目标区块列表
            available_drivers: 可用司机列表
            
        Returns:
            Optional[Dict]: 最佳司机信息，如果没有找到则返回None
        """
        best_driver = None
        best_score = -1
        
        for driver in available_drivers:
            # 检查司机是否在目标区块中
            driver_block = self.lat_lng_to_block_id(driver['latitude'], driver['longitude'])
            if driver_block not in target_blocks:
                continue
            
            # 计算综合评分
            score = self.calculate_comprehensive_score(driver, order)
            
            if score > best_score:
                best_score = score
                best_driver = {
                    'driver': driver,
                    'score': score,
                    'block': driver_block
                }
        
        return best_driver
    
    def dispatch(self, order_data: Dict) -> Dict:
        """
        基于地图分块的智能派单主函数
        
        Args:
            order_data: 订单数据，包含订单信息和可用司机列表
            
        Returns:
            dict: 派单结果
        """
        try:
            order = order_data.get('order', {})
            available_drivers = order_data.get('available_drivers', [])
            
            if not available_drivers:
                return {
                    "success": False,
                    "message": "没有可用的司机",
                    "algorithm": "block_dispatch"
                }
            
            # 获取订单所在区块
            pickup_loc = (order['pickup_latitude'], order['pickup_longitude'])
            order_block = self.lat_lng_to_block_id(pickup_loc[0], pickup_loc[1])
            
            logger.info(f"订单位于区块: {order_block}")
            
            # 搜索策略：先在当前区块搜索，然后扩展到相邻区块
            search_radius = 0
            max_search_radius = 3  # 最大搜索半径（区块数）
            
            best_driver_info = None
            
            while search_radius <= max_search_radius and not best_driver_info:
                # 获取目标区块列表
                if search_radius == 0:
                    target_blocks = [order_block]
                else:
                    target_blocks = self.get_adjacent_blocks(order_block, search_radius)
                
                logger.info(f"搜索半径 {search_radius}, 目标区块: {target_blocks}")
                
                # 在当前搜索范围内寻找最佳司机
                best_driver_info = self.find_best_driver_in_blocks(
                    order, target_blocks, available_drivers
                )
                
                search_radius += 1
            
            if best_driver_info:
                return {
                    "success": True,
                    "driver_id": best_driver_info['driver']['id'],
                    "driver_info": best_driver_info['driver'],
                    "score": best_driver_info['score'],
                    "matched_block": best_driver_info['block'],
                    "search_radius": search_radius - 1,
                    "message": f"派单成功，在{search_radius - 1}级区块找到匹配司机",
                    "algorithm": "block_dispatch"
                }
            else:
                return {
                    "success": False,
                    "message": "在所有搜索范围内未找到合适司机",
                    "algorithm": "block_dispatch"
                }
                
        except Exception as e:
            logger.error(f"派单过程中出错: {str(e)}")
            return {
                "success": False,
                "message": f"派单失败: {str(e)}",
                "algorithm": "block_dispatch"
            }
    
    def reassign(self, data: Dict) -> Dict:
        """
        重新分配司机（支持排除特定司机）
        
        Args:
            data: 重新分配数据，包含订单和排除司机列表
            
        Returns:
            dict: 重新分配结果
        """
        try:
            order_data = data.get('order', {})
            excluded_drivers = data.get('excluded_drivers', [])
            available_drivers = [
                driver for driver in order_data.get('available_drivers', [])
                if driver['id'] not in excluded_drivers
            ]
            
            if not available_drivers:
                return {
                    "success": False,
                    "message": "没有可用的司机",
                    "algorithm": "block_dispatch"
                }
            
            # 使用相同的派单逻辑，但排除特定司机
            dispatch_data = {
                'order': order_data,
                'available_drivers': available_drivers
            }
            
            result = self.dispatch(dispatch_data)
            result['message'] = result['message'].replace('派单', '重新分配')
            return result
            
        except Exception as e:
            logger.error(f"重新分配司机时出错: {str(e)}")
            return {
                "success": False,
                "message": f"重新分配失败: {str(e)}",
                "algorithm": "block_dispatch"
            }

# 创建全局实例
block_dispatcher = BlockDispatcher()