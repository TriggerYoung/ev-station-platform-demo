// NetworkAnalysis.jsx
import React, { useEffect, useState } from 'react';
import { Splitter, Card, TreeSelect, Spin, List, Collapse, Tag } from 'antd';
import axios from 'axios';
import MarkerMap from './MarkerMap'; // 导入地图组件
import NetworkMetricsDashboard from './NetworkMetricsDashboard'; // 导入网络指标面板组件
import withAuth from "../withAuth";

const { Panel } = Collapse;

const COMMUNITY_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#FF9999', '#77DD77', '#AEC6CF', '#FFB347', '#B39EB5'
];

const NetworkAnalysis = () => {
    const [districtTree, setDistrictTree] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState('shenzhen');
    const [districtCenter, setDistrictCenter] = useState(null);
    const [communityData, setCommunityData] = useState([]);
    const [stations, setStations] = useState([]);
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);
    const [networkMetrics, setNetworkMetrics] = useState(null);

    // 获取充电站数据
    useEffect(() => {
        axios.get('/api/locations')
            .then(response => {
                setStations(response.data);
            })
            .catch(error => {
                console.error('获取充电站数据失败:', error);
            });
    }, []);

    // 获取行政区数据
    useEffect(() => {
        axios.get('/api/locations/districts')
            .then(response => {
                const districts = response.data;
                const totalStationCount = districts.reduce((total, district) => total + district.station_count, 0);
                const districtTree = {
                    title: `深圳市（${totalStationCount}站）`,
                    value: 'shenzhen',
                    key: 'shenzhen',
                    children: districts.map(district => ({
                        title: `${district.district_name}（${district.station_count}站）`,
                        value: district.adcode,
                        key: district.adcode,
                        center: { lat: district.latitude, lng: district.longitude },
                    })),
                };
                setDistrictTree(districtTree);
            })
            .catch(error => {
                console.error('获取行政区数据失败:', error);
            });
    }, []);

    // 处理行政区选择
    const handleDistrictChange = (value, label, extra) => {
        if (extra.triggerNode) {
            const center = extra.triggerNode.props.center;
            setSelectedDistrict(value);
            setDistrictCenter(center);
            if (value === 'shenzhen') {
                setCommunityData([]);
            } else {
                loadCommunityData(value);
            }
        }
    };

    // 处理社群数据
    const processCommunityData = (data) => {
        return Object.keys(data).map((key, index) => ({
            community_id: key,
            color: COMMUNITY_COLORS[index % COMMUNITY_COLORS.length],
            ...data[key],
        }));
    };

    // 加载社群数据
    const loadCommunityData = (districtCode) => {
        axios.get(`/api/locations/community/${districtCode}`)
            .then(response => {
                const processedData = processCommunityData(response.data);
                console.log('处理后的社群数据:', processedData);
                setCommunityData(processedData);
            })
            .catch(error => {
                console.error('获取社群数据失败:', error);
            });
    };
    
    // 处理社群点击事件
    const handleCommunityClick = (community) => {
        setSelectedCommunity(community);
        fetchNetworkMetrics(community);
    };

    // 获取网络指标
    const fetchNetworkMetrics = (community) => {
        setLoadingMetrics(true);
        const metrics = community.metrics;
        setNetworkMetrics(metrics);
        setLoadingMetrics(false);
    };

    // 过滤站点数据
    const filteredStations = !selectedDistrict || selectedDistrict === 'shenzhen'
        ? stations
        : stations.filter(station => station.adcode === selectedDistrict);

    return (
        <div>
            <Splitter style={{ height: '100vh', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
                <Splitter.Panel collapsible defaultSize={300} max={500}>
                    <Card title="选择行政区" bordered={false}>
                        <TreeSelect
                            style={{ width: '100%' }}
                            value={selectedDistrict}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            placeholder="选择行政区"
                            treeDefaultExpandAll
                            treeData={districtTree ? [districtTree] : []}
                            onChange={handleDistrictChange}
                            treeNodeFilterProp="title"
                        />
                    </Card>

                    {selectedDistrict && (
                        <Card title="社群数据" style={{ marginTop: 20 }}>
                            <Collapse>
                                {communityData.map((community) => (
                                    <Panel
                                        key={community.community_id}
                                        header={
                                            <span style={{
                                                color: community.color,
                                                fontWeight: selectedCommunity?.community_id === community.community_id ? 'bold' : 'normal',
                                                backgroundColor: selectedCommunity?.community_id === community.community_id ? '#f0f0f0' : 'transparent',
                                                padding: '5px',
                                                borderRadius: '4px'
                                            }}>
                                                社群 {community.community_id}（{community.stations.length} 站）
                                            </span>
                                        }
                                        onClick={() => handleCommunityClick(community)}
                                    >
                                        <List
                                            itemLayout="horizontal"
                                            dataSource={community.stations}
                                            renderItem={(station) => (
                                                <List.Item>
                                                    <List.Item.Meta
                                                        title={`站点ID: ${station.station_id} 地址: ${station.address}`}
                                                        description={`坐标: (${station.latitude}, ${station.longitude}) 桩数: ${station.pile_count}`}
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                    </Panel>
                                ))}
                            </Collapse>
                        </Card>
                    )}
                </Splitter.Panel>

                <Splitter.Panel>
                    <Splitter layout="vertical">
                        <Splitter.Panel>
                            <Card bordered={false}>
                                <MarkerMap
                                    center={districtCenter}
                                    stations={filteredStations}
                                    community={selectedCommunity}
                                    communityColor={selectedCommunity?.color}
                                />
                            </Card>
                        </Splitter.Panel>

                        <Splitter.Panel defaultSize={300} max={800}>
                            <Card title="网络拓扑分析">
                                {loadingMetrics ? (
                                    <Spin tip="正在计算网络指标..." size="large" />
                                ) : (
                                    networkMetrics && <NetworkMetricsDashboard metrics={networkMetrics} />
                                )}
                            </Card>
                        </Splitter.Panel>
                    </Splitter>
                </Splitter.Panel>
            </Splitter>
        </div>
    );
};

export default withAuth(NetworkAnalysis);
