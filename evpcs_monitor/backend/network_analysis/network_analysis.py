import json
import os
import networkx as nx
from geopy.distance import geodesic
from community import community_louvain
from tqdm import tqdm  # 新增tqdm导入
from .db_utils import get_station_locations  # 使用绝对导入

# 设置数据存储目录
DATA_DIR = "./network_data"

# 创建存储目录（如果不存在）
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# 网络构建
def build_network_graph(station_data, distance_threshold):
    """构建无向图，表示充电站之间的连接关系"""
    G = nx.Graph()

    # 添加充电站节点（带进度条）
    for station in tqdm(station_data, desc="添加节点", unit="站点"):
        G.add_node(
            station["station_id"],
            latitude=float(station["latitude"]),  # 转换为float
            longitude=float(station["longitude"]),  # 转换为float
            pile_count=int(station["pile_count"]),  # 转换为int
        )

    # 添加带进度条的边计算
    total_pairs = len(station_data) * (len(station_data) - 1) // 2
    with tqdm(total=total_pairs, desc="计算站间距", unit="对") as pbar:
        for i in range(len(station_data)):
            for j in range(i + 1, len(station_data)):
                station1 = station_data[i]
                station2 = station_data[j]
                distance = geodesic(
                    (station1["latitude"], station1["longitude"]),
                    (station2["latitude"], station2["longitude"]),
                ).km

                # 转换距离为float
                distance = float(distance)  # 新增类型转换

                if distance <= distance_threshold:
                    G.add_edge(
                        station1["station_id"], station2["station_id"], weight=distance
                    )
                pbar.update(1)

    return G

# 社群检测
def detect_community_using_louvain(G):
    """使用Louvain算法进行社群检测"""
    partition = community_louvain.best_partition(G)
    return partition

# 计算网络拓扑指标
def calculate_network_metrics(G):
    """计算网络的全局指标"""
    # 计算度数
    degree_centrality = nx.degree_centrality(G)
    # 计算网络密度
    network_density = nx.density(G)
    # 计算聚集系数
    clustering_coefficient = nx.average_clustering(G)
    # 计算图的直径
    diameter = nx.diameter(G) if nx.is_connected(G) else None

    # 计算总节点数和总连边数
    total_nodes = len(G.nodes)
    total_edges = len(G.edges)

    # 获取每个节点的度数
    degree = {node: val for node, val in G.degree()}

    return {
        "total_nodes": total_nodes,
        "total_edges": total_edges,
        "degree_centrality": degree_centrality,
        "network_density": network_density,
        "clustering_coefficient": clustering_coefficient,
        "diameter": diameter,
        "degree": degree,
    }

# 社群标签获取
def get_station_community_labels(station_data, distance_threshold=3):
    """获取每个充电站的社群标签"""
    G = build_network_graph(station_data, distance_threshold)
    community_labels = detect_community_using_louvain(G)

    # 为每个充电站添加社群标签
    for station in station_data:
        station["community"] = community_labels.get(station["station_id"], None)

    return station_data, G

# 社群数据保存
def save_community_data(
    district_code, stations, distance_threshold=3
):
    """保存某个行政区的社群数据到文件"""
    community_data, G = get_station_community_labels(stations, distance_threshold)

    community_structure = {}
    for station in community_data:
        community_id = (
            f"{district_code}_{station['community']}"  # 修改为 adcode_数字字符
        )
        if community_id not in community_structure:
            community_structure[community_id] = {"stations": [], "edges": [], "metrics": {}}

        # 添加类型转换
        community_structure[community_id]["stations"].append(
            {
                "station_id": station["station_id"],
                "latitude": float(station["latitude"]),  # 转换为float
                "longitude": float(station["longitude"]),  # 转换为float
                "address": station["address"],
                "adcode": station["adcode"],
                "pile_count": int(station["pile_count"]),  # 转换为int
            }
        )

    # 计算社群内部的连边
    for community_id, community_info in tqdm(
        community_structure.items(), desc="生成连边", unit="社群"
    ):
        stations_in_community = community_info["stations"]

        G = build_network_graph(stations_in_community, distance_threshold)

        # 转换边权重为float
        edges = [
            {
                "source": u,
                "target": v,
                "weight": float(G[u][v]["weight"]),  # 转换为float
            }
            for u, v in G.edges
        ]

        community_structure[community_id]["edges"] = edges

        # 计算网络指标
        metrics = calculate_network_metrics(G)
        community_structure[community_id]["metrics"] = metrics

    # 保存到文件
    community_file = os.path.join(DATA_DIR, f"{district_code}_community.json")
    with open(community_file, "w", encoding="utf-8") as f:
        json.dump(community_structure, f, indent=4, ensure_ascii=False)


# 主处理函数
if __name__ == "__main__":
    stations = get_station_locations()
    if stations is None:
        print("无法获取充电站数据")
    else:
        distance_threshold = 3
        adcodes = set(station["adcode"] for station in stations)

        # 主处理循环添加进度条
        for adcode in tqdm(adcodes, desc="处理行政区", unit="区"):
            print(f"正在分析{adcode}行政区...")
            district_stations = [
                station for station in stations if station["adcode"] == adcode
            ]
            save_community_data(adcode, district_stations, distance_threshold)

        print("\n所有行政区的社群数据已处理完毕")
