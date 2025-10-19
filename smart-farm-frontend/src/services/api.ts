import axios from 'axios';

// Lấy token từ localStorage nếu có
const token = localStorage.getItem('authToken');

const apiClient = axios.create({
    // **QUAN TRỌNG**: Thay thế bằng URL backend do Thành viên 1 cung cấp
    baseURL: 'http://localhost:8080/api/',
    headers: {
        'Content-Type': 'application/json',
        // Nếu có token, tự động thêm vào header cho mọi request
        'Authorization': token ? `Bearer ${token}` : '',
    },
});

// Interceptor để xử lý lỗi một cách tập trung (ví dụ: token hết hạn)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Xử lý khi token không hợp lệ hoặc hết hạn
            localStorage.removeItem('authToken');
            window.location.href = '/login'; // Chuyển về trang login
        }
        return Promise.reject(error);
    }
);

export default apiClient;