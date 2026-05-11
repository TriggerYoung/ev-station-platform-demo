# db_utils.py
from utils.db_connetion import connect_to_db


def validate_user(username, password):
    """
    验证用户信息并返回用户的 user_id 和角色
    :param username: 用户名
    :param password: 密码
    :return: 成功返回 (True, user_info)，失败返回 (False, None)
    """
    connection = connect_to_db()
    if not connection:
        return False, None

    try:
        with connection.cursor() as cursor:
            sql = (
                "SELECT user_id, role FROM users WHERE username = %s AND password = %s"
            )
            cursor.execute(sql, (username, password))
            result = cursor.fetchone()
            if result:
                return True, {"user_id": result["user_id"], "role": result["role"]}
            return False, None
    except Exception as e:
        print(f"用户验证失败: {e}")
        return False, None
    finally:
        connection.close()


def get_users(page, page_size, search, sort_field="created_at", sort_order="DESC"):
    """获取分页后的用户列表，支持搜索和排序"""
    connection = connect_to_db()
    if not connection:
        return None, 0

    # 安全字段白名单
    allowed_fields = ["user_id", "username", "role", "created_at", "updated_at"]
    sort_field = sort_field if sort_field in allowed_fields else "created_at"
    sort_order = sort_order.upper() if sort_order.upper() in ("ASC", "DESC") else "DESC"

    offset = (page - 1) * page_size
    try:
        with connection.cursor() as cursor:
            # 构造基础查询
            base_query = """
                SELECT user_id, username, role, created_at, updated_at
                FROM users
            """
            count_query = "SELECT COUNT(*) AS total FROM users"

            # 添加搜索条件
            where_clause = ""
            if search:
                where_clause = (
                    " WHERE username LIKE %s OR CAST(user_id AS CHAR) LIKE %s "
                )
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

            users = cursor.fetchall()
            return users, total
    except Exception as e:
        print(f"获取用户失败: {e}")
        return None, 0
    finally:
        connection.close()


def add_user(username, password, role):
    """添加用户"""
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)"
            cursor.execute(sql, (username, password, role))
            connection.commit()
            return True
    except Exception as e:
        print(f"添加用户失败: {e}")
        return False
    finally:
        connection.close()


def delete_user(user_id):
    """删除用户"""
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            sql = "DELETE FROM users WHERE user_id = %s"
            cursor.execute(sql, (user_id,))
            connection.commit()
            return True
    except Exception as e:
        print(f"删除用户失败: {e}")
        return False
    finally:
        connection.close()


def update_user(user_id, username, password, role):
    """更新用户"""
    connection = connect_to_db()
    if not connection:
        return False

    try:
        with connection.cursor() as cursor:
            sql = "UPDATE users SET username = %s, password = %s, role = %s WHERE user_id = %s"
            cursor.execute(sql, (username, password, role, user_id))
            connection.commit()
            return True
    except Exception as e:
        print(f"更新用户失败: {e}")
        return False
    finally:
        connection.close()
