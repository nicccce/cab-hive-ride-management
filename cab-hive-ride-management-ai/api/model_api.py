#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
模型管理API接口
"""

from flask import Blueprint, request, jsonify
from model_manager.model_trainer import model_trainer, model_updater
import logging

# 创建蓝图
bp = Blueprint('model_api', __name__, url_prefix='/api/model')

# 配置日志
logger = logging.getLogger(__name__)

@bp.route('/train_rl_dispatcher', methods=['POST'])
def train_rl_dispatcher():
    """
    训练强化学习调度器模型接口
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
        
        training_data = data.get('training_data', [])
        model_name = data.get('model_name', 'rl_dispatcher')
        
        if not training_data:
            return jsonify({
                "code": 400,
                "message": "训练数据不能为空"
            }), 400
        
        # 训练模型
        result = model_trainer.train_rl_dispatcher(training_data, model_name)
        
        return jsonify({
            "code": 200,
            "message": "强化学习调度器模型训练成功",
            "data": result
        })
        
    except Exception as e:
        logger.error(f"训练强化学习调度器模型失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"训练强化学习调度器模型失败: {str(e)}"
        }), 500

@bp.route('/train_risk_detector', methods=['POST'])
def train_risk_detector():
    """
    训练高级风险检测器模型接口
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
        
        training_data = data.get('training_data', [])
        model_name = data.get('model_name', 'advanced_risk_detector')
        
        if not training_data:
            return jsonify({
                "code": 400,
                "message": "训练数据不能为空"
            }), 400
        
        # 训练模型
        result = model_trainer.train_risk_detector(training_data, model_name)
        
        return jsonify({
            "code": 200,
            "message": "高级风险检测器模型训练成功",
            "data": result
        })
        
    except Exception as e:
        logger.error(f"训练高级风险检测器模型失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"训练高级风险检测器模型失败: {str(e)}"
        }), 500

@bp.route('/load_model', methods=['POST'])
def load_model():
    """
    加载模型接口
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
        
        model_name = data.get('model_name')
        if not model_name:
            return jsonify({
                "code": 400,
                "message": "模型名称不能为空"
            }), 400
        
        # 加载模型
        model = model_trainer.load_model(model_name)
        
        return jsonify({
            "code": 200,
            "message": "模型加载成功",
            "data": {
                "model_name": model_name
            }
        })
        
    except Exception as e:
        logger.error(f"加载模型失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"加载模型失败: {str(e)}"
        }), 500

@bp.route('/get_training_history', methods=['GET'])
def get_training_history():
    """
    获取训练历史接口
    """
    try:
        # 获取训练历史
        history = model_trainer.get_training_history()
        
        return jsonify({
            "code": 200,
            "message": "获取训练历史成功",
            "data": history
        })
        
    except Exception as e:
        logger.error(f"获取训练历史失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"获取训练历史失败: {str(e)}"
        }), 500

@bp.route('/schedule_training', methods=['POST'])
def schedule_training():
    """
    安排定期训练任务接口
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
        
        model_name = data.get('model_name')
        interval_hours = data.get('interval_hours', 24)
        
        if not model_name:
            return jsonify({
                "code": 400,
                "message": "模型名称不能为空"
            }), 400
        
        # 安排训练任务（这里简化处理，实际应用中需要根据模型类型选择训练函数）
        if model_name == 'rl_dispatcher':
            model_trainer.schedule_training(
                model_name, 
                model_trainer.train_rl_dispatcher, 
                [],  # 训练数据将在训练时提供
                interval_hours
            )
        elif model_name == 'advanced_risk_detector':
            model_trainer.schedule_training(
                model_name, 
                model_trainer.train_risk_detector, 
                [],  # 训练数据将在训练时提供
                interval_hours
            )
        else:
            return jsonify({
                "code": 400,
                "message": f"不支持的模型类型: {model_name}"
            }), 400
        
        return jsonify({
            "code": 200,
            "message": "定期训练任务安排成功",
            "data": {
                "model_name": model_name,
                "interval_hours": interval_hours
            }
        })
        
    except Exception as e:
        logger.error(f"安排定期训练任务失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"安排定期训练任务失败: {str(e)}"
        }), 500

@bp.route('/check_and_update_model', methods=['POST'])
def check_and_update_model():
    """
    检查并更新模型接口
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
        
        model_name = data.get('model_name')
        current_data = data.get('current_data', [])
        performance_threshold = data.get('performance_threshold', 0.8)
        
        if not model_name:
            return jsonify({
                "code": 400,
                "message": "模型名称不能为空"
            }), 400
        
        # 检查并更新模型
        updated = model_updater.check_and_update_model(
            model_name, 
            current_data, 
            performance_threshold
        )
        
        return jsonify({
            "code": 200,
            "message": "模型检查完成",
            "data": {
                "model_name": model_name,
                "updated": updated
            }
        })
        
    except Exception as e:
        logger.error(f"检查并更新模型失败: {str(e)}")
        return jsonify({
            "code": 500,
            "message": f"检查并更新模型失败: {str(e)}"
        }), 500