import { useState, useEffect } from 'react'
import { View, Text, Button, Map } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { takeOrder } from '../../services/order'
import './index.scss'

const DriverOrderPanel = ({ vehicles: initialVehicles = [], onVehicleSelect, onStartWork, onStopWork, isWorking, selectedVehicle, fetchVehicles, availableOrder, userLocation }) => {
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [vehicles, setVehicles] = useState(initialVehicles)

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

  // 地图标记点
  const [markers, setMarkers] = useState([]);
  // 路径规划线
  const [polyline, setPolyline] = useState([]);

  // 当初始车辆列表变化时更新状态
  useEffect(() => {
    setVehicles(initialVehicles)
  }, [initialVehicles])

  useEffect(
    () => {
      if (!availableOrder && userLocation) {
        setMapConfig({
          ...mapConfig,
          longitude: userLocation.longitude,
          latitude: userLocation.latitude,
        })
      }
    }, [userLocation]
  )

  useEffect(
    () => {
      console.log(availableOrder)
      if (!availableOrder||!isWorking) {
        setPolyline([])
        setMarkers([])
      } else {
        // 设置路线
        if (availableOrder.route_points && availableOrder.route_points.length > 0) {
          // 过滤有效的坐标点
          const validPoints = availableOrder.route_points.filter(point =>
            point &&
            typeof point.latitude === 'number' &&
            typeof point.longitude === 'number' &&
            !Number.isNaN(point.latitude) &&
            !Number.isNaN(point.longitude)
          );

          if (validPoints.length > 0) {
            const routePolyline = {
              points: validPoints,
              color: "#FF0000",
              width: 6,
              dottedLine: false,
              arrowLine: true,
            };
            setPolyline([routePolyline]);

            // 调整地图视野以适应路线
            // 计算路线边界
            const latitudes = validPoints.map(p => p.latitude);
            const longitudes = validPoints.map(p => p.longitude);
            const minLat = Math.min(...latitudes);
            const maxLat = Math.max(...latitudes);
            const minLng = Math.min(...longitudes);
            const maxLng = Math.max(...longitudes);

            // 设置地图中心点和缩放级别
            setMapConfig(prev => ({
              ...prev,
              longitude: (minLng + maxLng) / 2,
              latitude: (minLat + maxLat) / 2,
              scale: 14
            }));
          }
        }
        const startMarker = {
          id: 0,
          latitude: availableOrder.start_location.latitude,
          longitude: availableOrder.start_location.longitude,
          title: "出发点",
          width: 30,
          height: 30,
          callout: {
            content: "出发点",
            color: "#000",
            fontSize: 14,
            borderRadius: 4,
            padding: 8,
            display: "ALWAYS",
          },
        };

        // 设置终点标记
        const endMarker = {
          id: 1,
          latitude: availableOrder.end_location.latitude,
          longitude: availableOrder.end_location.longitude,
          title: "终点",
          width: 30,
          height: 30,
          callout: {
            content: "终点",
            color: "#000",
            fontSize: 14,
            borderRadius: 4,
            padding: 8,
            display: "ALWAYS",
          },
        };
        setMarkers([startMarker, endMarker])
      }
    }, [availableOrder, isWorking]
  )

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
    if (!availableOrder || !selectedVehicle) return;

    try {
      const response = await takeOrder({
        order_id: availableOrder.id,
        vehicle_id: selectedVehicle.id
      });

      if (response.code === 200) {
        Taro.showToast({
          title: '接单成功',
          icon: 'success'
        });
      } else {
        Taro.showToast({
          title: '接单失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('接单失败:', error);
      Taro.showToast({
        title: '接单失败,请稍后重试',
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
    if (!availableOrder) return null;

    return (
      <View className="order-info-section">
        <View className="order-info-header">
          <Text className="order-info-title">新订单</Text>
        </View>

        <View className="order-details">
          {/* 起点和终点在同一行 */}
          <View className="order-route-row">
            <Text className="order-detail-value">{availableOrder.start_location.name === '当前位置' ? '用户当前位置' : availableOrder.start_location.name}</Text>
            <Text className="arrow-icon">→</Text>
            <Text className="order-detail-value">{availableOrder.end_location?.name || '未知地点'}</Text>
          </View>

          {/* 距离和费用在同一行 */}
          <View className="order-distance-fare-row">
            <Text className="order-detail-label">距离:</Text>
            <Text className="order-detail-value">{availableOrder.distance ? (availableOrder.distance / 1000).toFixed(1) + '公里' : '未知'}</Text>
            <Text className="order-detail-label">预估费用:</Text>
            <Text className="order-detail-value">{availableOrder.fare ? availableOrder.fare + '元' : '未知'}</Text>
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
        markers={markers}
        polyline={polyline}
        onUpdated={() => console.log("地图更新完成")}
      />


      {renderBottomSection()}
      {renderVehicleSelectionModal()}
    </View>
  )
}

export default DriverOrderPanel