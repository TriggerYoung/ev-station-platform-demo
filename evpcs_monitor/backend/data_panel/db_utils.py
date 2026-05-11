# db_utils.py
from datetime import datetime, timedelta, timezone
from utils.db_connetion import connect_to_db
from utils.influxdb_connection import get_influxdb_client


# 获取充电站的经纬度坐标信息、充电桩容量
def get_stations():
    connection = connect_to_db()
    if not connection:
        return None

    try:
        with connection.cursor() as cursor:
            query = """
            SELECT 
                cs.station_id, cs.address, cs.pile_count, cs.latitude, cs.longitude, cs.has_parking_fee, cs.adcode,
                SUM(CASE WHEN cp.charging_type = '0' THEN 1 ELSE 0 END) AS ac_piles_count,
                SUM(CASE WHEN cp.charging_type = '1' THEN 1 ELSE 0 END) AS dc_piles_count  
            FROM 
                charging_stations cs
            LEFT JOIN 
                charging_piles cp ON cs.station_id = cp.station_id
			WHERE
                cs.status = 1
            GROUP BY 
                cs.station_id, cs.address;
            """
            cursor.execute(query)
            results = cursor.fetchall()
            return results
    except Exception as e:
        print(f"获取充电站位置信息失败: {e}")
        return None
    finally:
        connection.close()


# 获取所有行政区的信息
def get_districts():
    connection = connect_to_db()
    if not connection:
        return None

    try:
        with connection.cursor() as cursor:
            query = """
            SELECT 
                a.adcode, a.district_name, a.longitude, a.latitude, 
                count(b.station_id) as station_count, sum(b.pile_count) as pile_count
            FROM 
                districts a
            LEFT JOIN 
                charging_stations b ON a.adcode = b.adcode
            GROUP BY a.adcode, a.district_name, a.longitude, a.latitude;
            """
            cursor.execute(query)
            results = cursor.fetchall()
            return results
    except Exception as e:
        print(f"获取行政区信息失败: {e}")
        return None
    finally:
        connection.close()


# 查询实时字段信息
def get_realtime_field_data(start="2022-09-01T00:00:00Z", field="volume"):
    """根据前端传递的起始时间查询最新一小时的实时字段数据(按时间分组聚合)"""
    # 获取InfluxDB连接
    client, _, query_api, _ = get_influxdb_client()

    try:
        # 处理前端传递的时间，去除毫秒部分
        # 首先判断是否包含毫秒部分
        if '.' in start:
            start = start.split('.')[0]  # 去掉毫秒部分
            start += 'Z'  # 确保末尾是 'Z'，符合ISO格式

        # 确保 start 时间是 UTC 时区并转换为 datetime 对象
        start_time = datetime.strptime(start, "%Y-%m-%dT%H:%M:%SZ")
        print('start_time: ', start_time)

        # 强制设置为 UTC 时区并去掉毫秒
        start_time = start_time.replace(tzinfo=timezone.utc).replace(microsecond=0)
        print('start_time_UTC: ', start_time)
        
        start_timestamp = start_time.timestamp()  # 转换为 Unix 时间戳
    except Exception as e:
        print(f"时间转换错误: {e}")
        return []

    # 获取当前 UTC 时间
    current_time = datetime.now(timezone.utc)  # 使用 datetime.now(timezone.utc) 获取当前 UTC 时间
    current_timestamp = current_time.timestamp()  # 转换为 Unix 时间戳

    # 确保查询不会超过数据的时间范围（2022-09-01到2023-09-01）
    if current_timestamp < start_timestamp:
        print("当前时间早于数据的起始时间")
        return []

    # 计算查询区间的起始时间和结束时间（1小时）
    query_start_time = datetime.fromtimestamp(start_timestamp, tz=timezone.utc).replace(microsecond=0)
    query_end_time = query_start_time + timedelta(hours=1)

    # 格式化查询时间为 ISO 8601 字符串，确保时间格式是 "2022-09-01T00:00:00Z"
    query_start_time_str = query_start_time.strftime("%Y-%m-%dT%H:%M:%SZ")
    query_end_time_str = query_end_time.strftime("%Y-%m-%dT%H:%M:%SZ")

    # 构建flux查询语句：按小时聚合所有充电站的字段数据
    flux_query = f"""
    from(bucket: "charging_data")
      |> range(start: {query_start_time_str}, stop: {query_end_time_str})
      |> filter(fn: (r) => r._measurement == "charging_data")
      |> filter(fn: (r) => r._field == "{field}")
      |> group(columns: ["_time"])
      |> sum()
      |> yield(name: "sum")
    """

    result = []
    try:
        # 查询数据
        tables = query_api.query(flux_query)
        for table in tables:
            for record in table.records:
                # 格式化时间为年月日时，确保时间无毫秒
                formatted_time = record.get_time().strftime("%Y-%m-%d %H:00:00")
                result.append(
                    {"time": formatted_time, "value": record.get_value()}
                )
        print(f"查询实时数据字段{field}成功: {result}")
    except Exception as e:
        print(f"查询实时数据字段{field}时发生错误: {e}")

    return result


