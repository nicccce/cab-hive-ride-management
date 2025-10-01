#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
流处理API接口
"""

from flask import Blueprint, request, jsonify
from streaming.stream_processor import stream_processor, real_time_analyzer
import logging

# 创建蓝图
bp = Blueprint('streaming_api', __name__, url_prefix='/api/streaming')

# 配置日志
logger = logging.getLogger(__name__)

@bp.route('/start_streaming', methods=['POST'])
def start_streaming():
    """
    启动流处理接口
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
        
        topics = data.get('topics', [])
        if not topics:
            return jsonify({
                "code": 400,
                "message": "订阅主题不能为空"
            }), 400
        
        # 启动流处理器
        stream_processor.start_consumer(topics)
        
        return jsonify({
            "code": 200,
            "message": "流处理启动成功",
            "data": {
                "subscribed_topics": topics
            }
        })
        
    except Exception as e:
        logger.error(f"启动流处理失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"启动流处理失败: {str(e)}"
        }), 500

@bp.route('/stop_streaming', methods=['POST'])
def stop_streaming():
    """
    停止流处理接口
    """
    try:
        # 停止流处理器
        stream_processor.stop_consumer()
        
        return jsonify({
            "code": 200,
            "message": "流处理停止成功"
        })
        
    except Exception as e:
        logger.error(f"停止流处理失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"停止流处理失败: {str(e)}"
        }), 500

@bp.route('/get_recent_data', methods=['GET'])
def get_recent_data():
    """
    获取最近处理的数据接口
    """
    try:
        topic = request.args.get('topic')
        limit = int(request.args.get('limit', 100))
        
        # 获取最近数据
        recent_data = stream_processor.get_recent_data(topic, limit)
        
        return jsonify({
            "code": 200,
            "message": "获取最近数据成功",
            "data": recent_data
        })
        
    except Exception as e:
        logger.error(f"获取最近数据失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"获取最近数据失败: {str(e)}"
        }), 500

@bp.route('/get_statistics', methods=['GET'])
def get_statistics():
    """
    获取处理统计信息接口
    """
    try:
        # 获取统计信息
        stats = stream_processor.get_statistics()
        
        return jsonify({
            "code": 200,
            "message": "获取统计信息成功",
            "data": stats
        })
        
    except Exception as e:
        logger.error(f"获取统计信息失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"获取统计信息失败: {str(e)}"
        }), 500

@bp.route('/get_realtime_metrics', methods=['GET'])
def get_realtime_metrics():
    """
    获取实时指标接口
    """
    try:
        # 获取实时指标
        metrics = real_time_analyzer.get_realtime_metrics()
        
        return jsonify({
            "code": 200,
            "message": "获取实时指标成功",
            "data": metrics
        })
        
    except Exception as e:
        logger.error(f"获取实时指标失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"获取实时指标失败: {str(e)}"
        }), 500

@bp.route('/analyze_order_stream', methods=['POST'])
def analyze_order_stream():
    """
    分析订单流数据接口
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
        
        # 分析订单流数据
        result = real_time_analyzer.analyze_order_stream(data)
        
        return jsonify({
            "code": 200,
            "message": "订单流分析成功",
            "data": result
        })
        
    except Exception as e:
        logger.error(f"订单流分析失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"订单流分析失败: {str(e)}"
        }), 500

@bp.route('/analyze_driver_stream', methods=['POST'])
def analyze_driver_stream():
    """
    分析司机流数据接口
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
        
        # 分析司机流数据
        result = real_time_analyzer.analyze_driver_stream(data)
        
        return jsonify({
            "code": 200,
            "message": "司机流分析成功",
            "data": result
        })
        
    except Exception as e:
        logger.error(f"司机流分析失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"司机流分析失败: {str(e)}"
        }), 500