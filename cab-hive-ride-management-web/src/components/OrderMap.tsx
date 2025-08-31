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

const OrderMap: React.FC<OrderMapProps> = ({ 
  startLocation, 
  endLocation, 
  routePoints,
  height = '400px'
}) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);

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
    // 可以在这里进行一些地图操作
  };

  return (
    <div style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      <TMap
        ref={mapRef}
        apiKey="OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77"
        options={{
          zoom: 14,
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