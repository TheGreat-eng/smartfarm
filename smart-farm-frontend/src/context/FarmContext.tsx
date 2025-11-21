// src/context/FarmContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Định nghĩa kiểu dữ liệu Farm
interface Farm {
    id: number;
    name: string;
    location: string;
}

interface FarmContextType {
    selectedFarm: Farm | null;
    selectFarm: (farm: Farm) => void;
    clearFarm: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider = ({ children }: { children: ReactNode }) => {
    const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

    // Khi web tải lại, kiểm tra xem trong localStorage có lưu nông trại nào không
    useEffect(() => {
        const storedFarm = localStorage.getItem('selectedFarm');
        if (storedFarm) {
            setSelectedFarm(JSON.parse(storedFarm));
        }
    }, []);

    // Hàm chọn nông trại
    const selectFarm = (farm: Farm) => {
        setSelectedFarm(farm);
        localStorage.setItem('selectedFarm', JSON.stringify(farm));
    };

    // Hàm bỏ chọn (ví dụ khi đăng xuất hoặc muốn chọn lại)
    const clearFarm = () => {
        setSelectedFarm(null);
        localStorage.removeItem('selectedFarm');
    };

    return (
        <FarmContext.Provider value={{ selectedFarm, selectFarm, clearFarm }}>
            {children}
        </FarmContext.Provider>
    );
};

// Hook để các trang con gọi ra dùng
export const useFarmContext = () => {
    const context = useContext(FarmContext);
    if (!context) {
        throw new Error('useFarmContext must be used within a FarmProvider');
    }
    return context;
};