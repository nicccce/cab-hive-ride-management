import Taro from '@tarojs/taro'
import { LBS_CONFIG } from '../config/api'
import QQMapWX from '../libs/qqmap-wx-jssdk.js';

// 导航到位置选择插件
export const navigateToLocationPlugin = async (options = {}) => {
  const { key, referer, category } = LBS_CONFIG

  let url = `plugin://chooseLocation/index?key=${key}&referer=${referer}`

  if (options.location) {
    const locationStr = JSON.stringify(options.location)
    url += `&location=${locationStr}`
  }

  if (category) {
    url += `&category=${category}`
  }

  try {
    await Taro.navigateTo({ url })
  } catch (error) {
    console.error('打开位置选择插件失败：', error)
    Taro.showToast({
      title: '打开地图失败',
      icon: 'none'
    })
  }
}

// 获取选点结果
export const getLocationResult = () => {
  const chooseLocation = requirePlugin('chooseLocation')
  return chooseLocation.getLocation()
}

// 清除选点数据
export const clearLocationData = () => {
  const chooseLocation = requirePlugin('chooseLocation')
  chooseLocation.setLocation(null)
}

// 创建地图标记
export const createMapMarker = (location, title = '位置', iconPath = null) => {
  return {
    id: Date.now(),
    latitude: location.latitude,
    longitude: location.longitude,
    title: title,
    iconPath: iconPath || '/assets/images/location-marker.png',
    width: 30,
    height: 30,
    callout: {
      content: title,
      color: '#000',
      fontSize: 14,
      borderRadius: 4,
      padding: 8,
      display: 'ALWAYS'
    }
  }
}

const qqmapsdk = new QQMapWX({
  key: LBS_CONFIG.key
});

// 驾车策略常量
export const DRIVING_POLICY = {
  // 主要策略（三选一）
  LEAST_TIME: 'LEAST_TIME',       // 时间最短（默认）
  PICKUP: 'PICKUP',               // 网约车接乘客
  TRIP: 'TRIP',                   // 网约车送乘客
  
  // 单项偏好参数（可组合使用）
  REAL_TRAFFIC: 'REAL_TRAFFIC',   // 参考实时路况
  LEAST_FEE: 'LEAST_FEE',         // 少收费
  AVOID_HIGHWAY: 'AVOID_HIGHWAY', // 不走高速
  NAV_POINT_FIRST: 'NAV_POINT_FIRST' // 使用出入口
};

/**
 * 驾车路线规划服务
 * @param {Object} options 路线规划参数
 * @param {Object|string} options.from 起点坐标
 * @param {Object|string} options.to 终点坐标
 * @param {string} options.policy 路线策略，默认'LEAST_TIME'
 * @param {string} options.plate_number 车牌号（用于避让限行）
 * @param {string} options.waypoints 途经点
 * @returns {Promise<Array>} 路线列表
 */
export const planDrivingRoute = (options) => {
  return new Promise((resolve, reject) => {
    const {
      from,
      to,
      policy = 'LEAST_TIME',
      plate_number = '',
      waypoints = '',
    } = options;

    // 参数验证
    if (!to) {
      reject(new Error('终点地址不能为空'));
      return;
    }

    // 格式化坐标
    const fromFormatted = formatCoordinate(from);
    const toFormatted = formatCoordinate(to);

    console.log('发起驾车路线规划请求:', {
      from: fromFormatted,
      to: toFormatted,
      policy,
      plate_number,
      waypoints
    });

    // 构建请求参数
    const requestParams = {
      mode: 'driving',
      from: fromFormatted,
      to: toFormatted,
      policy
    };

    // 可选参数
    if (plate_number) requestParams.plate_number = plate_number;
    if (waypoints) requestParams.waypoints = waypoints;

    qqmapsdk.direction({...requestParams, 
      success: (res) => {
        try {
          console.log('驾车路线规划API响应:', res);
          
          if (res.status !== 0) {
            reject(new Error(res.message || '路线规划失败'));
            return;
          }

          const routes = processDrivingRoutes(res);
          resolve(routes);
        } catch (error) {
          reject(error);
        }
      },
      fail: (error) => {
        console.error('驾车路线规划API失败:', error);
        reject(new Error(error.errMsg || '网络请求失败'));
      },
      complete: (res) => {
        console.log('驾车路线规划完成:', res);
      }
  });
  });
};

