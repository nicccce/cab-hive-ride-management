#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
A/B测试框架模块
"""

import random
import logging
import json
import time
from datetime import datetime
from collections import defaultdict
import numpy as np
from scipy import stats

# 配置日志
logger = logging.getLogger(__name__)

class ABTestVariant:
    """A/B测试变体"""
    
    def __init__(self, name, algorithm_func, weight=1.0):
        """
        初始化A/B测试变体
        
        Args:
            name: 变体名称
            algorithm_func: 算法函数
            weight: 权重（用于流量分配）
        """
        self.name = name
        self.algorithm_func = algorithm_func
        self.weight = weight
        self.metrics = defaultdict(list)
        self.conversion_count = 0
        self.total_count = 0

class ABTester:
    """A/B测试器"""
    
    def __init__(self, test_name):
        """
        初始化A/B测试器
        
        Args:
            test_name: 测试名称
        """
        self.test_name = test_name
        self.variants = {}
        self.user_assignments = {}  # 用户分配记录
        self.is_running = False
        self.start_time = None
        self.end_time = None
    
    def add_variant(self, name, algorithm_func, weight=1.0):
        """
        添加测试变体
        
        Args:
            name: 变体名称
            algorithm_func: 算法函数
            weight: 权重
        """
        self.variants[name] = ABTestVariant(name, algorithm_func, weight)
        logger.info(f"添加A/B测试变体: {name}")
    
    def start_test(self):
        """启动A/B测试"""
        self.is_running = True
        self.start_time = datetime.now()
        logger.info(f"A/B测试启动: {self.test_name}")
    
    def stop_test(self):
        """停止A/B测试"""
        self.is_running = False
        self.end_time = datetime.now()
        logger.info(f"A/B测试停止: {self.test_name}")
    
    def assign_variant(self, user_id):
        """
        为用户分配变体
        
        Args:
            user_id: 用户ID
            
        Returns:
            str: 分配的变体名称
        """
        if not self.is_running:
            raise RuntimeError("A/B测试未运行")
        
        # 检查用户是否已分配
        if user_id in self.user_assignments:
            return self.user_assignments[user_id]
        
        # 根据权重分配变体
        variant_names = list(self.variants.keys())
        weights = [self.variants[name].weight for name in variant_names]
        
        # 归一化权重
        total_weight = sum(weights)
        if total_weight > 0:
            probabilities = [w / total_weight for w in weights]
        else:
            probabilities = [1.0 / len(weights)] * len(weights)
        
        # 随机选择变体
        selected_variant = np.random.choice(variant_names, p=probabilities)
        
        # 记录分配
        self.user_assignments[user_id] = selected_variant
        self.variants[selected_variant].total_count += 1
        
        logger.debug(f"用户 {user_id} 分配到变体: {selected_variant}")
        return selected_variant
    
    def run_algorithm(self, user_id, *args, **kwargs):
        """
        运行分配给用户的算法
        
        Args:
            user_id: 用户ID
            *args: 算法参数
            **kwargs: 算法关键字参数
            
        Returns:
            tuple: (变体名称, 算法结果)
        """
        if not self.is_running:
            raise RuntimeError("A/B测试未运行")
        
        # 分配变体
        variant_name = self.assign_variant(user_id)
        variant = self.variants[variant_name]
        
        # 运行算法
        start_time = time.time()
        result = variant.algorithm_func(*args, **kwargs)
        execution_time = time.time() - start_time
        
        # 记录指标
        variant.metrics['execution_time'].append(execution_time)
        variant.metrics['result'].append(result)
        
        return variant_name, result
    
    def record_conversion(self, user_id, is_conversion=True):
        """
        记录用户转化
        
        Args:
            user_id: 用户ID
            is_conversion: 是否转化
        """
        if user_id not in self.user_assignments:
            logger.warning(f"用户 {user_id} 未分配到任何变体")
            return
        
        variant_name = self.user_assignments[user_id]
        variant = self.variants[variant_name]
        
        if is_conversion:
            variant.conversion_count += 1
        
        logger.debug(f"用户 {user_id} 在变体 {variant_name} 中转化: {is_conversion}")
    
    def get_variant_stats(self):
        """
        获取各变体统计信息
        
        Returns:
            dict: 统计信息
        """
        stats = {}
        for name, variant in self.variants.items():
            conversion_rate = 0
            if variant.total_count > 0:
                conversion_rate = variant.conversion_count / variant.total_count
            
            # 计算执行时间统计
            execution_times = variant.metrics['execution_time']
            avg_execution_time = np.mean(execution_times) if execution_times else 0
            std_execution_time = np.std(execution_times) if execution_times else 0
            
            stats[name] = {
                'total_count': variant.total_count,
                'conversion_count': variant.conversion_count,
                'conversion_rate': conversion_rate,
                'avg_execution_time': avg_execution_time,
                'std_execution_time': std_execution_time
            }
        
        return stats
    
    def get_statistical_significance(self, variant_a, variant_b, alpha=0.05):
        """
        计算两个变体之间的统计显著性（使用Z检验）
        
        Args:
            variant_a: 变体A名称
            variant_b: 变体B名称
            alpha: 显著性水平
            
        Returns:
            dict: 统计检验结果
        """
        if variant_a not in self.variants or variant_b not in self.variants:
            raise ValueError("无效的变体名称")
        
        var_a = self.variants[variant_a]
        var_b = self.variants[variant_b]
        
        # 获取转化数据
        conversions_a = var_a.conversion_count
        total_a = var_a.total_count
        conversions_b = var_b.conversion_count
        total_b = var_b.total_count
        
        if total_a == 0 or total_b == 0:
            return {
                'z_score': 0,
                'p_value': 1.0,
                'is_significant': False,
                'message': '样本量不足'
            }
        
        # 计算转化率
        rate_a = conversions_a / total_a
        rate_b = conversions_b / total_b
        
        # 计算合并转化率
        pooled_rate = (conversions_a + conversions_b) / (total_a + total_b)
        
        # 计算标准误差
        se = np.sqrt(pooled_rate * (1 - pooled_rate) * (1/total_a + 1/total_b))
        
        # 计算Z分数
        if se == 0:
            z_score = 0
        else:
            z_score = (rate_a - rate_b) / se
        
        # 计算P值（双尾检验）
        p_value = 2 * (1 - stats.norm.cdf(abs(z_score)))
        
        # 判断是否显著
        is_significant = p_value < alpha
        
        return {
            'z_score': z_score,
            'p_value': p_value,
            'is_significant': is_significant,
            'alpha': alpha,
            'conversion_rate_a': rate_a,
            'conversion_rate_b': rate_b
        }
    
    def get_winner(self, alpha=0.05):
        """
        获取胜出的变体
        
        Args:
            alpha: 显著性水平
            
        Returns:
            str: 胜出变体名称，如果没有显著差异则返回None
        """
        if len(self.variants) < 2:
            return None
        
        variant_names = list(self.variants.keys())
        best_variant = variant_names[0]
        best_conversion_rate = self.variants[best_variant].conversion_count / max(1, self.variants[best_variant].total_count)
        
        # 找到转化率最高的变体
        for name in variant_names[1:]:
            conversion_rate = self.variants[name].conversion_count / max(1, self.variants[name].total_count)
            if conversion_rate > best_conversion_rate:
                best_variant = name
                best_conversion_rate = conversion_rate
        
        # 检查是否显著优于其他变体
        for name in variant_names:
            if name != best_variant:
                significance_result = self.get_statistical_significance(best_variant, name, alpha)
                if not significance_result['is_significant']:
                    return None  # 没有显著差异
        
        return best_variant
    
    def get_test_summary(self):
        """
        获取测试摘要
        
        Returns:
            dict: 测试摘要
        """
        summary = {
            'test_name': self.test_name,
            'is_running': self.is_running,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'total_users': len(self.user_assignments),
            'variants': self.get_variant_stats()
        }
        
        # 获取胜出者
        winner = self.get_winner()
        if winner:
            summary['winner'] = winner
            summary['conclusion'] = f"变体 {winner} 显著优于其他变体"
        else:
            summary['winner'] = None
            summary['conclusion'] = "没有显著差异"
        
        return summary

class ABTestManager:
    """A/B测试管理器"""
    
    def __init__(self):
        """初始化A/B测试管理器"""
        self.tests = {}
    
    def create_test(self, test_name):
        """
        创建A/B测试
        
        Args:
            test_name: 测试名称
            
        Returns:
            ABTester: A/B测试实例
        """
        if test_name in self.tests:
            raise ValueError(f"测试 {test_name} 已存在")
        
        test = ABTester(test_name)
        self.tests[test_name] = test
        logger.info(f"创建A/B测试: {test_name}")
        return test
    
    def get_test(self, test_name):
        """
        获取A/B测试
        
        Args:
            test_name: 测试名称
            
        Returns:
            ABTester: A/B测试实例
        """
        return self.tests.get(test_name)
    
    def list_tests(self):
        """
        列出所有测试
        
        Returns:
            list: 测试名称列表
        """
        return list(self.tests.keys())
    
    def get_all_summaries(self):
        """
        获取所有测试摘要
        
        Returns:
            dict: 所有测试摘要
        """
        summaries = {}
        for name, test in self.tests.items():
            summaries[name] = test.get_test_summary()
        return summaries

# 创建全局实例
ab_test_manager = ABTestManager()

# 示例算法函数（用于演示）
def algorithm_v1(data):
    """算法版本1"""
    # 简单的调度算法
    return {"driver_id": 1, "estimated_time": 5}

def algorithm_v2(data):
    """算法版本2"""
    # 改进的调度算法
    return {"driver_id": 2, "estimated_time": 4}

# 创建示例测试
def create_sample_test():
    """创建示例A/B测试"""
    test = ab_test_manager.create_test("调度算法对比测试")
    test.add_variant("算法版本1", algorithm_v1, weight=1.0)
    test.add_variant("算法版本2", algorithm_v2, weight=1.0)
    return test