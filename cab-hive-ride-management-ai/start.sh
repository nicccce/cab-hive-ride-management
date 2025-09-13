#!/bin/bash

# Cab Hive AI Module 启动脚本

# 检查是否安装了Python
if ! command -v python3 &> /dev/null
then
    echo "未找到Python3，请先安装Python3"
    exit 1
fi

# 检查是否安装了pip
if ! command -v pip3 &> /dev/null
then
    echo "未找到pip3，请先安装pip3"
    exit 1
fi

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "安装依赖..."
pip install -r requirements.txt

# 创建日志目录（如果不存在）
mkdir -p logs

# 启动应用
echo "启动Cab Hive AI模块..."
python main.py