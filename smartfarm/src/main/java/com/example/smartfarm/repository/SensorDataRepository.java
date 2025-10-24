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

@Repository
public class SensorDataRepository {
    @Autowired
    private InfluxDBClient influxDBClient;

    @Value("${influx.bucket}")
    private String bucket;

    @Value("${influx.org}")
    private String org;

    public void save(SensorData sensorData) {
        WriteApiBlocking writeApi = influxDBClient.getWriteApiBlocking();
        writeApi.writeMeasurement(bucket, org, WritePrecision.NS, sensorData);
    }

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