# charging_piles_simulating.py

import pandas as pd
import numpy as np
import random
import string
from tqdm import tqdm  # 进度条库

# 充电枪类型（AC 交流 & DC 直流）
AC_CONNECTORS = ["TYPE2", "GBT-AC", "J1772"]
DC_CONNECTORS = ["CCS", "CHADEMO", "GBT-DC"]

# 位置描述（简洁的英文大写字母）
LOCATION_DESC_OPTIONS = ["G", "B1", "B2"]  # Ground, Basement 1, Basement 2


# 生成随机充电桩 ID
def generate_pile_id(station_id):
    random_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{station_id}-{random_part}"


# 读取充电站数据
charging_stations_df = pd.read_csv("data/charging_stations.csv")

# 创建充电桩数据列表
pile_data = []

# 使用 tqdm 显示进度
for _, row in tqdm(
    charging_stations_df.iterrows(),
    total=len(charging_stations_df),
    desc="Processing Charging Piles",
    unit="station",
):
    station_id = row["station_id"]
    pile_count = int(row["pile_count"])  # 确保是整数

    # **优化：每个站点随机选择一个主要楼层**
    main_location = np.random.choice(LOCATION_DESC_OPTIONS)

    for i in range(pile_count):
        pile_id = generate_pile_id(station_id)

        # 70% 交流（0），30% 直流（1）
        charging_type = np.random.choice([0, 1], p=[0.55, 0.45])
        

        # 根据充电类型选择充电功率
        if charging_type == 0:  # 交流
            charging_power = np.random.choice([7, 11, 22])  # 交流功率
            connector_type = np.random.choice(AC_CONNECTORS)  # 选择 AC 接口
        else:  # 直流
            charging_power = np.random.choice([50, 100, 150])  # 直流功率
            connector_type = np.random.choice(DC_CONNECTORS)  # 选择 DC 接口


        # **优化：80% 站点的充电桩处于统一楼层，20% 存在楼层差异**
        if np.random.rand() < 0.8:
            location_desc = main_location  # 统一楼层
        else:
            location_desc = np.random.choice(LOCATION_DESC_OPTIONS)  # 小部分桩楼层不同

        # 维护需求（90% 正常，10% 需要维护）
        maintenance_needed = np.random.choice([0, 1], p=[0.9, 0.1])

        # 添加数据
        pile_data.append(
            [
                pile_id,
                station_id,
                charging_type,
                charging_power,
                connector_type,
                location_desc,
                maintenance_needed,
            ]
        )

# 创建 DataFrame
charging_piles_df = pd.DataFrame(
    pile_data,
    columns=[
        "pile_id",
        "station_id",
        "charging_type",
        "charging_power",
        "connector_type",
        "location_desc",
        "maintenance_needed",
    ],
)

# 保存为 CSV 文件
charging_piles_df.to_csv("data/charging_piles.csv", index=False)

print("✅ 充电桩数据已成功生成并保存到 data/charging_piles.csv！")
