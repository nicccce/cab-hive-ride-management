import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { store } from './store';
import { router } from './router';
import 'antd/dist/reset.css';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
            wireframe: false,
          },
          components: {
            Layout: {
              bodyBg: '#f5f5f5',
              headerBg: '#fff',
              siderBg: '#fff',
            },
            Menu: {
              itemBg: 'transparent',
              subMenuItemBg: 'transparent',
            },
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
    </Provider>
  );
};

export default App;