// File: smartfarm/src/main/java/com/example/smartfarm/repository/SensorDataRepository.java

package com.example.smartfarm.repository;

import com.example.smartfarm.model.SensorData;
import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.WriteApiBlocking;
import com.influxdb.client.domain.WritePrecision;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class SensorDataRepository {
    @Autowired
    private InfluxDBClient influxDBClient;

    @Value("${influx.bucket}")
    private String bucket;

    @Value("${influx.org}")
    private String org;

    public void save(SensorData sensorData) {
        try {
            // ⚠️ THÊM: Validate dữ liệu trước khi save
            if (sensorData.getSensorId() == null || sensorData.getSensorId().isEmpty()) {
                System.err.println("❌ Error: sensorId is null or empty");
                return;
            }
            if (sensorData.getFarmId() == null || sensorData.getFarmId().isEmpty()) {
                System.err.println("❌ Error: farmId is null or empty");
                return;
            }
            if (sensorData.getMetricType() == null || sensorData.getMetricType().isEmpty()) {
                System.err.println("❌ Error: metricType is null or empty");
                return;
            }

            WriteApiBlocking writeApi = influxDBClient.getWriteApiBlocking();
            writeApi.writeMeasurement(bucket, org, WritePrecision.NS, sensorData);
            System.out.println("✅ Saved to InfluxDB: " + sensorData);
        } catch (Exception e) {
            System.err.println("❌ Error saving to InfluxDB: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public List<SensorData> findLatestDataForFarm(String farmIdStr) {
        System.out.println("🔍 Querying InfluxDB for farmId: " + farmIdStr); // THÊM LOG
        String fluxQuery = String.format(
                "from(bucket: \"%s\")\n" +
                        "  |> range(start: -1d)\n" +
                        "  |> filter(fn: (r) => r._measurement == \"sensor_data\")\n" +
                        "  |> filter(fn: (r) => r.farmId == \"%s\")\n" +
                        "  |> group(columns: [\"metricType\"])\n" +
                        "  |> last()",
                bucket, farmIdStr);

        System.out.println("📊 Query: " + fluxQuery); // THÊM LOG
        List<FluxTable> tables = influxDBClient.getQueryApi().query(fluxQuery, org);
        System.out.println("📦 Result tables: " + tables.size()); // THÊM LOG

        // Phần xử lý kết quả giữ nguyên như trước
        return tables.stream()
                .flatMap(table -> table.getRecords().stream())
                .map(record -> {
                    SensorData data = new SensorData();

                    Object farmIdValue = record.getValueByKey("farmId");
                    if (farmIdValue != null) {
                        data.setFarmId(farmIdValue.toString());
                    }

                    Object sensorIdValue = record.getValueByKey("sensorId");
                    if (sensorIdValue != null) {
                        data.setSensorId(sensorIdValue.toString());
                    }

                    Object metricTypeValue = record.getValueByKey("metricType");
                    if (metricTypeValue != null) {
                        data.setMetricType(metricTypeValue.toString());
                    }

                    Object value = record.getValue();
                    if (value instanceof Double) {
                        data.setValue((Double) value);
                    } else if (value instanceof Long) {
                        data.setValue(((Long) value).doubleValue());
                    }

                    data.setTime(record.getTime());
                    return data;
                })
                .collect(Collectors.toList());
    }

    //

    public Optional<SensorData> findLatestBySensorIdAndMetric(String sensorId, String metricType) {
        String fluxQuery = String.format(
                "from(bucket: \"%s\")\n" +
                        "  |> range(start: -1d)\n" +
                        "  |> filter(fn: (r) => r._measurement == \"sensor_data\")\n" +
                        "  |> filter(fn: (r) => r.sensorId == \"%s\")\n" +
                        "  |> filter(fn: (r) => r.metricType == \"%s\")\n" +
                        "  |> last()",
                bucket, sensorId, metricType);

        List<FluxTable> tables = influxDBClient.getQueryApi().query(fluxQuery, org);
        if (tables.isEmpty() || tables.get(0).getRecords().isEmpty()) {
            return Optional.empty();
        }

        FluxRecord record = tables.get(0).getRecords().get(0);
        SensorData data = new SensorData();
        data.setSensorId(record.getValueByKey("sensorId").toString());
        data.setMetricType(record.getValueByKey("metricType").toString());
        data.setValue((Double) record.getValue());
        data.setTime(record.getTime());
        return Optional.of(data);
    }
}