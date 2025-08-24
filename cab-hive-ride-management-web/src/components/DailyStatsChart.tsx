import React from 'react';
import { Card, Row, Col, Statistic, Progress } from 'antd';
import { 
  BarChartOutlined, 
  EnvironmentOutlined, 
  TeamOutlined, 
  UserOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../hooks';

// 简单的迷你图表实现
const MiniChart = ({ data, color }: { data: number[]; color?: string }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  const barColor = color || '#1890ff';
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '2px' }}>
      {data.map((value, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            height: `${((value - minValue) / range) * 100 || 10}%`,
            background: barColor,
            borderRadius: '2px'
          }}
        />
      ))}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  trend?: 'up' | 'down';
  chartData?: number[];
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  borderColor,
  trend,
  chartData 
}) => {
  return (
    <Card
      style={{
        background: color,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        height: '100%'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ marginBottom: '8px' }}>
            {icon}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: borderColor }}>
              {value}
            </span>
            {trend && (
              <span style={{ 
                marginLeft: '8px', 
                color: trend === 'up' ? '#52c41a' : '#ff4d4f',
                fontSize: '12px'
              }}>
                {trend === 'up' ? <RiseOutlined /> : <FallOutlined />} 5%
              </span>
            )}
          </div>
        </div>
        {chartData && (
          <div style={{ width: '60px' }}>
            <MiniChart data={chartData} color={borderColor} />
          </div>
        )}
      </div>
    </Card>
  );
};

const DailyStatsChart: React.FC = () => {
  const { dailyStats } = useAppSelector(state => state.dashboard);
  
  // 生成模拟的历史数据用于图表展示
  const generateTrendData = (currentValue: number, length: number = 7) => {
    return Array.from({ length }, (_, i) => {
      const variation = Math.random() * 0.3 - 0.15; // -15% 到 +15% 的变化
      return Math.max(0, Math.round(currentValue * (1 + variation * (length - i) / length)));
    });
  };

  // 为每个指标生成历史数据
  const ordersTrend = dailyStats ? generateTrendData(dailyStats.dailyOrders) : [];
  const mileageTrend = dailyStats ? generateTrendData(dailyStats.dailyMileage) : [];
  const driversTrend = dailyStats ? generateTrendData(dailyStats.dailyActiveDrivers) : [];
  const usersTrend = dailyStats ? generateTrendData(dailyStats.dailyActiveUsers) : [];

  if (!dailyStats) {
    return null;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
          今日运营数据
        </h2>
        <p style={{ color: '#8c8c8c', marginTop: '8px', marginBottom: 0 }}>
          实时更新的关键业务指标
        </p>
      </div>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="订单总量"
            value={dailyStats.dailyOrders}
            icon={<BarChartOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
            color="#e6f7ff"
            borderColor="#1890ff"
            trend="up"
            chartData={ordersTrend}
          />
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="行驶里程(km)"
            value={dailyStats.dailyMileage}
            icon={<EnvironmentOutlined style={{ fontSize: '20px', color: '#52c41a' }} />}
            color="#f6ffed"
            borderColor="#52c41a"
            trend="up"
            chartData={mileageTrend}
          />
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="在线司机"
            value={dailyStats.dailyActiveDrivers}
            icon={<TeamOutlined style={{ fontSize: '20px', color: '#722ed1' }} />}
            color="#f9f0ff"
            borderColor="#722ed1"
            trend="down"
            chartData={driversTrend}
          />
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="活跃用户"
            value={dailyStats.dailyActiveUsers}
            icon={<UserOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />}
            color="#fff7e6"
            borderColor="#fa8c16"
            trend="up"
            chartData={usersTrend}
          />
        </Col>
      </Row>
      
      {/* 详细数据展示 */}
      <Card 
        style={{ marginTop: '24px', borderRadius: '8px' }}
        title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>数据详情</span>}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <div style={{ padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>订单趋势</h3>
              <MiniChart data={ordersTrend} color="#1890ff" />
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>今日目标</span>
                  <span>150 单</span>
                </div>
                <Progress percent={Math.round(dailyStats.dailyOrders / 150 * 100)} strokeColor="#1890ff" />
              </div>
            </div>
          </Col>
          
          <Col xs={24} md={12}>
            <div style={{ padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>用户活跃度</h3>
              <MiniChart data={usersTrend} color="#fa8c16" />
              <div style={{ marginTop: '16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="峰值活跃" value={Math.max(...usersTrend)} suffix="人" />
                  </Col>
                  <Col span={12}>
                    <Statistic title="平均活跃" value={Math.round(usersTrend.reduce((a, b) => a + b, 0) / usersTrend.length)} suffix="人" />
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default DailyStatsChart;