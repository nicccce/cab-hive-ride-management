import { configureStore } from '@reduxjs/toolkit';
import authReducer from './modules/auth';
import driverReducer from './modules/driver';
import userReducer from './modules/user';
import vehicleReducer from './modules/vehicle';
import dashboardReducer from './modules/dashboard';
import orderReducer from './modules/order';
import feedbackReducer from './modules/feedback';
import alertReducer from './modules/alert';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    driver: driverReducer,
    user: userReducer,
    vehicle: vehicleReducer,
    dashboard: dashboardReducer,
    order: orderReducer,
    feedback: feedbackReducer,
    alert: alertReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;