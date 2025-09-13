#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
风险检测算法测试
"""

import unittest
import sys
import os
from datetime import datetime, timedelta

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from risk_detector.risk_analyzer import RiskAnalyzer

class TestRiskAnalyzer(unittest.TestCase):
    def setUp(self):
        """测试前准备"""
        self.analyzer = RiskAnalyzer()
    
    def test_analyze_order_risk(self):
        """测试订单风险分析"""
        # 模拟订单数据
        order_data = {
            'order_time': datetime.now().isoformat() + 'Z',
            'pickup_latitude': 39.9042,
            'pickup_longitude': 116.4074,
            'dropoff_latitude': 31.2304,
            'dropoff_longitude': 121.4737,
            'price': 150.0,
            'estimated_min_price': 120.0,
            'estimated_max_price': 180.0,
            'user_history': {
                'cancel_rate': 0.05,
                'complaint_rate': 0.02,
                'rating': 4.5
            }
        }
        
        risk_score, risk_factors = self.analyzer.analyze_order_risk(order_data)
        
        # 验证风险评分在合理范围内（0-100）
        self.assertGreaterEqual(risk_score, 0)
        self.assertLessEqual(risk_score, 100)
        
        # 验证返回了风险因素列表
        self.assertIsInstance(risk_factors, list)
    
    def test_analyze_time_risk(self):
        """测试时间风险分析"""
        # 模拟订单数据（时间异常）
        order_data = {
            'order_time': (datetime.now() - timedelta(days=2)).isoformat() + 'Z'
        }
        
        time_risk = self.analyzer._analyze_time_risk(order_data)
        
        # 验证时间风险评分
        self.assertGreater(time_risk, 0)
    
    def test_analyze_location_risk(self):
        """测试地理位置风险分析"""
        # 模拟订单数据（位置异常）
        order_data = {
            'pickup_latitude': 39.9042,
            'pickup_longitude': 116.4074,
            'dropoff_latitude': 39.9042,
            'dropoff_longitude': 116.4074
        }
        
        location_risk = self.analyzer._analyze_location_risk(order_data)
        
        # 验证地理位置风险评分
        self.assertGreaterEqual(location_risk, 0)
    
    def test_analyze_user_risk(self):
        """测试用户风险分析"""
        # 模拟订单数据（用户风险较高）
        order_data = {
            'user_history': {
                'cancel_rate': 0.5,
                'complaint_rate': 0.3,
                'rating': 2.0
            }
        }
        
        user_risk = self.analyzer._analyze_user_risk(order_data)
        
        # 验证用户风险评分
        self.assertGreaterEqual(user_risk, 0)
    
    def test_analyze_price_risk(self):
        """测试价格风险分析"""
        # 模拟订单数据（价格异常）
        order_data = {
            'price': 500.0,
            'estimated_min_price': 100.0,
            'estimated_max_price': 200.0
        }
        
        price_risk = self.analyzer._analyze_price_risk(order_data)
        
        # 验证价格风险评分
        self.assertGreater(price_risk, 0)
    
    def test_detect_anomaly(self):
        """测试异常行为检测"""
        # 模拟检测数据
        data = {
            'behaviors': [
                'normal_behavior',
                'frequent_cancellation',
                'abnormal_route'
            ]
        }
        
        is_anomaly, confidence, details = self.analyzer.detect_anomaly(data)
        
        # 验证返回值类型
        self.assertIsInstance(is_anomaly, bool)
        self.assertIsInstance(confidence, float)
        self.assertIsInstance(details, dict)
        
        # 验证详细信息包含必要的键
        self.assertIn('anomaly_count', details)
        self.assertIn('total_count', details)
        self.assertIn('anomaly_probability', details)
        self.assertIn('detected_anomalies', details)

if __name__ == '__main__':
    unittest.main()