def get_price_data(start="2022-09-01T00:00:00Z", field="s_price"):
    """根据前端传递的起始时间查询最新一小时的实时价格数据(按时间分组求均值)"""
    # 获取InfluxDB连接
    client, _, query_api, _ = get_influxdb_client()

    try:
        # 处理前端传递的时间，去除毫秒部分
        # 首先判断是否包含毫秒部分
        if '.' in start:
            start = start.split('.')[0]  # 去掉毫秒部分
            start += 'Z'  # 确保末尾是 'Z'，符合ISO格式

        # 确保 start 时间是 UTC 时区并转换为 datetime 对象
        start_time = datetime.strptime(start, "%Y-%m-%dT%H:%M:%SZ")
        print('start_time: ', start_time)

        # 强制设置为 UTC 时区并去掉毫秒
        start_time = start_time.replace(tzinfo=timezone.utc).replace(microsecond=0)
        print('start_time_UTC: ', start_time)
        
        start_timestamp = start_time.timestamp()  # 转换为 Unix 时间戳
    except Exception as e:
        print(f"时间转换错误: {e}")
        return []

    # 获取当前 UTC 时间
    current_time = datetime.now(timezone.utc)  # 使用 datetime.now(timezone.utc) 获取当前 UTC 时间
    current_timestamp = current_time.timestamp()  # 转换为 Unix 时间戳

    # 确保查询不会超过数据的时间范围（2022-09-01到2023-09-01）
    if current_timestamp < start_timestamp:
        print("当前时间早于数据的起始时间")
        return []

    # 计算查询区间的起始时间和结束时间（1小时）
    query_start_time = datetime.fromtimestamp(start_timestamp, tz=timezone.utc).replace(microsecond=0)
    query_end_time = query_start_time + timedelta(hours=1)

    # 格式化查询时间为 ISO 8601 字符串，确保时间格式是 "2022-09-01T00:00:00Z"
    query_start_time_str = query_start_time.strftime("%Y-%m-%dT%H:%M:%SZ")
    query_end_time_str = query_end_time.strftime("%Y-%m-%dT%H:%M:%SZ")

    # 构建flux查询语句：按小时聚合所有充电站的字段数据
    flux_query = f"""
    from(bucket: "charging_data")
      |> range(start: {query_start_time_str}, stop: {query_end_time_str})
      |> filter(fn: (r) => r._measurement == "charging_data")
      |> filter(fn: (r) => r._field == "{field}")
      |> group(columns: ["_time"])
      |> mean()
      |> yield(name: "mean")
    """

    result = []
    try:
        # 查询数据
        tables = query_api.query(flux_query)
        for table in tables:
            for record in table.records:
                # 格式化时间为年月日时，确保时间无毫秒
                formatted_time = record.get_time().strftime("%Y-%m-%d %H:00:00")
                result.append(
                    {"time": formatted_time, "value": record.get_value()}
                )
        print(f"查询实时平均{field}字段成功: {result}")
    except Exception as e:
        print(f"查询实时平均{field}价格时发生错误: {e}")

    return result



