import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, CarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { loginAsync } from '../../store/modules/auth';
import { LoginRequest } from '../../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => state.auth);
  
  const [form] = Form.useForm();

  const onFinish = async (values: LoginRequest) => {
    try {
      await dispatch(loginAsync(values)).unwrap();
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: 400,
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '30px'
        }}>
          <CarOutlined style={{ 
            fontSize: '48px', 
            color: '#1890ff',
            marginBottom: '16px'
          }} />
          <h1 style={{ 
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#262626',
            margin: 0
          }}>
            网约车管理系统
          </h1>
          <p style={{ 
            color: '#8c8c8c',
            fontSize: '16px',
            marginTop: '8px'
          }}>
            管理员登录
          </p>
        </div>
        
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号!' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="手机号"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              style={{ 
                height: '48px',
                fontSize: '16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          color: '#8c8c8c',
          fontSize: '12px'
        }}>
          测试账号: 13800138000 / 密码: admin123456
        </div>
      </Card>
    </div>
  );
};

export default Login;