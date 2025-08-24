import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getDriverPendingReviewListAsync } from '../../store/modules/driver';
import { getVehiclePendingReviewListAsync } from '../../store/modules/vehicle';
import { getUserListAsync } from '../../store/modules/user';
import { getDriverListAsync } from '../../store/modules/driver';
import { getVehicleListAsync } from '../../store/modules/vehicle';
import { getDailyStatsAsync } from '../../store/modules/dashboard';
import DailyStatsChart from '../../components/DailyStatsChart';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { pagination: driverPagination } = useAppSelector(state => state.driver);
  const { pagination: vehiclePagination } = useAppSelector(state => state.vehicle);
  const { reviewPagination: driverReviewPagination } = useAppSelector(state => state.driver);
  const { reviewPagination: vehicleReviewPagination } = useAppSelector(state => state.vehicle);

  const [driverApprovedCount, setDriverApprovedCount] = useState(0);
  const [vehicleApprovedCount, setVehicleApprovedCount] = useState(0);

  useEffect(() => {
    // 获取统计数据
    fetchStatsData();
  }, []);

  const fetchStatsData = async () => {
    // 获取每日统计数据
    await dispatch(getDailyStatsAsync());
    
    // 获取用户总数
    await dispatch(getUserListAsync({ page: 1, page_size: 1 }));
    
    // 获取司机总数
    await dispatch(getDriverListAsync({ page: 1, page_size: 1 }));
    setDriverApprovedCount(driverPagination.total_count);
    
    // 获取车辆总数
    await dispatch(getVehicleListAsync({ page: 1, page_size: 1 }));
    setVehicleApprovedCount(vehiclePagination.total_count);
    
    // 获取待审核司机数量
    await dispatch(getDriverPendingReviewListAsync({ page: 1, page_size: 1 }));
    
    // 获取待审核车辆数量
    await dispatch(getVehiclePendingReviewListAsync({ page: 1, page_size: 1 }));
  };

  const statsData = [
    {
      title: '待审核司机',
      value: driverReviewPagination.total_count,
      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
      color: '#fff7e6',
      borderColor: '#faad14'
    },
    {
      title: '已通过司机',
      value: driverApprovedCount,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      color: '#f6ffed',
      borderColor: '#52c41a'
    },
    {
      title: '待审核车辆',
      value: vehicleReviewPagination.total_count,
      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
      color: '#fff7e6',
      borderColor: '#faad14'
    },
    {
      title: '已通过车辆',
      value: vehicleApprovedCount,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      color: '#f6ffed',
      borderColor: '#52c41a'
    },
  ];

  const quickActions = [
    {
      title: '用户管理',
      description: '管理系统中的所有用户信息',
      icon: <UserOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
      path: '/user-management',
      color: '#e6f7ff',
      borderColor: '#1890ff'
    },
    {
      title: '司机管理',
      description: '管理司机信息，包括封禁解封等操作',
      icon: <UserOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
      path: '/driver-management',
      color: '#f6ffed',
      borderColor: '#52c41a'
    },
    {
      title: '司机审核',
      description: '审核司机注册信息和驾照资料',
      icon: <CheckCircleOutlined style={{ fontSize: '32px', color: '#faad14' }} />,
      path: '/driver-review',
      color: '#fff7e6',
      borderColor: '#faad14'
    },
    {
      title: '车辆审核',
      description: '审核车辆信息和相关证件',
      icon: <CarOutlined style={{ fontSize: '32px', color: '#722ed1' }} />,
      path: '/vehicle-review',
      color: '#f9f0ff',
      borderColor: '#722ed1'
    },
    {
      title: '车辆管理',
      description: '管理所有已审核通过的车辆信息',
      icon: <CarOutlined style={{ fontSize: '32px', color: '#13c2c2' }} />,
      path: '/vehicle-management',
      color: '#e6fffb',
      borderColor: '#13c2c2'
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          工作台概览
        </h1>
        <p style={{ color: '#8c8c8c', marginTop: '8px', marginBottom: 0 }}>
          欢迎使用网约车管理系统，这里是您的工作台
        </p>
      </div>

      {/* 每日统计数据图表 */}
      <DailyStatsChart />

      {/* 系统统计数据卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px', marginTop: '32px' }}>
        {statsData.map((stat, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card
              style={{
                textAlign: 'center',
                background: stat.color,
                border: `1px solid ${stat.borderColor}`,
                borderRadius: '8px'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ marginBottom: '12px' }}>
                {stat.icon}
              </div>
              <Statistic
                title={stat.title}
                value={stat.value}
                valueStyle={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: stat.borderColor
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快捷操作 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
          快捷操作
        </h2>
        <p style={{ color: '#8c8c8c', marginTop: '8px', marginBottom: '16px' }}>
          选择您要进行的操作
        </p>
      </div>
      
      <Row gutter={[24, 24]}>
        {quickActions.map((action, index) => (
          <Col xs={24} sm={12} md={12} lg={6} key={index}>
            <Card
              hoverable
              style={{
                borderRadius: '12px',
                background: action.color,
                border: `2px solid ${action.borderColor}`,
                transition: 'all 0.3s ease',
                height: '100%'
              }}
              bodyStyle={{ 
                padding: '24px 20px',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ marginBottom: '12px' }}>
                  {action.icon}
                </div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: action.borderColor,
                  marginBottom: '8px'
                }}>
                  {action.title}
                </h3>
                <p style={{ 
                  color: '#666',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  marginBottom: '16px'
                }}>
                  {action.description}
                </p>
              </div>
              <Button
                type="primary"
                onClick={() => navigate(action.path)}
                style={{
                  background: action.borderColor,
                  borderColor: action.borderColor,
                  borderRadius: '8px',
                  height: '36px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
                icon={<ArrowRightOutlined />}
              >
                进入管理
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 系统信息 */}
      <Card 
        title="系统信息" 
        style={{ 
          marginTop: '32px',
          borderRadius: '8px'
        }}
      >
        <Row gutter={[24, 16]}>
          <Col span={12}>
            <Space direction="vertical">
              <div><strong>系统版本：</strong>v1.0.0</div>
              <div><strong>更新时间：</strong>2025-01-16</div>
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical">
              <div><strong>在线管理员：</strong>1</div>
              <div><strong>系统状态：</strong><span style={{ color: '#52c41a' }}>正常运行</span></div>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;