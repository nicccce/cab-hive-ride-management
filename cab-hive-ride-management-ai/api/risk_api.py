#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
风险检测API接口
"""

from flask import Blueprint, request, jsonify
from risk_detector import risk_analyzer
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