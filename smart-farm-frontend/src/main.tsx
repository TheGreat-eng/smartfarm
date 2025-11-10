// smart-farm-frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntdApp } from 'antd'; // 1. Import App từ antd và đổi tên thành AntdApp
import MyApp from './App.tsx'; // Đổi tên App của bạn thành MyApp để tránh trùng lặp

// 2. Import CSS của Ant Design (nếu chưa có)
// Rất quan trọng để các component hiển thị đúng
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 3. Bọc ứng dụng của bạn trong AntdApp */}
    <AntdApp>
      <MyApp />
    </AntdApp>
  </React.StrictMode>,
);