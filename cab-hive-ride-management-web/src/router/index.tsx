import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import AdminLayout from '../components/Layout/AdminLayout';
import PrivateRoute from '../components/PrivateRoute';
import Dashboard from '../pages/Dashboard';
import UserManagement from '../pages/UserManagement';
import DriverManagement from '../pages/DriverManagement';
import DriverReviewPage from '../pages/DriverReview';
import VehicleReviewPage from '../pages/VehicleReview';
import VehicleManagement from '../pages/VehicleManagement';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AdminLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/user-management',
        element: <UserManagement />,
      },
      {
        path: '/driver-management',
        element: <DriverManagement />,
      },
      {
        path: '/driver-review',
        element: <DriverReviewPage />,
      },
      {
        path: '/vehicle-review',
        element: <VehicleReviewPage />,
      },
      {
        path: '/vehicle-management',
        element: <VehicleManagement />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);