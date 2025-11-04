import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/Login';
import FarmListPage from './pages/FarmList/FarmList';
import FarmDetailPage from './pages/FarmDetail/FarmDetail';
import RegisterPage from './pages/Register/Register'; // 1. Import trang đăng ký
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
        <Route path="/register" element={<RegisterPage />} /> {/* 2. Thêm route */}

        <Route
          path="/farms"
          element={<PrivateRoute><FarmListPage /></PrivateRoute>}
        />
        <Route
          path="/farms/:farmId"
          element={<PrivateRoute><FarmDetailPage /></PrivateRoute>}
        />

        <Route path="/" element={<Navigate to="/farms" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;