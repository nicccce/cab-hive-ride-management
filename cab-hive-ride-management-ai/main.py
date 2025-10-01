#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Cab Hive 智能算法模块主入口
"""

import os
from flask import Flask
from flask_cors import CORS

def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    
    # 配置CORS
    CORS(app)
    
    # 注册API蓝图
    from api import dispatcher_api, risk_api, streaming_api, model_api, ab_testing_api
    
    app.register_blueprint(dispatcher_api.bp, url_prefix='/api/dispatcher')
    app.register_blueprint(risk_api.bp, url_prefix='/api/risk')
    app.register_blueprint(streaming_api.bp, url_prefix='/api/streaming')
    app.register_blueprint(model_api.bp, url_prefix='/api/model')
    app.register_blueprint(ab_testing_api.bp, url_prefix='/api/ab_testing')
    
    @app.route('/')
    def index():
        return {
            "message": "Cab Hive 智能算法模块",
            "version": "1.0.0"
        }
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('DEBUG', 'False').lower() == 'true'
    )