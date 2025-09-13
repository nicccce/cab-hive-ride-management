# Cab Hive 智能算法模块

这个模块负责处理派单、风险检测等智能算法功能。

## 目录结构

- `dispatcher/` - 派单算法实现
- `risk_detector/` - 风险检测算法实现
- `api/` - REST API接口
- `utils/` - 工具函数
- `tests/` - 测试代码

## 功能说明

### 派单算法 (Dispatcher)
- 实现智能派单逻辑
- 考虑距离、时间、司机评分等因素

### 风险检测 (Risk Detector)
- 实时检测订单风险
- 识别异常行为模式

## 环境要求

- Python 3.7+
- pip

## 安装和运行

### 方法1：使用Docker (推荐)

```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 方法2：本地运行

#### Linux/MacOS:
```bash
# 给脚本添加执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

#### Windows:
```bash
# 运行启动脚本
start.bat
```

### 方法3：手动运行

```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
# Linux/MacOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate.bat

# 安装依赖
pip install -r requirements.txt

# 启动应用
python main.py
```

## API接口

### 派单接口

- `POST /api/dispatcher/smart_dispatch` - 智能派单
- `POST /api/dispatcher/reassign_driver` - 重新分配司机

### 风险检测接口

- `POST /api/risk/analyze_order_risk` - 分析订单风险
- `POST /api/risk/detect_anomaly` - 检测异常行为

## 配置

配置文件位于 `config.json`，可以修改以下参数：

- 服务器地址和端口
- 数据库连接信息
- 派单算法参数
- 风险检测阈值

## 测试

运行测试：

```bash
# 运行所有测试
python -m unittest discover tests

# 运行特定测试
python tests/test_dispatcher.py
python tests/test_risk_detector.py
```

## 日志

日志文件位于 `logs/` 目录下。