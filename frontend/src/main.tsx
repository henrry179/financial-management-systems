import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import './index.css';

import App from './App';

// 移除初始加载屏幕
const removeInitialLoading = () => {
  const loadingElement = document.querySelector('.initial-loading');
  if (loadingElement) {
    loadingElement.remove();
    console.log('✅ Initial loading screen removed');
  }
};

// 简化的主题配置
const theme = {
  token: {
    colorPrimary: '#1890ff',
  },
};

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={zhCN} theme={theme}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// React应用挂载后移除初始加载屏幕
setTimeout(removeInitialLoading, 100); 
 