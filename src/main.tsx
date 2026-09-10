import React from 'react';
import ReactDOM from 'react-dom/client';
import { SessionQueryProvider } from './store/SessionQueryProvider';
import 'antd/dist/reset.css';
import './styles/theme.css';
import App from './App';


// O tema Ant Design é configurado em um único lugar: AppProviders (dentro de App).
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionQueryProvider>
      <App />
    </SessionQueryProvider>
  </React.StrictMode>
);
