// File: smart-farm-frontend/src/components/AdminRoute.tsx (Tạo thư mục components nếu chưa có)
import { Navigate } from 'react-router-dom';
import type { JSX } from 'react';

const AdminRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole'); // Chúng ta sẽ lưu role lúc login

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (role !== 'ROLE_ADMIN') {
        // Nếu đăng nhập rồi mà không phải admin thì đá về trang farm
        return <Navigate to="/farms" />;
    }

    return children;
};

export default AdminRoute;