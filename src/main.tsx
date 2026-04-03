import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import './styles/theme.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#135d66',
          colorBgLayout: '#f4efe6',
          borderRadius: 14
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
