import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/Login';
import FarmListPage from './pages/FarmList/FarmList';
import type { JSX } from 'react';

// Component PrivateRoute để bảo vệ các trang cần đăng nhập
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/farms"
          element={
            <PrivateRoute>
              <FarmListPage />
            </PrivateRoute>
          }
        />
        {/* Route mặc định: nếu vào trang chủ, chuyển hướng đến /farms */}
        <Route
          path="/"
          element={<Navigate to="/farms" />}
        />
        {/* Bất kỳ đường dẫn nào không khớp sẽ về trang login */}
        <Route
          path="*"
          element={<Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;