// smart-farm-frontend/src/pages/FarmDetail/SensorChart.tsx

import React from 'react';
import {
    ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line
} from 'recharts';
import { Spin } from 'antd';

interface ChartDataPoint {
    time: string;
    value: number | null;
}

interface SensorChartProps {
    data: ChartDataPoint[];
    metricName: string;
    lineColor: string;
    unit: string;
    loading: boolean;
}

const SensorChart: React.FC<SensorChartProps> = ({ data, metricName, lineColor, unit, loading }) => {

    // Hàm định dạng lại label cho trục X (thời gian)
    const formatXAxis = (tickItem: string) => {
        return new Date(tickItem).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>;
    }

    if (!data || data.length === 0) {
        return <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Không có dữ liệu</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={formatXAxis} />
                <YAxis unit={unit} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)} ${unit}`, metricName]}
                    labelFormatter={(label: string) => new Date(label).toLocaleString('vi-VN')}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="value"
                    name={metricName}
                    stroke={lineColor}
                    strokeWidth={2}
                    dot={false}
                    connectNulls // Nối các điểm null để đường không bị đứt gãy
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default SensorChart;