/**
 * 处理驾车路线数据
 */
const processDrivingRoutes = (res) => {
  if (!res.result || !res.result.routes || res.result.routes.length === 0) {
    throw new Error('未找到可用路线');
  }

  return res.result.routes.map((route, index) => {
    // 解压坐标
    const points = decompressPolyline(route.polyline);
    
    return {
      id: index,
      points,
      distance: route.distance || 0,         // 总距离（米）
      duration: route.duration || 0,         // 总时间（秒）
      tolls: route.taxi_fare?.fare || 0,      // 收费金额（元）
      tags: route.tags || [],                // 路线标签
      isRecommended: index === 0,            // 是否推荐路线
      restriction: route.restriction,         // 限行信息
      steps: route.steps || [],              // 路线步骤详情
      rawData: route                         // 原始数据
    };
  });
};

/**
 * 坐标解压函数
 */
const decompressPolyline = (compressedCoors) => {
  if (!compressedCoors || compressedCoors.length === 0) {
    return [];
  }

  const points = [];
  const kr = 1000000;
  
  // 第一个点
  let lastLat = compressedCoors[0];
  let lastLng = compressedCoors[1];
  points.push({ latitude: lastLat, longitude: lastLng });

  // 解压后续点
  for (let i = 2; i < compressedCoors.length; i += 2) {
    const latDiff = compressedCoors[i] / kr;
    const lngDiff = compressedCoors[i + 1] / kr;
    
    lastLat += latDiff;
    lastLng += lngDiff;
    
    points.push({ latitude: lastLat, longitude: lastLng });
  }

  return points;
};

/**
 * 估算红绿灯数量（基于路线距离和城市平均密度）
 */
const calculateTrafficLights = (route) => {
  const distance = route.distance || 0;
  // 简单估算：每公里约2-3个红绿灯
  return Math.round(distance / 1000 * 2.5);
};

/**
 * 格式化坐标参数
 */
const formatCoordinate = (coord) => {
  if (!coord) return '';
  
  if (typeof coord === 'string') {
    return coord;
  }
  
  if (typeof coord === 'object' && coord.latitude && coord.longitude) {
    return `${coord.latitude},${coord.longitude}`;
  }
  
  throw new Error('无效的坐标格式');
};

/**
 * 获取最佳路线（根据评分函数）
 */
export const getBestDrivingRoute = async (options, scoringFunction = defaultScoringFunction) => {
  const routes = await planDrivingRoute(options);
  
  const scoredRoutes = routes.map(route => ({
    ...route,
    score: scoringFunction(route)
  }));
  
  return scoredRoutes.reduce((best, current) =>
    current.score > best.score ? current : best
  , scoredRoutes[0]);
};

/**
 * 默认评分函数
 */
const defaultScoringFunction = (route) => {
  let score = 100;
  
  // 距离权重（越短越好）
  score -= route.distance / 1000 * 0.3;
  
  // 时间权重（越短越好）
  score -= route.duration / 60 * 0.4;
  
  // 收费惩罚
  score -= route.tolls * 6;
  
  // 红绿灯惩罚
  score -= route.trafficLights * 0.1;
  
  // 推荐路线加分
  if (route.isRecommended) {
    score += 15;
  }
  
  // 标签加分
  if (route.tags.includes('RECOMMEND')) score += 10;
  if (route.tags.includes('LEAST_LIGHT')) score += 8;
  
  return Math.max(0, score);
};

/**
 * 工具函数：格式化距离
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters}米`;
  }
  return `${(meters / 1000).toFixed(1)}公里`;
};

/**
 * 工具函数：格式化时间
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
};