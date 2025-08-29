import { useState, useEffect, useRef } from 'react'
import { View, Text, Button, Map } from '@tarojs/components'
import Taro, { useDidShow, useDidHide } from '@tarojs/taro'
import { requestOrder, takeOrder } from '../../services/order'
import './index.scss'

const DriverOrderPanel = ({ userInfo, vehicles: initialVehicles = [], onVehicleSelect, onStartWork, onStopWork, isWorking, selectedVehicle, fetchVehicles }) => {
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [currentOrder, setCurrentOrder] = useState(null)

    // 定时器引用
    const loopRef = useRef(null);
  
    // 开始定时
    const startLoop = () => {
      // 先清除已存在的定时器
      if (loopRef.current) {
        clearInterval(loopRef.current);
      }
  
      // 设置新的定时器，每2秒执行一次
      loopRef.current = setInterval(async () => {
        // 如果司机处于工作状态，请求订单
        if (isWorking && selectedVehicle) {
          try {
            const response = await requestOrder();
            if (response.code === 200 && response.data) {
              setCurrentOrder(response.data);
            } else {
              // 如果没有订单，清空当前订单
              setCurrentOrder(null);
            }
          } catch (error) {
            console.error('请求订单失败:', error);
            // 请求失败时也清空当前订单
            setCurrentOrder(null);
          }
        }
      }, 2000);
    };
  
    // 停止定时
    const stopLoop = () => {
      if (loopRef.current) {
        clearInterval(loopRef.current);
        loopRef.current = null;
      }
    };
  
    // 页面显示时获取选点结果并恢复定时
    useDidShow(() => {
      // 恢复定时
      startLoop();
    });
  
    // 页面隐藏时清理插件数据并停止位置跟踪
    useDidHide(() => {
      // 停止位置跟踪
      stopLoop();
    });

  // 地图初始配置
  const [mapConfig, setMapConfig] = useState({
    longitude: 120.1551,  // 杭州经度
    latitude: 30.2742,    // 杭州纬度
    scale: 16,
    showLocation: true,
    enableScroll: true,
    enableRotate: false,
    enableZoom: true,
    enable3D: false,
    showCompass: false,
    showScale: true
  })
  
  // 当初始车辆列表变化时更新状态
  useEffect(() => {
    setVehicles(initialVehicles)
  }, [initialVehicles])
  
  // 处理开始工作
  const handleStartWork = () => {
    setShowVehicleModal(true)
    if (fetchVehicles) fetchVehicles()
    if (onStartWork) onStartWork()
  }
  
  // 选择车辆
  const handleSelectVehicle = (vehicle) => {
    if (vehicle.status === 'approved') {
      setShowVehicleModal(false)
      if (onVehicleSelect) onVehicleSelect(vehicle)
      
      Taro.showToast({
        title: '开始接单',
        icon: 'success'
      })
    } else {
      Taro.showToast({
        title: '请选择已审核通过的车辆',
        icon: 'none'
      })
    }
  }
  
  // 停止工作
  const handleStopWork = () => {
    if (onStopWork) onStopWork()
    
    Taro.showToast({
      title: '已停止接单',
      icon: 'success'
    })
  }

  // 处理接单
  const handleTakeOrder = async () => {
    if (!currentOrder || !selectedVehicle) return;
    
    try {
      const response = await takeOrder({
        order_id: currentOrder.id,
        vehicle_id: selectedVehicle.id
      });
      
      if (response.code === 200) {
        Taro.showToast({
          title: '接单成功',
          icon: 'success'
        });
        // 接单成功后清空当前订单
        setCurrentOrder(null);
        // 可以在这里添加其他接单成功的处理逻辑
      } else {
        Taro.showToast({
          title: '接单失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('接单失败:', error);
      Taro.showToast({
        title: '接单失败',
        icon: 'none'
      });
    }
  }
  
  // 前往车辆管理页面
  const goToVehicleManagement = () => {
    Taro.navigateTo({
      url: '/pages/vehicle-info/index'
    })
  }
  
  // 渲染车辆选择模态框
  const renderVehicleSelectionModal = () => {
    if (!showVehicleModal) return null
    
    return (
      <View className="vehicle-selection-modal">
        <View className="vehicle-selection-content">
          <View className="vehicle-selection-header">
            <Text className="vehicle-selection-title">选择运营车辆</Text>
            <Text className="vehicle-selection-subtitle">请选择您要用于接单的车辆</Text>
          </View>
          
          <View className="vehicle-list">
            {vehicles.length > 0 ? (
              vehicles.map(vehicle => (
                <View
                  key={vehicle.id}
                  className={`vehicle-item ${selectedVehicle?.id === vehicle.id ? 'selected-vehicle' : ''}`}
                  onClick={() => handleSelectVehicle(vehicle)}
                >
                  <Text className="vehicle-plate">{vehicle.plate_number}</Text>
                  <Text className="vehicle-model">{vehicle.brand} {vehicle.model}</Text>
                  <Text className={`vehicle-status ${vehicle.status === 'approved' ? 'status-approved' : vehicle.status === 'rejected' ? 'status-rejected' : 'status-pending'}`}>
                    {vehicle.status === 'approved' ? '已审核' : vehicle.status === 'rejected' ? '审核拒绝' : '审核中'}
                  </Text>
                </View>
              ))
            ) : (
              <View className="no-vehicles">
                <Text className="no-vehicles-text">暂无车辆信息</Text>
                <Text
                  className="add-vehicle-link"
                  onClick={goToVehicleManagement}
                >
                  点击添加车辆
                </Text>
              </View>
            )}
          </View>
          
          <Button
            className="close-button"
            onClick={() => setShowVehicleModal(false)}
          >
            取消
          </Button>
        </View>
      </View>
    )
  }
  
  // 渲染订单信息
  const renderOrderInfo = () => {
    if (!currentOrder) return null;
    
    return (
      <View className="order-info-section">
        <View className="order-info-header">
          <Text className="order-info-title">新订单</Text>
        </View>
        
        <View className="order-details">
          <View className="order-detail-row">
            <Text className="order-detail-label">起点:</Text>
            <Text className="order-detail-value">{currentOrder.start_location?.name || '未知地点'}</Text>
          </View>
          <View className="order-detail-row">
            <Text className="order-detail-label">终点:</Text>
            <Text className="order-detail-value">{currentOrder.end_location?.name || '未知地点'}</Text>
          </View>
          <View className="order-detail-row">
            <Text className="order-detail-label">距离:</Text>
            <Text className="order-detail-value">{currentOrder.distance ? (currentOrder.distance / 1000).toFixed(1) + '公里' : '未知'}</Text>
          </View>
          <View className="order-detail-row">
            <Text className="order-detail-label">预估费用:</Text>
            <Text className="order-detail-value">{currentOrder.fare ? currentOrder.fare + '元' : '未知'}</Text>
          </View>
        </View>
        
        <Button
          className="take-order-button"
          onClick={handleTakeOrder}
        >
          接单
        </Button>
      </View>
    );
  };

  // 渲染底部工作状态
  const renderBottomSection = () => {
    if (isWorking && selectedVehicle) {
      return (
        <View className="working-section">
          <View className="working-header">
            <Text className="working-title">工作中</Text>
            <Text className="working-status">正在接单中...</Text>
          </View>
          
          <View className="working-vehicle">
            <View className="vehicle-info-row">
              <Text className="vehicle-info-label">当前车辆:</Text>
              <Text className="vehicle-info-value">{selectedVehicle.plate_number}</Text>
            </View>
            <View className="vehicle-info-row">
              <Text className="vehicle-info-label">车型:</Text>
              <Text className="vehicle-info-value">{selectedVehicle.brand} {selectedVehicle.model}</Text>
            </View>
          </View>
          
          {renderOrderInfo()}
          
          <Button
            className="stop-work-button"
            onClick={handleStopWork}
          >
            停止接单
          </Button>
        </View>
      )
    }
    
    return (
      <View className="bottom-section">
        <Button
          className="start-work-button"
          onClick={handleStartWork}
        >
          开始接单
        </Button>
      </View>
    )
  }
  
  return (
    <View className="driver-order-panel">
      
      {/* 微信地图组件 */}
      {isWorking && selectedVehicle && (
        <Map
          className="map-container"
          longitude={mapConfig.longitude}
          latitude={mapConfig.latitude}
          scale={mapConfig.scale}
          showLocation={mapConfig.showLocation}
          enableScroll={mapConfig.enableScroll}
          enableRotate={mapConfig.enableRotate}
          enableZoom={mapConfig.enableZoom}
          enable3D={mapConfig.enable3D}
          showCompass={mapConfig.showCompass}
          showScale={mapConfig.showScale}
          // 如果有订单，绘制路线
          {...(currentOrder && currentOrder.route_points && {
            polyline: [{
              points: currentOrder.route_points.map(point => ({
                longitude: point.longitude,
                latitude: point.latitude
              })),
              color: '#007AFF',
              width: 4,
              dottedLine: false
            }]
          })}
        />
      )}
      
      {renderBottomSection()}
      {renderVehicleSelectionModal()}
    </View>
  )
}

export default DriverOrderPanel