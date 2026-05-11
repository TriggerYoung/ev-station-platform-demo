import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import moment from "moment";

const FutureForecastChart = ({ forecast }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;
        const chart = echarts.init(chartRef.current);
        const formatTime = (t) => moment(t).valueOf();
        // 预测数据
        const forecastData = forecast.times.slice(-24).map((t, i) => ({
            time: formatTime(t),
            value: Math.max(forecast.yhat[i + forecast.yhat.length - 24], 0),
            type: "预测数据"
        }));
        // 置信区间上界
        const upperBound = forecast.times.slice(-24).map((t, i) => ({
            time: formatTime(t),
            value: Math.max(forecast.yhat_upper[i + forecast.yhat_upper.length - 24], 0),
            type: "预测上限"
        }));
        // 置信区间下界
        const lowerBound = forecast.times.slice(-24).map((t, i) => ({
            time: formatTime(t),
            value: Math.max(forecast.yhat_lower[i + forecast.yhat_lower.length - 24], 0),
            type: "预测下限"
        }));
        const option = {
            // title: {
            //     text: '未来24小时用电量预测结果',
            //     left: 'center',
            // },
            tooltip: {
                trigger: 'axis',
                formatter: (params) => {
                    const date = moment(params[0].axisValue).format("YYYY-MM-DD HH:mm");
                    return params.map(p => `${date}<br/>${p.marker} ${p.seriesName}: ${p.value[1].toFixed(2)} kWh<br/>`).join("");
                }
            },
            legend: {
                data: ["预测数据", "预测区间"],
                top: 20
            },
            xAxis: {
                type: "time",
                name: "时间",
                axisLabel: {
                    formatter: (value) => moment(value).format("MM-DD HH:mm")
                }
            },
            yAxis: {
                type: "value",
                name: "充电量(kWh)",
                min: 0
            },
            dataZoom: [
                {
                    type: "slider",
                    start: 0,
                    end: 100,
                    height: 20,
                    bottom: 10,
                    show: true,
                },
                {
                    type: "inside",   // 支持鼠标滚轮缩放
                }
            ],
            toolbox: {
                feature: {
                    saveAsImage: {
                        show: true,
                        type: "png",
                        title: "保存为png图片",
                    },
                    magicType: { type: ['line', 'bar'], title: { line: '切换为折线图', bar: '切换为柱状图' } },
                    restore: {title: "还原"},
                }
            },
            series: [
                {
                    name: "预测数据",
                    type: "line",
                    data: forecastData.map(d => [d.time, d.value]),
                    smooth: true,
                    color: "#ff4d4f",
                    lineStyle: {
                        type: "dashed"
                    },
                    showSymbol: false
                },
                {
                    name: "预测区间",
                    type: "line",
                    data: [
                        ...upperBound.map(d => [d.time, d.value]),
                        ...lowerBound.reverse().map(d => [d.time, d.value])
                    ],
                    lineStyle: { opacity: 0 },
                    areaStyle: {
                        color: "#ff4d4f",
                        opacity: 0.1
                    },
                    showSymbol: false
                }
            ],
        };

        chart.setOption(option);
        return () => {
            chart.dispose();
        };
    }, [forecast]);

    return <div ref={chartRef} style={{ height: 400 }} />;
};

export default FutureForecastChart;
