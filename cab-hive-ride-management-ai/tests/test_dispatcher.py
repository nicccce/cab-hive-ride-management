#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
派单算法测试
"""

import unittest
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dispatcher.smart_dispatcher import SmartDispatcher

class TestSmartDispatcher(unittest.TestCase):
    def setUp(self):
        """测试前准备"""
        self.dispatcher = SmartDispatcher()
    
    def test_calculate_distance(self):
        """测试距离计算"""
        # 北京到上海的大致距离
        loc1 = (39.9042, 116.4074)  # 北京
        loc2 = (31.2304, 121.4737)  # 上海
        
        distance = self.dispatcher.calculate_distance(loc1, loc2)
        
        # 验证距离在合理范围内（北京到上海约1000-1500公里）
        self.assertGreater(distance, 1000)
        self.assertLess(distance, 1500)
    
    def test_calculate_driver_score(self):
        """测试司机评分计算"""
        # 模拟司机数据
        driver = {
            'id': 1,
            'latitude': 39.9042,
            'longitude': 116.4074,
            'rating': 4.8,
            'service_type': 'premium'
        }
        
        # 模拟订单数据
        order = {
            'pickup_latitude': 39.9042,
            'pickup_longitude': 116.4074,
            'service_type': 'premium'
        }
        
        score = self.dispatcher.calculate_driver_score(driver, order)
        
        # 验证评分在合理范围内（0-100）
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)
    
    def test_dispatch(self):
        """测试派单功能"""
        # 模拟订单数据
        order_data = {
            'pickup_latitude': 39.9042,
            'pickup_longitude': 116.4074,
            'service_type': 'premium',
            'available_drivers': [
                {
                    'id': 1,
                    'latitude': 39.9042,
                    'longitude': 116.4074,
                    'rating': 4.8,
                    'service_type': 'premium'
                },
                {
                    'id': 2,
                    'latitude': 39.9100,
                    'longitude': 116.4100,
                    'rating': 4.5,
                    'service_type': 'standard'
                }
            ]
        }
        
        result = self.dispatcher.dispatch(order_data)
        
        # 验证派单结果
        self.assertTrue(result['success'])
        self.assertIn('driver_id', result)
        self.assertIn('score', result)
    
    def test_dispatch_no_drivers(self):
        """测试没有可用司机的情况"""
        # 模拟订单数据（没有可用司机）
        order_data = {
            'pickup_latitude': 39.9042,
            'pickup_longitude': 116.4074,
            'available_drivers': []
        }
        
        result = self.dispatcher.dispatch(order_data)
        
        # 验证派单结果
        self.assertFalse(result['success'])
        self.assertEqual(result['message'], '没有可用的司机')
    
    def test_reassign(self):
        """测试重新分配司机"""
        # 模拟重新分配数据
        data = {
            'order': {
                'pickup_latitude': 39.9042,
                'pickup_longitude': 116.4074,
                'service_type': 'premium',
                'available_drivers': [
                    {
                        'id': 1,
                        'latitude': 39.9042,
                        'longitude': 116.4074,
                        'rating': 4.8,
                        'service_type': 'premium'
                    },
                    {
                        'id': 2,
                        'latitude': 39.9100,
                        'longitude': 116.4100,
                        'rating': 4.5,
                        'service_type': 'standard'
                    }
                ]
            },
            'excluded_drivers': [1]
        }
        
        result = self.dispatcher.reassign(data)
        
        # 验证重新分配结果
        self.assertTrue(result['success'])
        self.assertEqual(result['driver_id'], 2)  # 应该选择司机2（司机1被排除）
        self.assertIn('score', result)

if __name__ == '__main__':
    unittest.main()