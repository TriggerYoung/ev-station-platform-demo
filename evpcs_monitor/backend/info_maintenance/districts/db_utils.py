from utils.db_connetion import connect_to_db
def get_districts_summary():
    """获取各行政区的充电站数目和充电桩总数"""
    connection = connect_to_db()
    if not connection:
        return None  # 连接失败

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    d.adcode, 
                    d.district_name, 
                    d.population,
                    d.area,
                    COUNT(cs.station_id) AS station_count, 
                    COALESCE(SUM(cs.pile_count), 0) AS total_piles
                FROM districts d
                LEFT JOIN charging_stations cs ON d.adcode = cs.adcode
                GROUP BY d.adcode, d.district_name, d.population, d.area
                ORDER BY d.adcode;
            """
            cursor.execute(sql)
            result = cursor.fetchall()

            print("数据库返回数据:", result)  # 检查数据

            if not result:
                return []  # 没有数据时，返回空列表

            return result
    except Exception as e:
        print(f"获取行政区信息失败: {e}")
        return None
    finally:
        connection.close()
