# charging_stations_simulating.py

import pandas as pd
import numpy as np

# 读取预处理后的数据集
inf_df = pd.read_csv('data/inf_preprocessed.csv')
print('原始数据：\n', inf_df)

# 随机生成 has_parking_fee 列（0.7概率为0，0.3概率为1）
np.random.seed(42)  # 设置随机种子以便重复实验
inf_df['has_parking_fee'] = np.random.choice([0, 1], size=len(inf_df), p=[0.7, 0.3]).astype(int)

# 模拟 status 列
inf_df['status'] = 1  # 这里设置为所有充电站状态为在线（'online' 对应 1）
inf_df['status'] = inf_df['status'].astype(int)
# 显示处理后的数据
print('添加 has_parking_fee 和 status 后的数据：\n', inf_df)

# 保存数据到新的 CSV 文件
inf_df.to_csv('data/charging_stations.csv', index=False)
print('数据已保存为 data/charging_stations.csv')
