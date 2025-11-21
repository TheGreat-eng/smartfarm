// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntdApp } from 'antd';
import MyApp from './App.tsx';
import 'antd/dist/reset.css';
import { FarmProvider } from './context/FarmContext.tsx'; // Import Provider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AntdApp>
      {/* Bọc FarmProvider ở ngoài cùng (trong hoặc ngoài AntdApp đều được) */}
      <FarmProvider>
        <MyApp />
      </FarmProvider>
    </AntdApp>
  </React.StrictMode>,
);