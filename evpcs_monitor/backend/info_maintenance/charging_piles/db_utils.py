from utils.db_connetion import connect_to_db


# 获取所有行政区
def get_districts():
    connection = connect_to_db()
    if not connection:
        return None

    try:
        with connection.cursor() as cursor:
            sql = "SELECT adcode, district_name FROM districts"
            cursor.execute(sql)
            return cursor.fetchall()
    except Exception as e:
        print(f"获取行政区失败: {e}")
        return None
    finally:
        connection.close()


# 获取指定行政区的充电站
def get_stations_by_adcode(adcode):
    connection = connect_to_db()
    if not connection:
        return None

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT station_id, address, pile_count
                FROM charging_stations
                WHERE adcode = %s
            """
            cursor.execute(sql, (adcode,))
            return cursor.fetchall()
    except Exception as e:
        print(f"获取充电站失败: {e}")
        return None
    finally:
        connection.close()


# 获取指定充电站的充电桩
def get_piles_by_station(station_id):
    connection = connect_to_db()
    if not connection:
        return None

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT pile_id, charging_type, charging_power, connector_type, location_desc, maintenance_needed, created_at, updated_at
                FROM charging_piles
                WHERE station_id = %s
            """
            cursor.execute(sql, (station_id,))
            return cursor.fetchall()
    except Exception as e:
        print(f"获取充电桩失败: {e}")
        return None
    finally:
        connection.close()


# 添加充电桩
def add_pile(
    pile_id,
    station_id,
    charging_type,
    charging_power,
    connector_type,
    location_desc,
    maintenance_needed,
):
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            # 插入新充电桩
            sql_insert = """
                INSERT INTO charging_piles (pile_id, station_id, charging_type, charging_power, connector_type, location_desc, maintenance_needed)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(
                sql_insert,
                (
                    pile_id,
                    station_id,
                    charging_type,
                    charging_power,
                    connector_type,
                    location_desc,
                    maintenance_needed,
                ),
            )

            # 直接更新 `pile_count`，加 1
            sql_update_count = """
                UPDATE charging_stations
                SET pile_count = pile_count + 1
                WHERE station_id = %s
            """
            cursor.execute(sql_update_count, (station_id,))

            connection.commit()
            return True
    except Exception as e:
        print(f"添加充电桩失败: {e}")
        return False
    finally:
        connection.close()


# 更新充电桩信息
def update_pile(
    pile_id,
    station_id,
    charging_type,
    charging_power,
    connector_type,
    location_desc,
    maintenance_needed,
):
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            sql = """
                UPDATE charging_piles
                SET charging_type = %s, charging_power = %s, connector_type = %s, location_desc = %s, maintenance_needed = %s
                WHERE pile_id = %s AND station_id = %s
            """
            cursor.execute(
                sql,
                (
                    charging_type,
                    charging_power,
                    connector_type,
                    location_desc,
                    maintenance_needed,
                    pile_id,
                    station_id,
                ),
            )
            connection.commit()
            return True
    except Exception as e:
        print(f"更新充电桩失败: {e}")
        return False
    finally:
        connection.close()


# 删除充电桩
def delete_pile(pile_id, station_id):
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            # 先删除充电桩
            sql_delete = "DELETE FROM charging_piles WHERE pile_id = %s"
            cursor.execute(sql_delete, (pile_id,))

            # 直接更新 `pile_count`，减 1
            sql_update_count = """
                UPDATE charging_stations
                SET pile_count = GREATEST(pile_count - 1, 0)
                WHERE station_id = %s
            """
            cursor.execute(sql_update_count, (station_id,))

            connection.commit()
            return True
    except Exception as e:
        print(f"删除充电桩失败: {e}")
        return False
    finally:
        connection.close()


# 批量删除充电桩
def delete_piles_batch(pile_ids, station_id):
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            # 先删除充电桩
            sql_delete = "DELETE FROM charging_piles WHERE pile_id IN %s"
            cursor.execute(sql_delete, (tuple(pile_ids),))

            # 直接更新 `pile_count`，减去删除的桩数
            sql_update_count = """
                UPDATE charging_stations
                SET pile_count = GREATEST(pile_count - %s, 0)
                WHERE station_id = %s
            """
            cursor.execute(sql_update_count, (len(pile_ids), station_id))

            connection.commit()
            return True
    except Exception as e:
        print(f"批量删除充电桩失败: {e}")
        return False
    finally:
        connection.close()
