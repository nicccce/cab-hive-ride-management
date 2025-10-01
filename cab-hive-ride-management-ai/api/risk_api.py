#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
风险检测API接口
"""

from flask import Blueprint, request, jsonify
from risk_detector import risk_analyzer
from risk_detector import advanced_risk_detector
import logging

# 创建蓝图
bp = Blueprint('risk_api', __name__, url_prefix='/api/risk')

# 配置日志
logger = logging.getLogger(__name__)

@bp.route('/analyze_order_risk', methods=['POST'])
def analyze_order_risk():
    """
    分析订单风险接口
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
        
        # 调用风险分析算法
        risk_score, risk_factors = risk_analyzer.analyze_order_risk(data)
        
        return jsonify({
            "code": 200,
            "message": "风险分析成功",
            "data": {
                "risk_score": risk_score,
                "risk_factors": risk_factors
            }
        })
        
    except Exception as e:
        logger.error(f"订单风险分析失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"订单风险分析失败: {str(e)}"
        }), 500

@bp.route('/detect_anomaly', methods=['POST'])
def detect_anomaly():
    """
    检测异常行为接口
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
        
        # 调用异常检测算法
        is_anomaly, confidence, details = risk_analyzer.detect_anomaly(data)
        
        return jsonify({
            "code": 200,
            "message": "异常检测成功",
            "data": {
                "is_anomaly": is_anomaly,
                "confidence": confidence,
                "details": details
            }
        })
        
    except Exception as e:
        logger.error(f"异常检测失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"异常检测失败: {str(e)}"
        }), 500

@bp.route('/advanced_analyze_order_risk', methods=['POST'])
def advanced_analyze_order_risk():
    """
    使用高级算法分析订单风险接口
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
        
        # 调用高级风险分析算法
        risk_score, risk_factors = advanced_risk_detector.analyze_order_risk(data)
        
        return jsonify({
            "code": 200,
            "message": "高级风险分析成功",
            "data": {
                "risk_score": risk_score,
                "risk_factors": risk_factors
            }
        })
        
    except Exception as e:
        logger.error(f"高级订单风险分析失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"高级订单风险分析失败: {str(e)}"
        }), 500

@bp.route('/train_advanced_risk_detector', methods=['POST'])
def train_advanced_risk_detector():
    """
    训练高级风险检测器接口
    """
    try:
        # 获取请求数据
        training_data = request.get_json()
        
        # 验证必要参数
        if not training_data:
            return jsonify({
                "code": 400,
                "message": "训练数据不能为空"
            }), 400
        
        # 训练高级风险检测器
        advanced_risk_detector.train(training_data)
        
        return jsonify({
            "code": 200,
            "message": "高级风险检测器训练成功"
        })
        
    except Exception as e:
        logger.error(f"高级风险检测器训练失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"高级风险检测器训练失败: {str(e)}"
        }), 500

@bp.route('/advanced_detect_anomaly', methods=['POST'])
def advanced_detect_anomaly():
    """
    使用高级算法检测异常行为接口
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
        
        # 调用高级异常检测算法
        result = advanced_risk_detector.detect_anomaly_ensemble(data)
        
        return jsonify({
            "code": 200,
            "message": "高级异常检测成功",
            "data": result
        })
        
    except Exception as e:
        logger.error(f"高级异常检测失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"高级异常检测失败: {str(e)}"
        }), 500