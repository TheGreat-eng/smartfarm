import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/Login/Login';
import FarmListPage from './pages/FarmList/FarmList';
import FarmDetailPage from './pages/FarmDetail/FarmDetail';
import RegisterPage from './pages/Register/Register';
import MainLayout from './components/MainLayout';

// PrivateRoutes component chỉ xác thực, không chứa layout
const PrivateRoutes = () => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

function MyApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Các route không cần layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Các route protected - kết hợp layout và xác thực */}
        <Route element={<PrivateRoutes />}>
          <Route element={<MainLayout />}>
            <Route path="/farms" element={<FarmListPage />} />
            <Route path="/farms/:farmId" element={<FarmDetailPage />} />
            <Route path="/" element={<Navigate to="/farms" />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default MyApp;