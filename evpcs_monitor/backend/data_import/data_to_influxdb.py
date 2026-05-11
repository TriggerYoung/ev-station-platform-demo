#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
data_to_influxdb.py

将合并后的 CSV 数据写入 InfluxDB，彻底跳过 inf_duplicates.csv 中列出的重复 station_id 列。
"""
import os
import time
import pandas as pd
from backend.utils.influxdb_connection import get_influxdb_client
from influxdb_client import Point, WriteOptions
from tqdm import tqdm

# ---------------- 配置 ----------------
# InfluxDB 连接
client, write_api, query_api, delete_api = get_influxdb_client()
from influxdb_client import WriteOptions

async_write_api = client.write_api(
    write_options=WriteOptions(
        batch_size=200_000,            # 每批点增大到 20 万
        flush_interval=1_000,          # 最长 1s 刷新一次
        jitter_interval=500,           # 随机抖动 0.5s 避免同时写
        max_retries=5,                 # 重试 5 次
        retry_interval=1_000,          # 每次重试间隔 1s
    )
)


# 数据文件路径
DATA_DIR = "/Users/young/evpcs_monitor/backend/data"
CSV_FILES = {
    "occupancy": os.path.join(DATA_DIR, "occupancy.csv"),
    "volume":    os.path.join(DATA_DIR, "volume.csv"),
    "duration":  os.path.join(DATA_DIR, "duration.csv"),
    "e_price":   os.path.join(DATA_DIR, "e_price.csv"),
    "s_price":   os.path.join(DATA_DIR, "s_price.csv"),
}
# 重复 ID 列表（只含 station_id 一列）
DUPS_FP = os.path.join(DATA_DIR, "inf_id_duplicates.csv")
# InfluxDB bucket & org
BUCKET = "charging_data"
ORG    = "myorg"


def load_duplicate_ids(dup_fp):
    """加载要彻底丢弃的重复 station_id 集合"""
    if os.path.exists(dup_fp):
        dup_df = pd.read_csv(dup_fp, dtype=str)
        # 确保去除可能的空行，并转为字符串集合
        return set(dup_df['station_id'].dropna().astype(str).tolist())
    return set()


def clear_bucket(bucket_name=BUCKET):
    """清空指定 bucket 中的所有数据"""
    print(f"正在清空 `{bucket_name}` 中所有数据...")
    try:
        delete_api.delete(
            start="1970-01-01T00:00:00Z",
            stop="2262-04-11T23:47:16Z",
            predicate='_measurement!=""',
            bucket=bucket_name,
            org=ORG,
        )
        print(f"`{bucket_name}` Bucket 已成功清空！")
    except Exception as e:
        print(f"[错误] 无法清空 `{bucket_name}`: {e}")


def write_combined_csv_to_influx(measurement=BUCKET):
    """合并多个 CSV 文件并写入 InfluxDB，跳过重复的 station_id 列"""
    # 1. 读取重复 IDs
    dup_ids = load_duplicate_ids(DUPS_FP)
    if dup_ids:
        print(f"将跳过重复 station_id 对应的列: {sorted(dup_ids)}")

    # 2. 加载并处理所有 CSV
    combined = {}
    for name, path in CSV_FILES.items():
        if not os.path.exists(path):
            print(f"[错误] 文件未找到: {path}")
            return
        df = pd.read_csv(path)
        df["time"] = pd.to_datetime(df["time"])

        # 建立要删除的列名列表：除 'time' 外，列名字符串恰好在 dup_ids 中的
        to_drop = [col for col in df.columns 
                   if col != "time" and str(col) in dup_ids]
        if to_drop:
            df.drop(columns=to_drop, inplace=True)
        combined[name] = df

    # 3. 确定剩余的 station_id 列
    volume_df = combined["volume"]
    station_ids = [col for col in volume_df.columns if col != "time"]
    print(f"最终写入的 station_id 列共 {len(station_ids)} 个：{station_ids}")

    # 4. 写入 InfluxDB
    points = []
    start_ts = time.time()
    total = len(volume_df)

    for idx, row in tqdm(volume_df.iterrows(), total=total, desc="导入数据"):
        ts = row["time"]
        for sid in station_ids:
            pt = Point(measurement).tag("station_id", str(sid)).time(ts)
            # 对每个字段，从每张表里取值
            for fld, df in combined.items():
                val = df.at[idx, sid]
                if pd.notna(val):
                    try:
                        pt.field(fld, round(float(val), 3))
                    except Exception as e:
                        print(f"[警告] 转换出错: {e} ({fld}, {sid}, {val})")
            points.append(pt)

        # 批量写入
        if len(points) >= 50000:
            async_write_api.write(bucket=BUCKET, org=ORG, record=points)
            points.clear()

    # 写入剩余
    if points:
        async_write_api.write(bucket=BUCKET, org=ORG, record=points)
    async_write_api.flush()

    elapsed = time.time() - start_ts
    print(f"数据成功写入 InfluxDB，耗时 {elapsed:.2f} 秒")


if __name__ == "__main__":
    clear_bucket()
    write_combined_csv_to_influx()
    print("所有 CSV 数据合并存储完成！")
