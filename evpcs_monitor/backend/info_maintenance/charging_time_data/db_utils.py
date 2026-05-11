# charging_time_data/db_utils.py
from utils.influxdb_connection import get_influxdb_client

def query_ctdata(station_id=None, start="2022-09-01T00:00:00Z", stop="2023-09-01T00:00:00Z", fields=None, limit=10000):
    """
    查询 InfluxDB 中 "charging_data" 测量的时序数据，
    根据传入参数过滤：
      - station_id: 过滤指定充电站数据（可选）
      - start, stop: 查询时间范围（ISO 格式字符串，传入时不要额外加引号）
      - fields: 逗号分隔的字段列表，例如 "volume,occupancy,duration,e_price,s_price"
    通过 pivot 将 _field 转换为各字段，返回的数据列表中每个记录包含 time、station_id 及各字段。
    """
    client, _, query_api, _ = get_influxdb_client()

    # 注意：这里直接插入 start 和 stop 参数，不添加引号，让 Flux 解析为时间字面量
    flux_query = f'''
      from(bucket: "charging_data")
        |> range(start: {start}, stop: {stop})
        |> filter(fn: (r) => r._measurement == "charging_data")
    '''
    if station_id:
        flux_query += f'''
          |> filter(fn: (r) => r["station_id"] == "{station_id}")
        '''
    flux_query += '''
      |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
    '''
    if fields:
        # fields 传入的是逗号分隔字符串，将其转换为 Flux 数组格式
        field_list = [f.strip() for f in fields.split(",") if f.strip()]
        keep_cols = ["_time", "station_id"] + field_list
        keep_cols_str = "[" + ", ".join(f'"{col}"' for col in keep_cols) + "]"
        flux_query += f'''
          |> keep(columns: {keep_cols_str})
        '''
    else:
        flux_query += '''
          |> keep(columns: ["_time", "station_id", "volume", "occupancy", "duration", "e_price", "s_price"])
        '''
    flux_query += f'''
      |> sort(columns: ["_time"])
      |> limit(n: {limit})
    '''

    # print("查询语句：\n", flux_query)  # 用于调试

    tables = query_api.query(flux_query)
    result = []
    for table in tables:
        for record in table.records:
            timestamp = record["_time"].isoformat() if hasattr(record["_time"], "isoformat") else record["_time"]
            rec = {"time": timestamp, "station_id": record.values.get("station_id")}
            for key, value in record.values.items():
                if key not in ["_time", "station_id"]:
                    rec[key] = value
            result.append(rec)
    return result

