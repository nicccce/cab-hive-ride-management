import React, { useRef } from 'react';
import { TMap, MultiMarker, MultiPolyline } from 'tlbs-map-react';

interface OrderLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

interface OrderRoutePoint {
  latitude: number;
  longitude: number;
}

interface OrderMapProps {
  startLocation: OrderLocation;
  endLocation: OrderLocation;
  routePoints: OrderRoutePoint[];
  height?: string | number;
}

// 计算两个坐标点之间的中心点
const calculateCenter = (start: OrderLocation, end: OrderLocation) => {
  return {
    lat: (start.latitude + end.latitude) / 2,
    lng: (start.longitude + end.longitude) / 2
  };
};

// 计算适合的缩放级别
const calculateZoom = (start: OrderLocation, end: OrderLocation) => {
  // 简化的缩放级别计算
  // 实际项目中可以根据两点间的距离更精确地计算
  const latDiff = Math.abs(start.latitude - end.latitude);
  const lngDiff = Math.abs(start.longitude - end.longitude);
  
  // 取较大的差值来决定缩放级别
  const maxDiff = Math.max(latDiff, lngDiff);
  
  // 根据差值确定缩放级别
  if (maxDiff > 1) return 10;
  if (maxDiff > 0.5) return 11;
  if (maxDiff > 0.2) return 12;
  if (maxDiff > 0.1) return 13;
  if (maxDiff > 0.05) return 14;
  if (maxDiff > 0.02) return 15;
  return 16;
};

const OrderMap: React.FC<OrderMapProps> = ({
  startLocation,
  endLocation,
  routePoints,
  height = '400px'
}) => {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  // 计算中心点和缩放级别
  const center = calculateCenter(startLocation, endLocation);
  const zoom = calculateZoom(startLocation, endLocation);

  // 样式定义
  const markerStyles = {
    startMarker: {
      width: 25,
      height: 35,
      anchor: { x: 12, y: 35 },
      src: 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/start.png'
    },
    endMarker: {
      width: 25,
      height: 35,
      anchor: { x: 12, y: 35 },
      src: 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/end.png'
    }
  };

  const polylineStyles = {
    route: {
      color: '#2C68FF',
      width: 5,
      borderWidth: 0,
    }
  };

  // 数据定义
  const markerGeometries = [
    {
      styleId: 'startMarker',
      position: { lat: startLocation.latitude, lng: startLocation.longitude },
      properties: { title: '起点' }
    },
    {
      styleId: 'endMarker',
      position: { lat: endLocation.latitude, lng: endLocation.longitude },
      properties: { title: '终点' }
    }
  ];

  // 将路径点转换为地图需要的格式
  const polylineGeometries = routePoints && routePoints.length > 0 ? [
    {
      styleId: 'route',
      paths: routePoints.map(point => ({ lat: point.latitude, lng: point.longitude }))
    }
  ] : [
    // 如果没有路径点，则直接连接起点和终点
    {
      styleId: 'route',
      paths: [
        { lat: startLocation.latitude, lng: startLocation.longitude },
        { lat: endLocation.latitude, lng: endLocation.longitude }
      ]
    }
  ];

  // 地图初始化完成事件处理器
  const onMapInited = () => {
    console.log('地图加载完成');
    // 设置地图中心点和缩放级别
    if (mapRef.current) {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(zoom);
    }
  };

  return (
    <div style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      <TMap
        ref={mapRef}
        apiKey="OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77"
        options={{
          center: center,
          zoom: zoom,
        }}
        onMapInited={onMapInited}
      >
        <MultiMarker
          ref={markerRef}
          styles={markerStyles}
          geometries={markerGeometries}
        />
        <MultiPolyline
          ref={polylineRef}
          styles={polylineStyles}
          geometries={polylineGeometries}
        />
      </TMap>
    </div>
  );
};

export default OrderMap;