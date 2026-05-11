import unittest
from network_analysis import build_network_graph, detect_community_using_louvain, get_station_community_labels
from geopy.distance import geodesic  # 导入geodesic计算

class TestNetworkAnalysis(unittest.TestCase):

    def setUp(self):
        """设置测试数据"""
        self.station_data = [
            {"station_id": 1, "latitude": 22.5431, "longitude": 114.0579, "pile_count": 5},
            {"station_id": 2, "latitude": 22.5461, "longitude": 114.0609, "pile_count": 6},
            {"station_id": 3, "latitude": 22.5531, "longitude": 114.0679, "pile_count": 4},
            {"station_id": 4, "latitude": 22.5551, "longitude": 114.0709, "pile_count": 8},
        ]
        self.distance_threshold = 3  # km

    def test_build_network_graph(self):
        """测试构建网络图"""
        G = build_network_graph(self.station_data, self.distance_threshold)
        self.assertEqual(len(G.nodes), 4)  # 应该有4个节点（充电站）

        # 计算3公里内的连接数
        expected_edges = 0
        for i in range(len(self.station_data)):
            for j in range(i + 1, len(self.station_data)):
                station1 = self.station_data[i]
                station2 = self.station_data[j]
                # 使用geodesic计算距离
                distance = geodesic(
                    (station1['latitude'], station1['longitude']),
                    (station2['latitude'], station2['longitude'])
                ).km
                if distance <= self.distance_threshold:
                    expected_edges += 1

        self.assertEqual(len(G.edges), expected_edges)  # 应该有符合阈值的连接数

    def test_community_detection(self):
        """测试社区检测"""
        G = build_network_graph(self.station_data, self.distance_threshold)
        community_labels = detect_community_using_louvain(G)
        self.assertEqual(len(community_labels), 4)  # 应该返回4个充电站的社群标签
        self.assertIn(1, community_labels)  # 应该包含station_id 1
        self.assertIn(2, community_labels)  # 应该包含station_id 2

    def test_get_station_community_labels(self):
        """测试获取充电站的社群标签"""
        stations_with_community = get_station_community_labels(self.station_data, self.distance_threshold)
        self.assertEqual(len(stations_with_community), 4)  # 返回4个充电站
        self.assertIn("community", stations_with_community[0])  # 每个充电站都应该有一个"community"字段

if __name__ == '__main__':
    unittest.main()
