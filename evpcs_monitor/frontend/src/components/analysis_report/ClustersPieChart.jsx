// ClustersPieChart.jsx
import React, { useRef, useEffect } from "react";
import * as echarts from "echarts";

const ClustersPieChart = ({ clustersData }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;
        if (!clustersData || clustersData.length === 0) return;

        const chart = echarts.init(chartRef.current);

        // 将clustersData转换为ECharts需要的格式
        const pieData = clustersData.map((item, index) => {
            // 用正则匹配出主要时间段
            let timeRangeMatch = item.description.match(/主要时间段：([^）]+)/);
            let timeRange = timeRangeMatch ? timeRangeMatch[1] : "未知时段";

            return {
                // 在 name 中包含模式编号 + 主要时间段
                name: `模式${index + 1}：(${timeRange})`,
                value: item.percentage,
                description: item.description
            };
        });

        const option = {
            tooltip: {
                trigger: "item",
                formatter: (params) => {
                    return `${params.marker} ${params.name}<br/>
                        占比：${params.value.toFixed(1)}%<br/>
                        ${pieData[params.dataIndex].description}`;
                },
            },
            legend: {
                orient: "vertical",
                left: "left",
            },
            toolbox: {
                feature: {
                    saveAsImage: {
                        show: true,
                        type: "png",
                        title: "保存为png图片",
                    },
                }
            },
            series: [
                {
                    name: "clusters",
                    type: "pie",
                    // 设置环形
                    radius: ["40%", "70%"],
                    center: ["50%", "50%"],
                    avoidLabelOverlap: false,
                    data: pieData,
                    // 高亮样式
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: "rgba(0, 0, 0, 0.5)",
                        },
                    },
                    label: {
                        show: true,
                        position: 'outside',  // 标签显示在外部
                    },
                    labelLine: {
                        show: true,  // 显示指示线
                        length: 20,  // 指示线长度
                        lineStyle: {
                            color: '#000',  // 设置指示线颜色
                        },
                    },
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                },
            ],
        };

        chart.setOption(option);

        // 组件卸载时销毁图表实例
        return () => {
            chart.dispose();
        };
    }, [clustersData]);

    return <div ref={chartRef} style={{ height: 400 }} />;
};

export default ClustersPieChart;