def get_station_pile_count(station_id):
    """获取指定充电站的充电桩数量"""

    # 获取数据库连接
    connection = connect_to_db()

    try:
        # 防御性编程：确保查询结果没有错误或空值
        sql_query = (
            f"""SELECT pile_count FROM charging_stations WHERE station_id = %s"""
        )
        cursor = connection.cursor()
        cursor.execute(sql_query, (station_id,))
        result = cursor.fetchone()
        # print("result: ", result)
        # 如果查询不到该 station_id 或 pile_count 为零，返回 0
        if result and result["pile_count"] > 0:
            return result["pile_count"]
        else:
            return 0

    except Exception as e:
        print(f"获取 pile_count 失败: {e}")
        return 0

    finally:
        cursor.close()
        connection.close()


def get_occupancy_rate_ranking(start="2022-09-01T00:00:00Z"):
    """获取指定时间段内的充电站充电桩占用数，并返回占用率排名"""

    # 获取InfluxDB连接
    client, _, query_api, _ = get_influxdb_client()

    try:
        # 处理前端传递的时间，去除毫秒部分
        if "." in start:
            start = start.split(".")[0]  # 去掉毫秒部分
            start += "Z"  # 确保末尾是 'Z'，符合ISO格式

        # 将开始时间字符串转为 datetime 对象
        start_time = datetime.strptime(start, "%Y-%m-%dT%H:%M:%SZ")

        # 获取结束时间（开始时间后1小时）
        end_time = start_time + timedelta(hours=1)

        # 格式化查询时间为 ISO 8601 字符串
        query_start_time_str = start_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        query_end_time_str = end_time.strftime("%Y-%m-%dT%H:%M:%SZ")

        # 构建flux查询语句：获取指定时间段内每个充电站的充电桩占用数
        flux_query = f"""
        from(bucket: "charging_data")
            |> range(start: {query_start_time_str}, stop: {query_end_time_str})
            |> filter(fn: (r) => r._measurement == "charging_data")
            |> filter(fn: (r) => r._field == "occupancy")
            |> group(columns: ["station_id"])
        """
        # 执行查询
        tables = query_api.query(flux_query)

        # 解析查询结果
        occupancy_data = []
        for table in tables:
            for record in table.records:
                station_id = record.values.get("station_id")
                occupancy = record.get_value()
                timestamp = record.values.get("time")  # 获取时间戳
                # print("station_id", type(station_id), station_id)
                # 获取充电桩数量并计算占用率
                pile_count = get_station_pile_count(station_id)

                # 如果 pile_count 为零或未能查询到值，则跳过该站点
                if pile_count > 0:
                    occupancy_rate = occupancy / pile_count  # 计算占用率
                    occupancy_data.append(
                        {
                            "station_id": station_id,
                            "occupancy": occupancy,
                            "occupancy_rate": occupancy_rate,
                            "timestamp": timestamp,
                        }
                    )

        # 格式化返回结果，按时间分组
        result = {
            "time": query_start_time_str,  # 返回查询的时间段开始时间
            "occupancy": [],
        }

        # 将occupancy_data按occupancy_rate降序排序
        occupancy_data.sort(key=lambda x: x["occupancy_rate"], reverse=True)

        # 提取并添加前十个充电站的信息
        for entry in occupancy_data[:50]:
            result["occupancy"].append(
                {
                    "station_id": entry["station_id"],
                    "occupancy": entry["occupancy"],
                    "occupancy_rate": entry["occupancy_rate"],
                }
            )

        # 返回时间段及充电站占用数和占用率
        return result

    except Exception as e:
        print(f"查询失败: {e}")
        return {"time": start, "occupancy": []}







