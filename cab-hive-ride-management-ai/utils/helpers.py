#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
工具函数
"""

import json
import logging
from datetime import datetime

# 配置日志
logger = logging.getLogger(__name__)

def load_config(config_path='config.json'):
    """
    加载配置文件
    
    Args:
        config_path (str): 配置文件路径
        
    Returns:
        dict: 配置信息
    """
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        logger.warning(f"配置文件 {config_path} 未找到，使用默认配置")
        return {}
    except Exception as e:
        logger.error(f"加载配置文件时出错: {str(e)}")
        return {}

def format_timestamp(timestamp):
    """
    格式化时间戳
    
    Args:
        timestamp (float): 时间戳
        
    Returns:
        str: 格式化后的时间字符串
    """
    try:
        dt = datetime.fromtimestamp(timestamp)
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except Exception as e:
        logger.error(f"格式化时间戳时出错: {str(e)}")
        return str(timestamp)

def calculate_bearing(lat1, lng1, lat2, lng2):
    """
    计算两个点之间的方位角
    
    Args:
        lat1 (float): 起点纬度
        lng1 (float): 起点经度
        lat2 (float): 终点纬度
        lng2 (float): 终点经度
        
    Returns:
        float: 方位角（度）
    """
    try:
        import math
        
        # 将角度转换为弧度
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lng_rad = math.radians(lng2 - lng1)
        
        # 计算方位角
        y = math.sin(delta_lng_rad) * math.cos(lat2_rad)
        x = math.cos(lat1_rad) * math.sin(lat2_rad) - \
            math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(delta_lng_rad)
        bearing_rad = math.atan2(y, x)
        
        # 将弧度转换为度
        bearing_deg = math.degrees(bearing_rad)
        
        # 确保方位角在0-360度范围内
        bearing_deg = (bearing_deg + 360) % 360
        
        return bearing_deg
    except Exception as e:
        logger.error(f"计算方位角时出错: {str(e)}")
        return 0

def haversine_distance(lat1, lng1, lat2, lng2):
    """
    使用Haversine公式计算两个点之间的距离
    
    Args:
        lat1 (float): 起点纬度
        lng1 (float): 起点经度
        lat2 (float): 终点纬度
        lng2 (float): 终点经度
        
    Returns:
        float: 距离（公里）
    """
    try:
        import math
        
        # 地球半径（公里）
        R = 6371
        
        # 将角度转换为弧度
        lat1_rad = math.radians(lat1)
        lng1_rad = math.radians(lng1)
        lat2_rad = math.radians(lat2)
        lng2_rad = math.radians(lng2)
        
        # 计算差值
        delta_lat_rad = math.radians(lat2 - lat1)
        delta_lng_rad = math.radians(lng2 - lng1)
        
        # Haversine公式
        a = math.sin(delta_lat_rad/2) * math.sin(delta_lat_rad/2) + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * \
            math.sin(delta_lng_rad/2) * math.sin(delta_lng_rad/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return distance
    except Exception as e:
        logger.error(f"计算距离时出错: {str(e)}")
        return 0

def validate_coordinates(lat, lng):
    """
    验证地理坐标是否有效
    
    Args:
        lat (float): 纬度
        lng (float): 经度
        
    Returns:
        bool: 坐标是否有效
    """
    try:
        lat_valid = -90 <= lat <= 90
        lng_valid = -180 <= lng <= 180
        return lat_valid and lng_valid
    except Exception as e:
        logger.error(f"验证坐标时出错: {str(e)}")
        return False