#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
派单算法API接口
"""

from flask import Blueprint, request, jsonify
from dispatcher import smart_dispatcher, rl_dispatcher, block_dispatcher
import logging

# 创建蓝图
bp = Blueprint('dispatcher_api', __name__, url_prefix='/api/dispatcher')

# 配置日志
logger = logging.getLogger(__name__)

@bp.route('/smart_dispatch', methods=['POST'])
def smart_dispatch():
    """
    智能派单接口
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
        
        # 调用派单算法
        result = smart_dispatcher.dispatch(data)
        
        return jsonify({
            "code": 200,
            "message": "派单成功",
            "data": result
        })
        
    except Exception as e:
        logger.error(f"派单失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"派单失败: {str(e)}"
        }), 500

@bp.route('/reassign_driver', methods=['POST'])
def reassign_driver():
    """
    重新分配司机接口
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
        
        # 调用重新分配算法
        result = smart_dispatcher.reassign(data)
        
        return jsonify({
            "code": 200,
            "message": "重新分配成功",
            "data": result
        })
        
    except Exception as e:
        logger.error(f"重新分配司机失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"重新分配司机失败: {str(e)}"
        }), 500

@bp.route('/rl_dispatch', methods=['POST'])
def rl_dispatch():
    """
    基于强化学习的智能派单接口
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
        
        # 调用强化学习派单算法
        result = rl_dispatcher.dispatch(data)
        
        return jsonify({
            "code": 200,
            "message": "派单成功",
            "data": result
        })
        
    except Exception as e:
        logger.error(f"强化学习派单失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"强化学习派单失败: {str(e)}"
        }), 500

@bp.route('/rl_reassign_driver', methods=['POST'])
def rl_reassign_driver():
    """
    基于强化学习的重新分配司机接口
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
        
        # 调用强化学习重新分配算法
        result = rl_dispatcher.reassign(data)
        
        return jsonify({
            "code": 200,
            "message": "重新分配成功",
            "data": result
        })
        
    except Exception as e:
        logger.error(f"强化学习重新分配司机失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"强化学习重新分配司机失败: {str(e)}"
        }), 500

@bp.route('/block_dispatch', methods=['POST'])
def block_dispatch():
    """
    基于地图分块的智能派单接口
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
        
        # 调用分块派单算法
        result = block_dispatcher.dispatch(data)
        
        return jsonify({
            "code": 200,
            "message": "派单成功",
            "data": result
        })
        
    except Exception as e:
        logger.error(f"分块派单失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"分块派单失败: {str(e)}"
        }), 500

@bp.route('/block_reassign_driver', methods=['POST'])
def block_reassign_driver():
    """
    基于地图分块的重新分配司机接口
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
        
        # 调用分块重新分配算法
        result = block_dispatcher.reassign(data)
        
        return jsonify({
            "code": 200,
            "message": "重新分配成功",
            "data": result
        })
        
    except Exception as e:
        logger.error(f"分块重新分配司机失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"分块重新分配司机失败: {str(e)}"
        }), 500