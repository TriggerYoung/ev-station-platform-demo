import os

import pymysql


def connect_to_db():
    """
    建立与 MySQL 的连接。账号口令请通过环境变量配置，勿写入仓库。
    MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
    """
    try:
        connection = pymysql.connect(
            host=os.getenv("MYSQL_HOST", "127.0.0.1"),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", ""),
            database=os.getenv("MYSQL_DATABASE", "evpcs"),
            charset="utf8",
            cursorclass=pymysql.cursors.DictCursor,
        )
        return connection
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return None
