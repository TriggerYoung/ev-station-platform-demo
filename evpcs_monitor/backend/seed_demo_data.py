#!/usr/bin/env python3
"""从 network_data 初始化可重复运行的本地 MySQL 演示数据。

默认读取本文件同目录下的 ``.env``。``--dry-run`` 只解析并校验数据，
不会导入数据库驱动、建立连接或执行任何 SQL。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Iterable, Iterator, Sequence

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = BACKEND_DIR / "network_data"
DEFAULT_ENV_FILE = BACKEND_DIR / ".env"

EXPECTED_DISTRICT_COUNT = 9
EXPECTED_STATION_COUNT = 1_543
EXPECTED_PILE_COUNT = 20_945

DISTRICTS: tuple[tuple[str, str, float, float, float, float], ...] = (
    ("440303", "罗湖区", 114.119444, 22.543889, 103.46, 78.79),
    ("440304", "福田区", 114.057868, 22.543099, 152.10, 78.66),
    ("440305", "南山区", 113.933333, 22.533333, 181.86, 185.30),
    ("440306", "宝安区", 113.850000, 22.580000, 456.54, 397.00),
    ("440307", "龙岗区", 114.233333, 22.750000, 409.81, 388.21),
    ("440308", "盐田区", 114.242500, 22.552500, 21.24, 74.99),
    ("440309", "龙华区", 114.066667, 22.666667, 251.84, 175.60),
    ("440310", "坪山区", 114.366667, 22.716667, 61.61, 166.31),
    ("440311", "光明区", 113.950000, 22.683333, 115.90, 155.44),
)

DEMO_USERS: tuple[tuple[str, str], ...] = (
    ("visitor@evpcs.demo", "viewer"),
    ("operator@evpcs.demo", "operator"),
    ("admin@evpcs.demo", "admin"),
    ("planner@evpcs.demo", "viewer"),
    ("maintainer@evpcs.demo", "operator"),
)

# key, username, content, parent key, likes
DEMO_COMMENTS: tuple[tuple[str, str, str, str | None, int], ...] = (
    (
        "reservation",
        "visitor@evpcs.demo",
        "建议在晚高峰开放充电预约，并展示预计等待时间。",
        None,
        18,
    ),
    (
        "fast-charge",
        "planner@evpcs.demo",
        "龙岗区部分站点利用率较高，可以优先补充直流快充桩。",
        None,
        15,
    ),
    (
        "maintenance",
        "maintainer@evpcs.demo",
        "希望运维页面增加待检修设备和异常站点的快捷筛选。",
        None,
        11,
    ),
    (
        "pricing",
        "operator@evpcs.demo",
        "分时电价趋势很直观，建议同时展示服务费构成。",
        None,
        9,
    ),
    (
        "navigation",
        "visitor@evpcs.demo",
        "地图中如果能标明停车场入口，首次到访会更方便。",
        None,
        7,
    ),
    (
        "reservation-reply",
        "operator@evpcs.demo",
        "已记录该建议，后续可结合实时占用率计算等待时长。",
        "reservation",
        6,
    ),
    (
        "fast-charge-reply",
        "admin@evpcs.demo",
        "可以先依据站点负荷、利用率和周边需求做扩容排序。",
        "fast-charge",
        5,
    ),
    (
        "maintenance-reply",
        "admin@evpcs.demo",
        "演示数据已包含维护状态，可用于验证筛选流程。",
        "maintenance",
        4,
    ),
)


SCHEMA_STATEMENTS: tuple[str, ...] = (
    """
    CREATE TABLE IF NOT EXISTS districts (
        adcode VARCHAR(100) PRIMARY KEY,
        district_name VARCHAR(255) NOT NULL,
        longitude DECIMAL(15, 6),
        latitude DECIMAL(15, 6),
        population DECIMAL(9, 3) NOT NULL,
        area DECIMAL(9, 3) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS charging_stations (
        station_id VARCHAR(25) PRIMARY KEY,
        longitude DECIMAL(9, 6),
        latitude DECIMAL(9, 6),
        pile_count INT NOT NULL DEFAULT 0,
        address VARCHAR(255),
        adcode VARCHAR(25) NOT NULL,
        has_parking_fee TINYINT(1) NOT NULL DEFAULT 0,
        status TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_stations_district
            FOREIGN KEY (adcode) REFERENCES districts(adcode) ON DELETE CASCADE,
        INDEX idx_stations_adcode (adcode)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS charging_piles (
        pile_id VARCHAR(100) PRIMARY KEY,
        station_id VARCHAR(25) NOT NULL,
        charging_type TINYINT(1) NOT NULL DEFAULT 0,
        charging_power INT NOT NULL,
        connector_type VARCHAR(50),
        location_desc VARCHAR(255),
        maintenance_needed TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_piles_station
            FOREIGN KEY (station_id) REFERENCES charging_stations(station_id)
            ON DELETE CASCADE,
        INDEX idx_piles_station_id (station_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'viewer',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB AUTO_INCREMENT=100
      DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS business (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact_name VARCHAR(50) NOT NULL,
        contact_info VARCHAR(100) NOT NULL,
        company VARCHAR(100) NOT NULL,
        position VARCHAR(50),
        company_size VARCHAR(50),
        industry VARCHAR(100),
        cooperation_type VARCHAR(100) NOT NULL,
        region VARCHAR(100),
        website VARCHAR(255),
        needs TEXT,
        is_read TINYINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS comments (
        comment_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        content TEXT NOT NULL,
        parent_id INT DEFAULT NULL,
        likes INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_comments_user
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
        CONSTRAINT fk_comments_parent
            FOREIGN KEY (parent_id) REFERENCES comments(comment_id) ON DELETE CASCADE,
        INDEX idx_comments_user_id (user_id),
        INDEX idx_comments_parent_id (parent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS comment_likes (
        comment_id INT NOT NULL,
        user_id INT NOT NULL,
        PRIMARY KEY (comment_id, user_id),
        CONSTRAINT fk_comment_likes_comment
            FOREIGN KEY (comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE,
        CONSTRAINT fk_comment_likes_user
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="从 network_data 幂等初始化本地 MySQL 演示数据"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="只校验数据与计数，不导入数据库驱动、不连接数据库",
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=DEFAULT_DATA_DIR,
        help=f"社区网络 JSON 目录（默认：{DEFAULT_DATA_DIR}）",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=DEFAULT_ENV_FILE,
        help=f"环境变量文件（默认：{DEFAULT_ENV_FILE}）",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=1_000,
        help="MySQL 批量 upsert 的每批记录数（默认：1000）",
    )
    args = parser.parse_args(argv)
    if args.batch_size <= 0:
        parser.error("--batch-size 必须大于 0")
    return args


def stable_digest(value: str) -> bytes:
    return hashlib.sha256(value.encode("utf-8")).digest()


def digest_number(digest: bytes, offset: int) -> int:
    """从摘要中读取稳定的 32 位整数，避免单字节取模造成比例偏差。"""
    return int.from_bytes(digest[offset : offset + 4], byteorder="big")


def require_mapping(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError(f"{label} 应为 JSON 对象")
    return value


def require_list(value: Any, label: str) -> list[Any]:
    if not isinstance(value, list):
        raise ValueError(f"{label} 应为 JSON 数组")
    return value


def load_stations(data_dir: Path) -> list[tuple[Any, ...]]:
    """读取并严格校验社区 JSON，返回与 stations 表字段一致的元组。"""
    files = sorted(data_dir.glob("*_community.json"))
    if len(files) != EXPECTED_DISTRICT_COUNT:
        raise ValueError(
            f"{data_dir} 应包含 {EXPECTED_DISTRICT_COUNT} 个 *_community.json，"
            f"实际找到 {len(files)} 个"
        )

    valid_adcodes = {district[0] for district in DISTRICTS}
    seen_ids: set[str] = set()
    stations: list[tuple[Any, ...]] = []

    for path in files:
        file_adcode = path.name.split("_", 1)[0]
        if file_adcode not in valid_adcodes:
            raise ValueError(f"{path.name}: 文件名中的行政区编码不受支持")

        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise ValueError(f"无法读取 {path}: {exc}") from exc
        communities = require_mapping(payload, path.name)

        for community_id in sorted(communities):
            community = require_mapping(
                communities[community_id], f"{path.name}/{community_id}"
            )
            source_stations = require_list(
                community.get("stations"), f"{path.name}/{community_id}/stations"
            )
            for offset, source in enumerate(source_stations):
                label = f"{path.name}/{community_id}/stations[{offset}]"
                station = require_mapping(source, label)
                required = {
                    "station_id",
                    "longitude",
                    "latitude",
                    "pile_count",
                    "address",
                    "adcode",
                }
                missing = sorted(required - station.keys())
                if missing:
                    raise ValueError(f"{label}: 缺少字段 {', '.join(missing)}")

                station_id = str(station["station_id"]).strip()
                adcode = str(station["adcode"]).strip()
                address = str(station["address"]).strip()
                if not station_id or len(station_id) > 25:
                    raise ValueError(f"{label}: station_id 为空或超过 25 个字符")
                if station_id in seen_ids:
                    raise ValueError(f"{label}: station_id {station_id!r} 重复")
                if adcode != file_adcode:
                    raise ValueError(
                        f"{label}: adcode {adcode!r} 与文件 {file_adcode!r} 不一致"
                    )
                if not address:
                    raise ValueError(f"{label}: address 不能为空")

                try:
                    longitude = float(station["longitude"])
                    latitude = float(station["latitude"])
                    pile_count = int(station["pile_count"])
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"{label}: 经纬度或 pile_count 类型错误") from exc
                if not (-180 <= longitude <= 180 and -90 <= latitude <= 90):
                    raise ValueError(f"{label}: 经纬度超出有效范围")
                if pile_count < 0:
                    raise ValueError(f"{label}: pile_count 不能为负数")

                digest = stable_digest(f"station:{station_id}")
                has_parking_fee = int(digest_number(digest, 0) % 100 < 38)
                status_bucket = digest_number(digest, 4) % 100
                status = 0 if status_bucket < 3 else 2 if status_bucket < 8 else 1
                stations.append(
                    (
                        station_id,
                        longitude,
                        latitude,
                        pile_count,
                        address,
                        adcode,
                        has_parking_fee,
                        status,
                    )
                )
                seen_ids.add(station_id)

    stations.sort(key=lambda row: row[0])
    if len(stations) != EXPECTED_STATION_COUNT:
        raise ValueError(
            f"站点计数应为 {EXPECTED_STATION_COUNT}，实际为 {len(stations)}"
        )
    pile_total = sum(row[3] for row in stations)
    if pile_total != EXPECTED_PILE_COUNT:
        raise ValueError(
            f"pile_count 合计应为 {EXPECTED_PILE_COUNT}，实际为 {pile_total}"
        )
    return stations


def generate_piles(stations: Iterable[tuple[Any, ...]]) -> list[tuple[Any, ...]]:
    """按 station_id 与站内序号生成稳定、可重复的桩记录。"""
    ac_powers = (7, 11, 22)
    dc_powers = (60, 120, 180)
    ac_connectors = ("GBT-AC", "TYPE2", "J1772")
    dc_connectors = ("GBT-DC", "CCS", "CHADEMO")
    locations = ("G", "B1", "B2")
    piles: list[tuple[Any, ...]] = []

    for station in stations:
        station_id = str(station[0])
        pile_count = int(station[3])
        for sequence in range(1, pile_count + 1):
            digest = stable_digest(f"pile:{station_id}:{sequence}")
            charging_type = int(digest_number(digest, 0) % 100 < 45)
            powers = dc_powers if charging_type else ac_powers
            connectors = dc_connectors if charging_type else ac_connectors
            piles.append(
                (
                    f"{station_id}-D{sequence:04d}",
                    station_id,
                    charging_type,
                    powers[digest_number(digest, 4) % len(powers)],
                    connectors[digest_number(digest, 8) % len(connectors)],
                    locations[digest_number(digest, 12) % len(locations)],
                    int(digest_number(digest, 16) % 100 < 10),
                )
            )

    if len(piles) != EXPECTED_PILE_COUNT:
        raise ValueError(
            f"生成的充电桩应为 {EXPECTED_PILE_COUNT}，实际为 {len(piles)}"
        )
    if len({pile[0] for pile in piles}) != len(piles):
        raise ValueError("生成的 pile_id 存在重复")
    return piles


def iter_batches(rows: Sequence[tuple[Any, ...]], size: int) -> Iterator[Sequence[tuple[Any, ...]]]:
    for start in range(0, len(rows), size):
        yield rows[start : start + size]


def database_config() -> dict[str, Any]:
    database = os.getenv("MYSQL_DATABASE", "evpcs").strip()
    if not re.fullmatch(r"[A-Za-z0-9_]+", database):
        raise ValueError("MYSQL_DATABASE 仅允许字母、数字和下划线")
    try:
        port = int(os.getenv("MYSQL_PORT", "3306"))
    except ValueError as exc:
        raise ValueError("MYSQL_PORT 必须是整数") from exc
    if not 1 <= port <= 65_535:
        raise ValueError("MYSQL_PORT 必须在 1 到 65535 之间")

    return {
        "host": os.getenv("MYSQL_HOST", "127.0.0.1"),
        "port": port,
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", ""),
        "database": database,
    }


def upsert_in_batches(
    cursor: Any,
    sql: str,
    rows: Sequence[tuple[Any, ...]],
    batch_size: int,
) -> None:
    for batch in iter_batches(rows, batch_size):
        cursor.executemany(sql, batch)


def ensure_demo_comment(
    cursor: Any,
    user_id: int,
    content: str,
    parent_id: int | None,
    likes: int,
) -> int:
    """按用户、正文和父评论定位演示评论，避免重复插入。"""
    if parent_id is None:
        cursor.execute(
            """
            SELECT comment_id FROM comments
            WHERE user_id = %s AND content = %s AND parent_id IS NULL
            ORDER BY comment_id LIMIT 1
            """,
            (user_id, content),
        )
    else:
        cursor.execute(
            """
            SELECT comment_id FROM comments
            WHERE user_id = %s AND content = %s AND parent_id = %s
            ORDER BY comment_id LIMIT 1
            """,
            (user_id, content, parent_id),
        )
    existing = cursor.fetchone()
    if existing:
        comment_id = int(existing["comment_id"])
        cursor.execute(
            "UPDATE comments SET likes = %s WHERE comment_id = %s",
            (likes, comment_id),
        )
        return comment_id

    cursor.execute(
        """
        INSERT INTO comments (user_id, content, parent_id, likes)
        VALUES (%s, %s, %s, %s)
        """,
        (user_id, content, parent_id, likes),
    )
    return int(cursor.lastrowid)


def count_known_ids(cursor: Any, table: str, column: str, ids: Sequence[str]) -> int:
    """分批确认本次种子主键均已写入；表名和列名仅由调用方常量提供。"""
    total = 0
    for batch in (ids[start : start + 1_000] for start in range(0, len(ids), 1_000)):
        placeholders = ", ".join(["%s"] * len(batch))
        cursor.execute(
            f"SELECT COUNT(*) AS total FROM {table} WHERE {column} IN ({placeholders})",
            tuple(batch),
        )
        total += int(cursor.fetchone()["total"])
    return total


def seed_mysql(
    stations: list[tuple[Any, ...]],
    piles: list[tuple[Any, ...]],
    batch_size: int,
) -> None:
    """创建缺失表并在一个 DML 事务内幂等写入演示记录。"""
    demo_password = os.getenv("DEMO_USER_PASSWORD", "")
    if not demo_password:
        raise ValueError(
            "未设置 DEMO_USER_PASSWORD。请仅在本地 .env 中设置演示账号密码后重试"
        )

    # --dry-run 路径不会执行到这里，因此也不会导入数据库驱动。
    import pymysql

    config = database_config()
    database = config.pop("database")
    connection = pymysql.connect(
        **config,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        connect_timeout=10,
        read_timeout=30,
        write_timeout=60,
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{database}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
            cursor.execute(f"USE `{database}`")
            for statement in SCHEMA_STATEMENTS:
                cursor.execute(statement)

            cursor.executemany(
                """
                INSERT INTO districts
                    (adcode, district_name, longitude, latitude, population, area)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    district_name = VALUES(district_name),
                    longitude = VALUES(longitude),
                    latitude = VALUES(latitude),
                    population = VALUES(population),
                    area = VALUES(area)
                """,
                DISTRICTS,
            )
            upsert_in_batches(
                cursor,
                """
                INSERT INTO charging_stations
                    (station_id, longitude, latitude, pile_count, address, adcode,
                     has_parking_fee, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    longitude = VALUES(longitude),
                    latitude = VALUES(latitude),
                    pile_count = VALUES(pile_count),
                    address = VALUES(address),
                    adcode = VALUES(adcode),
                    has_parking_fee = VALUES(has_parking_fee),
                    status = VALUES(status),
                    updated_at = CURRENT_TIMESTAMP
                """,
                stations,
                batch_size,
            )
            upsert_in_batches(
                cursor,
                """
                INSERT INTO charging_piles
                    (pile_id, station_id, charging_type, charging_power,
                     connector_type, location_desc, maintenance_needed)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    station_id = VALUES(station_id),
                    charging_type = VALUES(charging_type),
                    charging_power = VALUES(charging_power),
                    connector_type = VALUES(connector_type),
                    location_desc = VALUES(location_desc),
                    maintenance_needed = VALUES(maintenance_needed),
                    updated_at = CURRENT_TIMESTAMP
                """,
                piles,
                batch_size,
            )

            cursor.executemany(
                """
                INSERT INTO users (username, password, role)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    password = VALUES(password),
                    role = VALUES(role),
                    updated_at = CURRENT_TIMESTAMP
                """,
                [
                    (username, demo_password, role)
                    for username, role in DEMO_USERS
                ],
            )
            usernames = [username for username, _role in DEMO_USERS]
            placeholders = ", ".join(["%s"] * len(usernames))
            cursor.execute(
                f"SELECT user_id, username FROM users WHERE username IN ({placeholders})",
                tuple(usernames),
            )
            user_ids = {
                row["username"]: int(row["user_id"]) for row in cursor.fetchall()
            }
            if set(user_ids) != set(usernames):
                raise RuntimeError("演示用户写入后校验失败")

            comment_ids: dict[str, int] = {}
            for key, username, content, parent_key, likes in DEMO_COMMENTS:
                if parent_key is not None and parent_key not in comment_ids:
                    raise RuntimeError(f"评论 {key} 引用了尚未创建的父评论 {parent_key}")
                comment_ids[key] = ensure_demo_comment(
                    cursor,
                    user_ids[username],
                    content,
                    comment_ids.get(parent_key) if parent_key else None,
                    likes,
                )

            station_count = count_known_ids(
                cursor,
                "charging_stations",
                "station_id",
                [str(row[0]) for row in stations],
            )
            pile_count = count_known_ids(
                cursor,
                "charging_piles",
                "pile_id",
                [str(row[0]) for row in piles],
            )
            if station_count != EXPECTED_STATION_COUNT:
                raise RuntimeError(
                    f"站点写入校验失败：应为 {EXPECTED_STATION_COUNT}，实际为 {station_count}"
                )
            if pile_count != EXPECTED_PILE_COUNT:
                raise RuntimeError(
                    f"充电桩写入校验失败：应为 {EXPECTED_PILE_COUNT}，实际为 {pile_count}"
                )

        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def print_summary(stations: Sequence[tuple[Any, ...]], piles: Sequence[tuple[Any, ...]]) -> None:
    station_counts = {district[0]: 0 for district in DISTRICTS}
    pile_counts = {district[0]: 0 for district in DISTRICTS}
    for station in stations:
        adcode = str(station[5])
        station_counts[adcode] += 1
        pile_counts[adcode] += int(station[3])

    print("数据校验通过：")
    print(f"  行政区: {len(DISTRICTS):,}")
    print(f"  充电站: {len(stations):,}")
    print(f"  充电桩: {len(piles):,}")
    print(f"  演示用户: {len(DEMO_USERS):,}")
    print(f"  演示评论: {len(DEMO_COMMENTS):,}")
    print("  分区明细:")
    for adcode, district_name, *_rest in DISTRICTS:
        print(
            f"    {adcode} {district_name}: "
            f"{station_counts[adcode]:,} 站 / {pile_counts[adcode]:,} 桩"
        )


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    load_dotenv(args.env_file)
    try:
        stations = load_stations(args.data_dir)
        piles = generate_piles(stations)
        print_summary(stations, piles)
        if args.dry_run:
            print("\n--dry-run：未连接数据库，未执行任何写入。")
            return 0

        seed_mysql(stations, piles, args.batch_size)
        print("\nMySQL 演示数据初始化完成；重复运行不会新增重复记录。")
        return 0
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"错误: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # 数据库驱动异常在此转换成简洁 CLI 错误。
        print(f"MySQL 初始化失败: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
