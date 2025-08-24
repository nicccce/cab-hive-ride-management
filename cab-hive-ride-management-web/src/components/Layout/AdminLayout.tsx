import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, 
  CarOutlined, 
  UserOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { logout } from '../../store/modules/auth';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/user-management',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/driver-management',
      icon: <UserOutlined />,
      label: '司机管理',
    },
    {
      key: '/driver-review',
      icon: <UserOutlined />,
      label: '司机审核',
    },
    {
      key: '/vehicle-review',
      icon: <CarOutlined />,
      label: '车辆审核',
    },
    {
      key: '/vehicle-management',
      icon: <CarOutlined />,
      label: '车辆管理',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
        }}
      >
        <div className="logo" style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1890ff',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {collapsed ? '网约车' : '网约车管理系统'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 16 }}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <Space>
            <span>欢迎，管理员</span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar 
                style={{ 
                  backgroundColor: '#1890ff',
                  cursor: 'pointer'
                }} 
                icon={<UserOutlined />} 
              />
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: '24px',
          padding: '24px',
          background: '#fff',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;