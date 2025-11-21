// smart-farm-frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/Login/Login';
import FarmListPage from './pages/FarmList/FarmList';
import FarmDashboard from './pages/FarmDashboard/FarmDashboard'; // Đổi tên từ FarmDetail
import RegisterPage from './pages/Register/Register';
import MainLayout from './components/MainLayout';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/Admin/AdminDashboard';
import LandingPage from './pages/LandingPage/LandingPage';
import WeatherPage from './pages/Weather/WeatherPage'; // Nhớ import


const PrivateRoutes = () => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

function MyApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Route Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Route User */}
        <Route element={<PrivateRoutes />}>
          <Route element={<MainLayout />}>
            <Route path="/farms" element={<FarmListPage />} />


            {/* Route Dashboard (chung cho nông trại đang được chọn) */}
            {/* LƯU Ý: Không còn :farmId nữa */}
            <Route path="/dashboard" element={<FarmDashboard />} />


            <Route path="/weather" element={<WeatherPage />} />


            {/* KHI CHỌN NÔNG TRẠI -> VÀO DASHBOARD */}
            <Route path="/farms/:farmId/dashboard" element={<FarmDashboard />} />

            {/* Redirect cũ để tránh lỗi */}
            <Route path="/farms/:farmId" element={<Navigate to="/farms/:farmId/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default MyApp;