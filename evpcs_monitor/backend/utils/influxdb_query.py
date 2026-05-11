# influxdb_query.py
from influxdb_connection import get_influxdb_client

# 获取 InfluxDB 连接
client, _, query_api, _ = get_influxdb_client()


def query_station_data(station_id, bucket="charging_data", limit=100):
    """
    查询某个 station_id 的所有时序数据
    """
    query = f"""
        from(bucket: "{bucket}")
          |> range(start: 2022-09-01T00:00:00Z, stop: 2023-09-01T00:00:00Z)
          |> filter(fn: (r) => r["station_id"] == "{station_id}")
          |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> sort(columns: ["_time"])
          |> limit(n: {limit})
    """

    try:
        tables = query_api.query(query)

        # 提取数据点
        data_points = []
        for table in tables:
            for record in table.records:
                timestamp = record["_time"]
                # 安全访问字段，缺失字段设为 None
                volume = record.values.get("volume", None)
                occupancy = record.values.get("occupancy", None)
                duration = record.values.get("duration", None)
                e_price = record.values.get("e_price", None)
                s_price = record.values.get("s_price", None)
                data_points.append(
                    (timestamp, volume, occupancy, duration, e_price, s_price)
                )

        if not data_points:
            print("未找到数据，请检查 `station_id` 是否正确。")
            return

        print(f"找到 {len(data_points)} 条数据，开始显示...")
        for timestamp, volume, occupancy, duration, e_price, s_price in data_points:
            print(
                f"{timestamp} ➝ volume: {volume}, occupancy: {occupancy}, duration: {duration}, e_price: {e_price}, s_price: {s_price}"
            )

    except Exception as e:
        print(f"[错误] 查询数据失败: {e}")


if __name__ == "__main__":
    station_id = input("请输入要查询的 `station_id`: ").strip()
    query_station_data(station_id)
