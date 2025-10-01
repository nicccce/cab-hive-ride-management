#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
A/B测试API接口
"""

from flask import Blueprint, request, jsonify
from ab_testing.ab_tester import ab_test_manager
import logging

# 创建蓝图
bp = Blueprint('ab_testing_api', __name__, url_prefix='/api/ab_testing')

# 配置日志
logger = logging.getLogger(__name__)

@bp.route('/create_test', methods=['POST'])
def create_test():
    """
    创建A/B测试接口
    """
    try:
        # 获取请求数据
        data = request.get_json()
        
        # 验证必要参数
        if not data:
            return jsonify({
                "code": 400,
                "message": "请求数据不能为空"
            }), 400
        
        test_name = data.get('test_name')
        if not test_name:
            return jsonify({
                "code": 400,
                "message": "测试名称不能为空"
            }), 400
        
        # 创建测试
        test = ab_test_manager.create_test(test_name)
        
        return jsonify({
            "code": 200,
            "message": "A/B测试创建成功",
            "data": {
                "test_name": test_name
            }
        })
        
    except Exception as e:
        logger.error(f"创建A/B测试失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"创建A/B测试失败: {str(e)}"
        }), 500

@bp.route('/add_variant', methods=['POST'])
def add_variant():
    """
    添加测试变体接口
    """
    try:
        # 获取请求数据
        data = request.get_json()
        
        # 验证必要参数
        if not data:
            return jsonify({
                "code": 400,
                "message": "请求数据不能为空"
            }), 400
        
        test_name = data.get('test_name')
        variant_name = data.get('variant_name')
        weight = data.get('weight', 1.0)
        
        if not test_name or not variant_name:
            return jsonify({
                "code": 400,
                "message": "测试名称和变体名称不能为空"
            }), 400
        
        # 获取测试
        test = ab_test_manager.get_test(test_name)
        if not test:
            return jsonify({
                "code": 404,
                "message": f"测试 {test_name} 不存在"
            }), 404
        
        # 添加变体（这里简化处理，实际应用中需要动态加载算法函数）
        def dummy_algorithm(data):
            return {"result": f"变体 {variant_name} 的结果"}
        
        test.add_variant(variant_name, dummy_algorithm, weight)
        
        return jsonify({
            "code": 200,
            "message": "测试变体添加成功",
            "data": {
                "test_name": test_name,
                "variant_name": variant_name
            }
        })
        
    except Exception as e:
        logger.error(f"添加测试变体失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"添加测试变体失败: {str(e)}"
        }), 500

@bp.route('/start_test', methods=['POST'])
def start_test():
    """
    启动A/B测试接口
    """
    try:
        # 获取请求数据
        data = request.get_json()
        
        # 验证必要参数
        if not data:
            return jsonify({
                "code": 400,
                "message": "请求数据不能为空"
            }), 400
        
        test_name = data.get('test_name')
        if not test_name:
            return jsonify({
                "code": 400,
                "message": "测试名称不能为空"
            }), 400
        
        # 获取测试
        test = ab_test_manager.get_test(test_name)
        if not test:
            return jsonify({
                "code": 404,
                "message": f"测试 {test_name} 不存在"
            }), 404
        
        # 启动测试
        test.start_test()
        
        return jsonify({
            "code": 200,
            "message": "A/B测试启动成功",
            "data": {
                "test_name": test_name
            }
        })
        
    except Exception as e:
        logger.error(f"启动A/B测试失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"启动A/B测试失败: {str(e)}"
        }), 500

@bp.route('/stop_test', methods=['POST'])
def stop_test():
    """
    停止A/B测试接口
    """
    try:
        # 获取请求数据
        data = request.get_json()
        
        # 验证必要参数
        if not data:
            return jsonify({
                "code": 400,
                "message": "请求数据不能为空"
            }), 400
        
        test_name = data.get('test_name')
        if not test_name:
            return jsonify({
                "code": 400,
                "message": "测试名称不能为空"
            }), 400
        
        # 获取测试
        test = ab_test_manager.get_test(test_name)
        if not test:
            return jsonify({
                "code": 404,
                "message": f"测试 {test_name} 不存在"
            }), 404
        
        # 停止测试
        test.stop_test()
        
        return jsonify({
            "code": 200,
            "message": "A/B测试停止成功",
            "data": {
                "test_name": test_name
            }
        })
        
    except Exception as e:
        logger.error(f"停止A/B测试失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"停止A/B测试失败: {str(e)}"
        }), 500

@bp.route('/run_algorithm', methods=['POST'])
def run_algorithm():
    """
    运行分配给用户的算法接口
    """
    try:
        # 获取请求数据
        data = request.get_json()
        
        # 验证必要参数
        if not data:
            return jsonify({
                "code": 400,
                "message": "请求数据不能为空"
            }), 400
        
        test_name = data.get('test_name')
        user_id = data.get('user_id')
        
        if not test_name or not user_id:
            return jsonify({
                "code": 400,
                "message": "测试名称和用户ID不能为空"
            }), 400
        
        # 获取测试
        test = ab_test_manager.get_test(test_name)
        if not test:
            return jsonify({
                "code": 404,
                "message": f"测试 {test_name} 不存在"
            }), 404
        
        # 运行算法
        variant_name, result = test.run_algorithm(user_id, data)
        
        return jsonify({
            "code": 200,
            "message": "算法运行成功",
            "data": {
                "test_name": test_name,
                "user_id": user_id,
                "variant_name": variant_name,
                "result": result
            }
        })
        
    except Exception as e:
        logger.error(f"运行算法失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"运行算法失败: {str(e)}"
        }), 500

@bp.route('/record_conversion', methods=['POST'])
def record_conversion():
    """
    记录用户转化接口
    """
    try:
        # 获取请求数据
        data = request.get_json()
        
        # 验证必要参数
        if not data:
            return jsonify({
                "code": 400,
                "message": "请求数据不能为空"
            }), 400
        
        test_name = data.get('test_name')
        user_id = data.get('user_id')
        is_conversion = data.get('is_conversion', True)
        
        if not test_name or not user_id:
            return jsonify({
                "code": 400,
                "message": "测试名称和用户ID不能为空"
            }), 400
        
        # 获取测试
        test = ab_test_manager.get_test(test_name)
        if not test:
            return jsonify({
                "code": 404,
                "message": f"测试 {test_name} 不存在"
            }), 404
        
        # 记录转化
        test.record_conversion(user_id, is_conversion)
        
        return jsonify({
            "code": 200,
            "message": "用户转化记录成功",
            "data": {
                "test_name": test_name,
                "user_id": user_id,
                "is_conversion": is_conversion
            }
        })
        
    except Exception as e:
        logger.error(f"记录用户转化失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"记录用户转化失败: {str(e)}"
        }), 500

@bp.route('/get_test_summary', methods=['GET'])
def get_test_summary():
    """
    获取测试摘要接口
    """
    try:
        test_name = request.args.get('test_name')
        
        if not test_name:
            return jsonify({
                "code": 400,
                "message": "测试名称不能为空"
            }), 400
        
        # 获取测试
        test = ab_test_manager.get_test(test_name)
        if not test:
            return jsonify({
                "code": 404,
                "message": f"测试 {test_name} 不存在"
            }), 404
        
        # 获取测试摘要
        summary = test.get_test_summary()
        
        return jsonify({
            "code": 200,
            "message": "获取测试摘要成功",
            "data": summary
        })
        
    except Exception as e:
        logger.error(f"获取测试摘要失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"获取测试摘要失败: {str(e)}"
        }), 500

@bp.route('/get_all_summaries', methods=['GET'])
def get_all_summaries():
    """
    获取所有测试摘要接口
    """
    try:
        # 获取所有测试摘要
        summaries = ab_test_manager.get_all_summaries()
        
        return jsonify({
            "code": 200,
            "message": "获取所有测试摘要成功",
            "data": summaries
        })
        
    except Exception as e:
        logger.error(f"获取所有测试摘要失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"获取所有测试摘要失败: {str(e)}"
        }), 500

@bp.route('/get_winner', methods=['GET'])
def get_winner():
    """
    获取胜出变体接口
    """
    try:
        test_name = request.args.get('test_name')
        alpha = float(request.args.get('alpha', 0.05))
        
        if not test_name:
            return jsonify({
                "code": 400,
                "message": "测试名称不能为空"
            }), 400
        
        # 获取测试
        test = ab_test_manager.get_test(test_name)
        if not test:
            return jsonify({
                "code": 404,
                "message": f"测试 {test_name} 不存在"
            }), 404
        
        # 获取胜出者
        winner = test.get_winner(alpha)
        
        return jsonify({
            "code": 200,
            "message": "获取胜出变体成功",
            "data": {
                "test_name": test_name,
                "winner": winner
            }
        })
        
    except Exception as e:
        logger.error(f"获取胜出变体失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"获取胜出变体失败: {str(e)}"
        }), 500