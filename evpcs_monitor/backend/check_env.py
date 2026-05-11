#!/usr/bin/env python3
"""加载 backend/.env 并检测 MySQL、InfluxDB 是否可连接。用法：在 backend 目录执行 python check_env.py"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")


def check_mysql() -> bool:
    import pymysql

    conn = pymysql.connect(
        host=os.getenv("MYSQL_HOST", "127.0.0.1"),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "evpcs"),
        charset="utf8",
        cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS ok")
            row = cur.fetchone()
        return bool(row and row.get("ok") == 1)
    finally:
        conn.close()


def check_influx() -> bool:
    from influxdb_client import InfluxDBClient

    token = os.getenv("INFLUXDB_TOKEN", "").strip()
    if not token:
        print("  [跳过] 未设置 INFLUXDB_TOKEN")
        return False
    url = os.getenv("INFLUXDB_URL", "http://localhost:8086")
    org = os.getenv("INFLUXDB_ORG", "myorg")
    client = InfluxDBClient(url=url, token=token, org=org, timeout=10_000)
    try:
        ok = client.ping()
        return bool(ok)
    finally:
        client.close()


def main() -> int:
    print(f"使用配置文件: {ROOT / '.env'}")
    if not (ROOT / ".env").is_file():
        print("错误: 未找到 .env。请执行: cp .env.example .env 并编辑填写。")
        return 1

    ok_all = True

    print("MySQL …")
    try:
        if check_mysql():
            print("  [成功] 已连接并可查询")
        else:
            print("  [失败] 查询异常")
            ok_all = False
    except Exception as e:
        print(f"  [失败] {e}")
        ok_all = False

    print("InfluxDB …")
    try:
        if not os.getenv("INFLUXDB_TOKEN", "").strip():
            print("  [跳过] 请在 .env 中设置 INFLUXDB_TOKEN（Influx 初始化后 UI 或 influx auth 可查看）")
            ok_all = False
        elif check_influx():
            print("  [成功] ping 通过")
        else:
            print("  [失败] ping 未通过")
            ok_all = False
    except Exception as e:
        print(f"  [失败] {e}")
        ok_all = False

    if ok_all:
        print("\n环境变量与连接检查通过，可运行: python app.py")
        return 0
    print("\n请根据上述提示修改 .env 后重试: python check_env.py")
    return 1


if __name__ == "__main__":
    sys.exit(main())
