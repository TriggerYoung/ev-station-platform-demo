import pandas as pd
from tqdm import tqdm
from backend.utils.geo_utils import get_address_adcode_by_tencent

inf_df = pd.read_csv('data/inf.csv')
print('原始数据：\n', inf_df)

# 去空值
inf_cleaned_df = inf_df.dropna()
print('去除空值后数据行数：', inf_cleaned_df.shape[0])

# 去重值
inf_cleaned_df = inf_cleaned_df.drop_duplicates(subset=['longitude', 'latitude'], keep='first')
print('去除重值后数据行数：', inf_cleaned_df.shape[0])

# 新增空的地址和adcode列
inf_cleaned_df['address'] = None
inf_cleaned_df['adcode'] = None

# 将 'address' 和 'adcode' 列的类型设置为字符串类型
inf_cleaned_df['address'] = inf_cleaned_df['address'].astype(str)
inf_cleaned_df['adcode'] = inf_cleaned_df['adcode'].astype(str)

inf_cleaned_df['station_id'] = inf_cleaned_df['station_id'].astype(str)

inf_cleaned_df.reset_index(drop=True, inplace=True)

# 按行读取清洗后的数据，根据经纬度信息增加地址名称信息和行政区编码
for i in tqdm(range(len(inf_cleaned_df)), desc="Processing", unit="row"):
    latitude = inf_cleaned_df.iloc[i]['latitude']
    longitude = inf_cleaned_df.iloc[i]['longitude']
    location = f'{latitude},{longitude}'
    key = 'JWFBZ-A4LCW-UKCRB-Y6SRS-I24V3-YWBJB'  # 腾讯地图API密钥
    address, adcode = get_address_adcode_by_tencent(location, key)
    inf_cleaned_df.loc[i, 'address'] = address
    inf_cleaned_df.loc[i, 'adcode'] = adcode


# 显示更新后的数据
print("更新后的数据：\n", inf_cleaned_df)

# 存储为新文件inf_preprocessed.csv
inf_cleaned_df.to_csv('inf_preprocessed.csv', index=False)
