@echo off
:: Cab Hive AI Module 启动脚本 (Windows)

echo 检查Python环境...

:: 检查是否安装了Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 未找到Python，请先安装Python
    pause
    exit /b 1
)

:: 检查是否安装了pip
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 未找到pip，请先安装pip
    pause
    exit /b 1
)

echo 创建虚拟环境...
python -m venv venv

echo 激活虚拟环境...
call venv\Scripts\activate.bat

echo 安装依赖...
pip install -r requirements.txt

echo 创建日志目录...
if not exist "logs" mkdir logs

echo 启动Cab Hive AI模块...
python main.py

pause