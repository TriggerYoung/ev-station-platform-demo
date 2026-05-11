import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Descriptions, InputNumber, Button, Popover } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const metricsHelpContent = (
    <div style={{ width: 600 }}>
        <p><strong>节点数</strong>: 网络中节点的总数，表示网络中各个元素或实体的数量。</p>
        <p><strong>连边数</strong>: 网络中边的总数，每条边代表节点之间的连接。</p>
        <p><strong>网络密度</strong>: 网络的实际边数与可能的最大边数之比。这个值越大，表示网络中节点之间的连接越紧密。</p>
        <p><strong>集聚系数</strong>: 衡量节点邻居之间的连接程度。这个指标反映了一个节点的邻居们之间是否也互相连接，值越高表示节点周围的邻居之间越紧密。</p>
        <p><strong>直径</strong>: 网络中任意两节点之间最短路径的最大值。它衡量了网络中最远的两个节点之间所需要的最少连接数，值越大表示网络的“跨度”越大。</p>
        <p><strong>度中心性</strong>: 衡量一个节点在网络中的重要性，通常通过节点的度数（即与该节点相连的边的数量）来表示。度中心性高的节点在网络中占据重要位置，能影响更多的节点。</p>
        <p><strong>度分布</strong>: 描述了网络中各个节点的度数分布情况。它反映了网络中不同度数的节点所占的比例，可以揭示网络中连接度较高节点的分布情况。</p>
    </div>
);


const NetworkMetricsDashboard = ({ metrics }) => {
    const chartRef1 = useRef(null);
    const chartRef2 = useRef(null);
    const [degreeCentralityThreshold, setDegreeCentralityThreshold] = useState(0);
    const [degreeThreshold, setDegreeThreshold] = useState(0);

    // 图表初始化方法
    const initChart = (chartRef, options) => {
        let chart = echarts.getInstanceByDom(chartRef.current);
        if (!chart) {
            chart = echarts.init(chartRef.current);
        }
        chart.setOption(options);
        return chart;
    };

    // Degree Centrality 图表刷新
    useEffect(() => {
        if (!metrics) return;

        // 处理 Degree Centrality 数据
        const filteredDegreeCentrality = Object.entries(metrics.degree_centrality)
            .filter(([_, value]) => value >= degreeCentralityThreshold)
            .map(([node, value]) => ({
                node,
                value: Number(value.toFixed(4)),
            }));

        // 动态颜色函数
        const getDegreeCentralityColor = (value) => {
            if (value > 0.8) return '#d9534f';
            if (value > 0.6) return '#f0ad4e';
            if (value > 0.4) return '#5bc0de';
            return '#5bc0de';
        };

        // Degree Centrality 图表配置
        const chart1 = initChart(chartRef1, {
            title: {
                text: `Degree Centrality (≥${degreeCentralityThreshold})`,
                left: 'center',
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            xAxis: {
                type: 'category',
                data: filteredDegreeCentrality.map(d => d.node),
                axisLabel: {
                    rotate: 45,
                    fontSize: 12,
                },
            },
            yAxis: {
                type: 'value',
                scale: true,
            },
            dataZoom: [{
                type: 'inside',
                start: 0,
                end: 100
            }],
            series: [{
                name: 'Degree Centrality',
                type: 'bar',
                data: filteredDegreeCentrality,
                itemStyle: {
                    color: params => getDegreeCentralityColor(params.value),
                },
            }],
            toolbox: {
                feature: {
                    saveAsImage: {
                        title: '保存图片',
                        type: 'png',
                        pixelRatio: 2,
                    },
                },
            },
        });

        return () => {
            chart1?.dispose();
        };
    }, [metrics, degreeCentralityThreshold]); // 仅依赖 Degree Centrality 阈值

    // Degree Distribution 图表刷新
    useEffect(() => {
        if (!metrics) return;

        // 处理 Degree 数据
        const filteredDegree = Object.entries(metrics.degree)
            .filter(([_, value]) => value >= degreeThreshold)
            .map(([node, value]) => ({
                node,
                value,
            }));

        // Degree Distribution 图表配置
        const chart2 = initChart(chartRef2, {
            title: {
                text: `Degree Distribution (≥${degreeThreshold})`,
                left: 'center',
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
            },
            xAxis: {
                type: 'category',
                data: filteredDegree.map(d => d.node),
                axisLabel: {
                    rotate: 45,
                    fontSize: 12,
                },
            },
            yAxis: {
                type: 'value',
                scale: true,
            },
            dataZoom: [{
                type: 'inside',
                start: 0,
                end: 100
            }],
            series: [{
                name: 'Degree Distribution',
                type: 'bar',
                data: filteredDegree,
                itemStyle: {
                    color: '#5bc0de',
                },
            }],
            toolbox: {
                feature: {
                    saveAsImage: {
                        title: '保存图片',
                        type: 'png',
                        pixelRatio: 2,
                    },
                },
            },
        });

        return () => {
            chart2?.dispose();
        };
    }, [metrics, degreeThreshold]); // 仅依赖 Degree 阈值

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>网络指标概览</h2>
                <Popover content={metricsHelpContent} title="指标解释" trigger="click">
                    <Button
                        type="text"
                        icon={<QuestionCircleOutlined />}
                        style={{ marginLeft: 8 }}
                    />
                </Popover>
            </div>

            {/* 使用 Descriptions 展示指标 */}
            <Descriptions bordered size="large" column={5}>
                <Descriptions.Item label={<b>节点数</b>}>{metrics?.total_nodes || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label={<b>连边数</b>}>{metrics?.total_edges || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label={<b>网络密度</b>}>
                    {metrics?.network_density?.toFixed(4) || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label={<b>集聚系数</b>}>
                    {metrics?.clustering_coefficient?.toFixed(4) || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label={<b>直径</b>}>{metrics?.diameter || 'N/A'}</Descriptions.Item>
            </Descriptions>

            {/* Degree Centrality 图表 */}
            <div style={{ marginTop: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>节点度中心性分布</h3>
                    <div>
                        <span style={{ marginRight: 8 }}>过滤阈值:</span>
                        <InputNumber
                            min={0}
                            max={1}
                            step={0.1}
                            value={degreeCentralityThreshold}
                            onChange={v => setDegreeCentralityThreshold(Number(v))}
                            style={{ width: 100 }}
                        />
                    </div>
                </div>
                <div ref={chartRef1} style={{ height: 420, marginTop: 16 }} />
            </div>

            {/* Degree 图表 */}
            <div style={{ marginTop: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>节点度分布</h3>
                    <div>
                        <span style={{ marginRight: 8 }}>过滤阈值:</span>
                        <InputNumber
                            min={0}
                            max={Math.max(...Object.values(metrics?.degree || {}))}
                            step={1}
                            value={degreeThreshold}
                            onChange={v => setDegreeThreshold(Number(v))}
                            style={{ width: 100 }}
                        />
                    </div>
                </div>
                <div ref={chartRef2} style={{ height: 420, marginTop: 16 }} />
            </div>
        </div>
    );
};

export default NetworkMetricsDashboard;
