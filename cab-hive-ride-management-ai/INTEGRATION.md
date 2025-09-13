# Cab Hive AI模块与Go后端集成指南

## 概述

本文档说明如何将Cab Hive AI模块与现有的Go后端服务进行集成。AI模块提供REST API接口，Go后端可以通过HTTP请求调用这些接口。

## 网络配置

确保Go后端服务能够访问AI模块的网络端口。默认情况下，AI模块运行在`localhost:5000`。

### Docker网络配置

如果使用Docker部署，需要确保两个服务在同一个网络中：

```yaml
# 在Go后端的docker-compose.yml中添加
services:
  go-backend:
    # ... 其他配置
    networks:
      - cab-hive-network

networks:
  cab-hive-network:
    external: true
```

## API调用示例

### 1. 智能派单

**Go后端调用示例：**

```go
// 派单请求结构体
type DispatchRequest struct {
    OrderID          int       `json:"order_id"`
    PickupLatitude   float64   `json:"pickup_latitude"`
    PickupLongitude  float64   `json:"pickup_longitude"`
    DropoffLatitude  float64   `json:"dropoff_latitude"`
    DropoffLongitude float64   `json:"dropoff_longitude"`
    ServiceType      string    `json:"service_type"`
    AvailableDrivers []Driver  `json:"available_drivers"`
}

type Driver struct {
    ID        int     `json:"id"`
    Latitude  float64 `json:"latitude"`
    Longitude float64 `json:"longitude"`
    Rating    float64 `json:"rating"`
}

// 调用AI模块派单接口
func SmartDispatch(orderData DispatchRequest) (*DispatchResponse, error) {
    aiModuleURL := "http://localhost:5000/api/dispatcher/smart_dispatch"
    
    jsonData, err := json.Marshal(orderData)
    if err != nil {
        return nil, err
    }
    
    resp, err := http.Post(aiModuleURL, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var dispatchResp DispatchResponse
    if err := json.NewDecoder(resp.Body).Decode(&dispatchResp); err != nil {
        return nil, err
    }
    
    return &dispatchResp, nil
}
```

### 2. 订单风险分析

**Go后端调用示例：**

```go
// 风险分析请求结构体
type RiskAnalysisRequest struct {
    OrderID          int                    `json:"order_id"`
    OrderTime        string                 `json:"order_time"`
    PickupLatitude   float64                `json:"pickup_latitude"`
    PickupLongitude  float64                `json:"pickup_longitude"`
    DropoffLatitude  float64                `json:"dropoff_latitude"`
    DropoffLongitude float64                `json:"dropoff_longitude"`
    Price            float64                `json:"price"`
    EstimatedMinPrice float64               `json:"estimated_min_price"`
    EstimatedMaxPrice float64               `json:"estimated_max_price"`
    UserHistory      map[string]interface{} `json:"user_history"`
}

// 调用AI模块风险分析接口
func AnalyzeOrderRisk(riskData RiskAnalysisRequest) (*RiskAnalysisResponse, error) {
    aiModuleURL := "http://localhost:5000/api/risk/analyze_order_risk"
    
    jsonData, err := json.Marshal(riskData)
    if err != nil {
        return nil, err
    }
    
    resp, err := http.Post(aiModuleURL, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var riskResp RiskAnalysisResponse
    if err := json.NewDecoder(resp.Body).Decode(&riskResp); err != nil {
        return nil, err
    }
    
    return &riskResp, nil
}
```

## 错误处理

在调用AI模块API时，应处理以下可能的错误情况：

1. 网络连接错误
2. 超时错误
3. HTTP状态码错误（非200）
4. 响应数据解析错误

```go
// 错误处理示例
func CallAIAPISafely() error {
    client := &http.Client{
        Timeout: 30 * time.Second,
    }
    
    resp, err := client.Post(aiModuleURL, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        // 处理网络错误
        return fmt.Errorf("网络错误: %v", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        // 处理HTTP错误状态码
        return fmt.Errorf("HTTP错误: %d", resp.StatusCode)
    }
    
    // 处理响应数据...
    return nil
}
```

## 性能优化建议

1. 使用连接池管理HTTP连接
2. 设置合适的超时时间
3. 对频繁调用的接口实现缓存机制
4. 监控API调用性能和错误率

## 安全考虑

1. 在生产环境中，应使用HTTPS加密通信
2. 实现API密钥验证机制
3. 限制API调用频率，防止滥用
4. 记录API调用日志，便于审计和问题排查