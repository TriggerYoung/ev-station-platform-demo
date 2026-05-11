// LineChart.jsx
import React, { useEffect, useRef } from "react";
import { Card } from "antd";
import * as echarts from "echarts";
import moment from "moment";

// 映射字段中文描述
const fieldMap = {
    volume: "充电量 (kWh)", occupancy: "充电桩占用数 (个)",
    duration: "充电时长 (小时)", e_price: "用电费用 (元)", s_price: "服务费用 (元)"
};

// 颜色映射
const colorMap = {
    volume: "#5B8FF9",      // 蓝色
    occupancy: "#61DDAA",   // 绿色
    duration: "#65789B",    // 灰色
    e_price: "#F6BD16",     // 黄色
    s_price: "#7262FD"      // 紫色
};

const LineChart = ({ field, data }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current || data.length === 0) return;
        const chart = echarts.init(chartRef.current);

        // 处理数据，按 station_id 进行分组
        const groupedData = {};
        data.forEach(item => {
            if (!groupedData[item.station_id]) {
                groupedData[item.station_id] = [];
            }
            groupedData[item.station_id].push({
                time: moment(item.time).format("YYYY-MM-DD HH:mm"), // 统一时间格式
                value: item[field]
            });
        });

        // 生成 ECharts series 数据
        const series = Object.keys(groupedData).map(stationId => ({
            name: `站点 ${stationId}`,
            type: "line",
            smooth: true,
            data: groupedData[stationId].map(d => [d.time, d.value]),
            lineStyle: { width: 1.5, color: colorMap[field] },  // 细线条
            showSymbol: false,  // 取消散点
        }));

        const option = {
            tooltip: { trigger: "axis" },
            xAxis: {
                type: "category",
                data: [...new Set(data.map(item => moment(item.time).format("YYYY-MM-DD HH:mm")))], // 确保时间唯一
                axisLabel: {
                    rotate: 30,
                    formatter: value => moment(value).format("MM-DD HH:mm"), // 只显示 月-日 时:分
                    hideOverlap: true, // 自动隐藏过于密集的标签
                }
            },
            yAxis: { type: "value", name: fieldMap[field] },
            legend: { top: 0 },
            grid: { left: "5%", right: "5%", bottom: "15%", containLabel: true },
            dataZoom: [
                {
                    type: "slider",   // 拖拽缩放时间范围
                    start: 0,
                    end: 100,
                    height: 20,
                    bottom: 5
                },
                {
                    type: "inside",   // 支持鼠标滚轮缩放
                }
            ],
            series
        };

        chart.setOption(option);
        return () => chart.dispose();  // 组件卸载时销毁 ECharts 实例
    }, [data, field]);

    return (
        <Card key={field} title={fieldMap[field]} style={{ marginBottom: "16px" }}>
            <div ref={chartRef} style={{ width: "100%", height: "300px" }} />
        </Card>
    );
};

export default LineChart;
