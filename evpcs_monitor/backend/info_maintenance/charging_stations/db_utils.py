from utils.db_connetion import connect_to_db


def get_stations(
    page=1, page_size=10, search=None, sort_field="created_at", sort_order="DESC"
):
    """分页获取充电站信息，支持搜索和排序"""
    connection = connect_to_db()
    if not connection:
        return None, 0

    # 安全字段白名单
    allowed_fields = [
        "station_id",
        "pile_count",
        "created_at",
        "updated_at",
        "has_parking_fee",
        "status",
    ]
    sort_field = sort_field if sort_field in allowed_fields else "created_at"
    sort_order = sort_order.upper() if sort_order.upper() in ("ASC", "DESC") else "DESC"

    offset = (page - 1) * page_size
    try:
        with connection.cursor() as cursor:
            # 基础查询
            base_query = """
                SELECT station_id, longitude, latitude, pile_count, address, 
                       adcode, has_parking_fee, status, created_at, updated_at
                FROM charging_stations
            """
            count_query = "SELECT COUNT(*) AS total FROM charging_stations"

            # 搜索条件（支持地址和站ID搜索）
            where_clause = ""
            params = []
            if search:
                where_clause = " WHERE address LIKE %s OR station_id LIKE %s"
                params = (f"%{search}%", f"%{search}%")

            # 构造总数查询
            final_count_query = count_query + where_clause
            if search:
                cursor.execute(final_count_query, params)
            else:
                cursor.execute(final_count_query)
            total = cursor.fetchone()["total"]

            # 构造数据查询
            final_data_query = f"""
                {base_query}
                {where_clause}
                ORDER BY {sort_field} {sort_order}
                LIMIT %s OFFSET %s
            """

            # 执行查询
            if search:
                cursor.execute(final_data_query, params + (page_size, offset))
            else:
                cursor.execute(final_data_query, (page_size, offset))

            stations = cursor.fetchall()
            return stations, total
    except Exception as e:
        print(f"获取充电站失败: {e}")
        return None, 0
    finally:
        connection.close()


def add_station(
    station_id, longitude, latitude, pile_count, address, adcode, has_parking_fee, status
):
    """添加充电站（仅用于新增，不支持更新）"""
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO charging_stations (station_id, longitude, latitude, pile_count, address, adcode, has_parking_fee, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(
                sql,
                (
                    station_id,
                    longitude,
                    latitude,
                    pile_count,
                    address,
                    adcode,
                    has_parking_fee,
                    status,
                ),
            )
            connection.commit()
            return True
    except Exception as e:
        print(f"添加充电站失败: {e}")
        return False
    finally:
        connection.close()


def upsert_station(
    station_id, longitude, latitude, pile_count, address, adcode, has_parking_fee, status
):
    """
    插入或更新充电站：
    - 如果 station_id 已存在，则更新记录（覆盖原有数据）
    - 否则插入新记录
    """
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO charging_stations 
                  (station_id, longitude, latitude, pile_count, address, adcode, has_parking_fee, status)
                VALUES 
                  (%s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                  longitude = VALUES(longitude),
                  latitude = VALUES(latitude),
                  pile_count = VALUES(pile_count),
                  address = VALUES(address),
                  adcode = VALUES(adcode),
                  has_parking_fee = VALUES(has_parking_fee),
                  status = VALUES(status),
                  updated_at = CURRENT_TIMESTAMP
            """
            cursor.execute(
                sql,
                (
                    station_id,
                    longitude,
                    latitude,
                    pile_count,
                    address,
                    adcode,
                    has_parking_fee,
                    status,
                ),
            )
            connection.commit()
            return True
    except Exception as e:
        print(f"Upsert charging station failed: {e}")
        return False
    finally:
        connection.close()


def delete_station(station_id):
    """删除充电站及其所有充电桩"""
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            # 先删除该站点的所有充电桩
            cursor.execute(
                "DELETE FROM charging_piles WHERE station_id = %s", (station_id,)
            )

            # 再删除充电站本身
            cursor.execute(
                "DELETE FROM charging_stations WHERE station_id = %s", (station_id,)
            )

            connection.commit()
            print(f"成功删除 station_id {station_id} 及其所有充电桩")
            return True
    except Exception as e:
        print(f"删除充电站失败: {e}")
        return False
    finally:
        connection.close()


def update_station(
    station_id, longitude, latitude, pile_count, address, adcode, has_parking_fee, status
):
    """更新充电站"""
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            sql = """
                UPDATE charging_stations
                SET longitude = %s, latitude = %s, pile_count = %s, address = %s,
                    adcode = %s, has_parking_fee = %s, status = %s
                WHERE station_id = %s
            """
            cursor.execute(
                sql,
                (
                    longitude,
                    latitude,
                    pile_count,
                    address,
                    adcode,
                    has_parking_fee,
                    status,
                    station_id,
                ),
            )
            connection.commit()
            return True
    except Exception as e:
        print(f"更新充电站失败: {e}")
        return False
    finally:
        connection.close()


def batch_delete_stations(station_ids):
    """批量删除充电站及其所有充电桩"""
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            # 先删除所有这些充电站关联的充电桩
            cursor.execute(
                "DELETE FROM charging_piles WHERE station_id IN %s",
                (tuple(station_ids),),
            )

            # 再删除充电站
            cursor.execute(
                "DELETE FROM charging_stations WHERE station_id IN %s",
                (tuple(station_ids),),
            )

            connection.commit()
            print(f"成功批量删除 {len(station_ids)} 个充电站及其所有充电桩")
            return True
    except Exception as e:
        print(f"批量删除充电站失败: {e}")
        return False
    finally:
        connection.close()


def batch_download_stations(columns=None):
    """
    批量下载充电站数据，生成 Excel 文件的字节流。
    :param columns: 导出的字段列表，如果为 None 或空列表，则导出所有字段。
    :return: Excel 文件的二进制内容，如果出错返回 None。
    """
    connection = connect_to_db()
    if not connection:
        return None

    try:
        with connection.cursor() as cursor:
            # 根据 columns 参数构造查询语句
            if columns and isinstance(columns, list) and columns:
                # 注意：为了防止 SQL 注入，建议对 columns 进行预定义校验，
                # 此处假设传入的 columns 都是合法字段名
                query = "SELECT " + ", ".join(columns) + " FROM charging_stations"
            else:
                query = "SELECT * FROM charging_stations"

            cursor.execute(query)
            stations = cursor.fetchall()

        # 利用 openpyxl 生成 Excel 文件
        from openpyxl import Workbook
        from io import BytesIO

        wb = Workbook()
        ws = wb.active

        if stations:
            # 直接从第一个返回的记录中获取表头（字段顺序与查询语句一致）
            header = list(stations[0].keys())
            ws.append(header)
            for station in stations:
                row = [station.get(col, "") for col in header]
                ws.append(row)
        else:
            ws.append([])

        stream = BytesIO()
        wb.save(stream)
        stream.seek(0)
        return stream.read()

    except Exception as e:
        print("Error in batch_download_stations:", e)
        return None
    finally:
        connection.close()
