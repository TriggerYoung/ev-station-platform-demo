# db_utils.py
from utils.db_connetion import connect_to_db


# 获取充电站的经纬度坐标信息、充电桩容量
def get_station_locations():
    connection = connect_to_db()
    if not connection:
        return None

    try:
        with connection.cursor() as cursor:
            query = """
            SELECT station_id, latitude, longitude, pile_count, address, adcode
            FROM charging_stations 
            WHERE status = 1
            """
            cursor.execute(query)
            results = cursor.fetchall()
            return results
    except Exception as e:
        print(f"获取充电站位置信息失败: {e}")
        return None
    finally:
        connection.close()



# 获取行政区信息
def get_districts():
    connection = connect_to_db()
    if not connection:
        return None

    try:
        with connection.cursor() as cursor:
            query = """
            SELECT
              a.adcode,
              a.district_name,
              a.longitude,
              a.latitude,
              COUNT(b.station_id) AS station_count,
              SUM(b.pile_count)   AS pile_count
            FROM districts a
            LEFT JOIN charging_stations b
              ON a.adcode = b.adcode
            GROUP BY
              a.adcode,
              a.district_name,
              a.longitude,
              a.latitude;
            """
            cursor.execute(query)
            return cursor.fetchall()
    except Exception as e:
        print(f"获取行政区信息失败: {e}")
        return None
    finally:
        connection.close()

