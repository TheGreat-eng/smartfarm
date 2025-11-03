import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/Login';
import FarmListPage from './pages/FarmList/FarmList';
import FarmDetailPage from './pages/FarmDetail/FarmDetail'; // 1. Import trang mới
import type { JSX } from 'react';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Route cho danh sách nông trại */}
        <Route
          path="/farms"
          element={
            <PrivateRoute>
              <FarmListPage />
            </PrivateRoute>
          }
        />

        {/* 2. Thêm Route cho trang chi tiết nông trại */}
        <Route
          path="/farms/:farmId" // :farmId là một tham số động
          element={
            <PrivateRoute>
              <FarmDetailPage />
            </PrivateRoute>
          }
        />

        {/* Route mặc định: nếu vào trang chủ, chuyển hướng đến /farms */}
        <Route path="/" element={<Navigate to="/farms" />} />

        {/* Bất kỳ đường dẫn nào không khớp sẽ về trang login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;