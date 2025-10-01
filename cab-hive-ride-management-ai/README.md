# Cab Hive 智能算法模块 🚀

极速车巢智能算法模块，集成了先进的机器学习、深度学习和实时流处理技术，为网约车平台提供智能化决策支持。

## 🎯 核心功能

### 1. 强化学习调度系统
- **基于Q-learning的智能派单算法** - [`RLDispatcher`](dispatcher/rl_dispatcher.py)
- **多维度特征工程**: 距离分数、评级分数、服务匹配分数、经验分数、交通状况分数、天气状况分数、时间段分数、供需关系分数
- **ε-贪婪策略**和状态离散化
- **模型持久化**和在线学习能力

### 2. 高级异常检测系统  
- **孤立森林 + 自动编码器集成检测** - [`AdvancedRiskDetector`](risk_detector/advanced_risk_detector.py)
- **多特征异常识别**: 地理位置、时间、价格、用户行为模式
- **实时风险评分**和置信度计算
- **兼容传统规则引擎**

### 3. 实时流式处理引擎
- **Kafka流式数据处理** - [`StreamProcessor`](streaming/stream_processor.py)
- **滑动窗口实时分析**: 订单速率、平均价格、司机利用率
- **实时指标监控**和告警机制

### 4. 模型训练与自动化更新
- **自动化训练流水线** - [`ModelTrainer`](model_manager/model_trainer.py)
- **定期训练任务调度**
- **性能监控和智能更新** - [`ModelUpdater`](model_manager/model_trainer.py)

### 5. A/B测试框架
- **多版本算法对比测试** - [`ABTester`](ab_testing/ab_tester.py)
- **统计显著性检验** (Z检验)
- **流量分配**和转化率跟踪

## 📁 目录结构

```
cab-hive-ride-management-ai/
├── dispatcher/           # 派单算法
│   ├── __init__.py
│   ├── smart_dispatcher.py  # 传统智能派单
│   └── rl_dispatcher.py     # 强化学习派单 (新增)
├── risk_detector/        # 风险检测
│   ├── __init__.py
│   ├── risk_analyzer.py     # 传统风险分析
│   └── advanced_risk_detector.py  # 高级异常检测 (新增)
├── streaming/            # 实时流处理 (新增)
│   └── stream_processor.py
├── model_manager/        # 模型管理 (新增)
│   └── model_trainer.py
├── ab_testing/          # A/B测试框架 (新增)
│   └── ab_tester.py
├── api/                 # REST API接口
│   ├── __init__.py
│   ├── dispatcher_api.py    # 派单API
│   ├── risk_api.py          # 风险检测API
│   ├── streaming_api.py    # 流处理API (新增)
│   ├── model_api.py        # 模型管理API (新增)
│   └── ab_testing_api.py   # A/B测试API (新增)
├── utils/               # 工具函数
│   └── helpers.py
├── tests/               # 测试代码
├── main.py             # 应用入口
├── requirements.txt    # 依赖包
└── README.md          # 说明文档
```

## 🚀 快速开始

### 环境要求

- **Python 3.8+**
- **pip** 或 **conda**
- **Redis** (可选，用于缓存)
- **Kafka** (可选，用于流处理)

### 安装依赖

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Linux/MacOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
```

### 启动服务

```bash
# 开发模式
python main.py

# 生产模式 (设置环境变量)
export HOST=0.0.0.0
export PORT=5000
export DEBUG=false
python main.py
```

### Docker部署

```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 📡 API接口文档

### 派单服务
- `POST /api/dispatcher/smart_dispatch` - 智能派单 (传统算法)
- `POST /api/dispatcher/rl_dispatch` - 强化学习派单 (新增)
- `POST /api/dispatcher/reassign_driver` - 重新分配司机

### 风险检测
- `POST /api/risk/analyze_order_risk` - 分析订单风险
- `POST /api/risk/advanced_analyze_order_risk` - 高级风险分析 (新增)
- `POST /api/risk/train_advanced_risk_detector` - 训练风险检测模型 (新增)

### 实时流处理
- `POST /api/streaming/start_streaming` - 启动流处理 (新增)
- `GET /api/streaming/get_realtime_metrics` - 获取实时指标 (新增)
- `POST /api/streaming/analyze_order_stream` - 分析订单流数据 (新增)

### 模型管理
- `POST /api/model/train_rl_dispatcher` - 训练强化学习调度器 (新增)
- `POST /api/model/schedule_training` - 安排定期训练 (新增)
- `GET /api/model/get_training_history` - 获取训练历史 (新增)

### A/B测试
- `POST /api/ab_testing/create_test` - 创建A/B测试 (新增)
- `POST /api/ab_testing/run_algorithm` - 运行测试算法 (新增)
- `GET /api/ab_testing/get_winner` - 获取胜出变体 (新增)

## ⚙️ 配置说明

配置文件 `config.json` 支持以下参数：

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 5000,
    "debug": false
  },
  "redis": {
    "host": "localhost",
    "port": 6379
  },
  "kafka": {
    "bootstrap_servers": "localhost:9092"
  },
  "models": {
    "rl_dispatcher": {
      "learning_rate": 0.1,
      "discount_factor": 0.9,
      "exploration_rate": 0.1
    },
    "risk_detector": {
      "contamination": 0.1,
      "threshold": 0.15
    }
  }
}
```

## 🧪 测试

运行测试套件：

```bash
# 运行所有测试
python -m unittest discover tests

# 运行特定测试
python tests/test_dispatcher.py
python tests/test_risk_detector.py
python tests/test_rl_dispatcher.py  # 新增测试
```

## 📊 监控和日志

- **日志文件**: `logs/` 目录下
- **实时指标**: 通过流处理API获取
- **性能监控**: 集成Prometheus指标 (可选)

## 🔧 技术栈

- **Web框架**: Flask
- **机器学习**: scikit-learn, TensorFlow
- **实时处理**: Kafka, Redis
- **数据分析**: pandas, numpy
- **测试框架**: unittest

## 🎯 性能指标

- **派单响应时间**: < 100ms
- **风险检测准确率**: > 95%
- **实时处理延迟**: < 1s
- **模型训练速度**: 1000样本/秒

## 📝 开发指南

1. **添加新算法**: 在相应模块创建新类，实现标准接口
2. **注册API**: 在api目录添加新的蓝图
3. **更新配置**: 修改config.json添加新参数
4. **编写测试**: 在tests目录添加测试用例
5. **文档更新**: 更新本README文件

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License