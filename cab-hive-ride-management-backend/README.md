# HorizonCloudService

## 项目概述

这是一个基于Go语言和Taro框架的网约车管理系统，支持微信小程序和支付宝支付功能。

## 功能模块

1. 用户管理
2. 司机管理
3. 车辆管理
4. 订单管理
5. 支付管理
6. 图片上传
7. 管理员后台

## 支付功能

本系统支持支付宝支付功能，详细使用说明请参考 [支付宝支付模块使用说明](README_ALIPAY.md)。

## 快速开始

### 环境要求

- Go 1.24+
- PostgreSQL
- Redis
- Node.js (用于前端开发)

### 安装步骤

1. 克隆项目代码
2. 安装Go依赖：
   ```
   go mod tidy
   ```
3. 配置环境变量或config.yaml文件
4. 启动服务：
   ```
   go run main.go
   ```

## 项目结构

```
.
├── cmd                 # 应用入口
├── config              # 配置文件
├── internal            # 核心代码
│   ├── global          # 全局组件
│   ├── model           # 数据模型
│   └── module          # 功能模块
├── templates           # HTML模板
└── tools               # 工具函数
```

## 技术栈

- 后端：Go + Gin + GORM + PostgreSQL + Redis
- 前端：Taro + React
- 支付：支付宝SDK

## 贡献指南

欢迎提交Issue和Pull Request来改进项目。

## 许可证

MIT License