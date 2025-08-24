import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setUser } from '../../store/modules/auth';
import { AdminUser } from '../../types';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);

  useEffect(() => {
    // 检查本地存储的用户信息
    const savedUser = localStorage.getItem('admin_user');
    const token = localStorage.getItem('admin_token');
    
    if (savedUser && token) {
      try {
        const user: AdminUser = JSON.parse(savedUser);
        dispatch(setUser(user));
      } catch (error) {
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
      }
    }
  }, [dispatch]);

  const token = localStorage.getItem('admin_token');
  
  if (!token && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;