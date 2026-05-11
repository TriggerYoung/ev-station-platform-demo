// LineChart.jsx

import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import moment from "moment";

// 辅助函数：合并相邻变点
const filterAdjacentChanges = (timestamps, interval) => {
    return timestamps.filter((ts, index) => {
        if (index === 0) return true;
        return ts - timestamps[index - 1] > interval;
    });
}

const LineChart = ({ aggregatedTimes, aggregatedVolumes, selectedTimeUnit, changepoints }) => {
    const chartRef = useRef(null);
    useEffect(() => {
        if (!chartRef.current) return;

        const chart = echarts.init(chartRef.current);
        let option;

        if (aggregatedTimes && aggregatedVolumes) {
            const formatTime = (t) => moment(t).valueOf();
            // 变点
            const filteredChangepoints = filterAdjacentChanges(
                changepoints.map(t => moment(t).valueOf()),
                3600 * 1000 * 6  // 6小时内的相邻变点合并
            );

            // 历史数据
            const historyData = aggregatedTimes.map((t, i) => ({
                time: formatTime(t),
                value: aggregatedVolumes[i],
                type: "历史数据"
            }));
            

            // 图表配置
            option = {
                tooltip: {
                    trigger: "axis",
                    formatter: (params) => {
                        const date = moment(params[0].axisValue).format("YYYY-MM-DD HH:mm");
                        return params.map(p => `${date}<br/>${p.marker} ${p.seriesName}: ${p.value[1].toFixed(2)} kWh<br/>`).join("");
                    }
                },
                legend: {
                    data: ["历史数据"],
                    top: 20
                },
                grid: {
                    top: 80,
                    left: 50,
                    right: 50,
                    bottom: 40,
                    containLabel: true
                },
                xAxis: {
                    type: "time",
                    axisLabel: {
                        formatter: (value) => moment(value).format(
                            selectedTimeUnit === "hour" ? "MM-DD HH:mm" :
                                selectedTimeUnit === "day" ? "MM-DD" :
                                    selectedTimeUnit === "month" ? "MM-YYYY" : "YYYY"
                        )
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
                        magicType: { type: ['line', 'bar'] , title: { line: '切换为折线图', bar: '切换为柱状图' } },
                        restore: {title: "还原"},
                    }
                },
                series: [
                    {
                        name: "历史数据",
                        type: 'line',
                        data: historyData.map(d => [d.time, d.value]),
                        smooth: true,
                        color: "#1890ff",
                        showSymbol: false,
                        markLine: selectedTimeUnit === "hour" ? {  // 仅在按小时汇总时显示markLine
                            data: filteredChangepoints.map(time => ({
                                xAxis: time,
                                lineStyle: { color: '#ff0000', type: 'dashed', width: 1 },
                                label: { show: false }
                            })),
                            symbol: 'none'
                        } : undefined
                    }
                ]
            };
        } else {
            option = {
                title: { text: "暂无数据", left: "center", top: "center" }
            };
        }

        chart.setOption(option);
        return () => chart.dispose();
    }, [aggregatedTimes, aggregatedVolumes, selectedTimeUnit, changepoints]);

    return <div ref={chartRef} style={{ height: 400 }} />;
};

export default LineChart;


// import React, { useEffect, useRef } from "react";
// import * as echarts from "echarts";
// import moment from "moment";

// // 辅助函数：合并相邻变点
// const filterAdjacentChanges = (timestamps, interval) => {
//     return timestamps.filter((ts, index) => {
//         if (index === 0) return true;
//         return ts - timestamps[index - 1] > interval;
//     });
// }

// const LineChart = ({ aggregatedTimes, aggregatedVolumes, selectedTimeUnit, forecast, changepoints }) => {
//     const chartRef = useRef(null);
//     useEffect(() => {
//         if (!chartRef.current) return;

//         const chart = echarts.init(chartRef.current);
//         let option;

//         if (aggregatedTimes && aggregatedVolumes && forecast) {
//             const formatTime = (t) => moment(t).valueOf();
//             // 变点
//             const filteredChangepoints = filterAdjacentChanges(
//                 changepoints.map(t => moment(t).valueOf()),
//                 3600 * 1000 * 8  // 8小时内的相邻变点合并
//             );

//             // 历史数据
//             const historyData = aggregatedTimes.map((t, i) => ({
//                 time: formatTime(t),
//                 value: aggregatedVolumes[i],
//                 type: "历史数据"
//             }));

//             // 预测数据
//             const forecastData = forecast.times.slice(-24).map((t, i) => ({
//                 time: formatTime(t),
//                 value: Math.max(forecast.yhat[i + forecast.yhat.length - 24], 0),
//                 type: "预测数据"
//             }));
//             // 置信区间上界
//             const upperBound = forecast.times.slice(-24).map((t, i) => ({
//                 time: formatTime(t),
//                 value: Math.max(forecast.yhat_upper[i + forecast.yhat_upper.length - 24], 0),
//                 type: "预测上限"
//             }));
//             // 置信区间下界
//             const lowerBound = forecast.times.slice(-24).map((t, i) => ({
//                 time: formatTime(t),
//                 value: Math.max(forecast.yhat_lower[i + forecast.yhat_lower.length - 24], 0),
//                 type: "预测下限"
//             }));

//             // 图表配置
//             option = {
//                 tooltip: {
//                     trigger: "axis",
//                     formatter: (params) => {
//                         const date = moment(params[0].axisValue).format("YYYY-MM-DD HH:mm");
//                         return params.map(p => `${date}<br/>${p.marker} ${p.seriesName}: ${p.value[1].toFixed(2)} kWh<br/>`).join("");
//                     }
//                 },
//                 legend: {
//                     data: ["历史数据", "预测数据", "置信区间"],
//                     top: 20
//                 },
//                 grid: {
//                     top: 80,
//                     left: 50,
//                     right: 50,
//                     bottom: 40,
//                     containLabel: true
//                 },
//                 xAxis: {
//                     type: "time",
//                     axisLabel: {
//                         formatter: (value) => moment(value).format(
//                             selectedTimeUnit === "hour" ? "MM-DD HH:mm" :
//                                 selectedTimeUnit === "day" ? "MM-DD" :
//                                     selectedTimeUnit === "month" ? "MM-YYYY" : "YYYY"
//                         )
//                     }
//                 },
//                 yAxis: {
//                     type: "value",
//                     name: "充电量(kWh)",
//                     min: 0
//                 },
//                 dataZoom: [
//                     {
//                         type: "slider",
//                         start: 0,
//                         end: 100,
//                         height: 20,
//                         bottom: 10,
//                         show: true,
//                     },
//                     {
//                         type: "inside",   // 支持鼠标滚轮缩放
//                     }
//                 ],
//                 toolbox: {
//                     feature: {
//                         saveAsImage: {
//                             show: true,
//                             type: "png",
//                             title: "保存为png图片",
//                         },
//                         magicType: { type: ['line', 'bar'] , title: { line: '切换为折线图', bar: '切换为柱状图' } },
//                         restore: {title: "还原"},
//                     }
//                 },
//                 series: [
//                     {
//                         name: "历史数据",
//                         type: 'line',
//                         data: historyData.map(d => [d.time, d.value]),
//                         smooth: true,
//                         color: "#1890ff",
//                         showSymbol: false,
//                         markLine: selectedTimeUnit === "hour" ? {  // 仅在按小时汇总时显示markLine
//                             data: filteredChangepoints.map(time => ({
//                                 xAxis: time,
//                                 lineStyle: { color: '#ff0000', type: 'dashed', width: 1 },
//                                 label: { show: false }
//                             })),
//                             symbol: 'none'
//                         } : undefined
//                     },
//                     {
//                         name: "预测数据",
//                         type: "line",
//                         data: forecastData.map(d => [d.time, d.value]),
//                         smooth: true,
//                         color: "#ff4d4f",
//                         lineStyle: {
//                             type: "dashed"
//                         },
//                         showSymbol: false
//                     },
//                     {
//                         name: "置信区间",
//                         type: "line",
//                         data: [
//                             ...upperBound.map(d => [d.time, d.value]),
//                             ...lowerBound.reverse().map(d => [d.time, d.value])
//                         ],
//                         lineStyle: { opacity: 0 },
//                         areaStyle: {
//                             color: "#ff4d4f",
//                             opacity: 0.1
//                         },
//                         showSymbol: false
//                     }
//                 ]
//             };
//         } else {
//             option = {
//                 title: { text: "暂无数据", left: "center", top: "center" }
//             };
//         }

//         chart.setOption(option);
//         return () => chart.dispose();
//     }, [aggregatedTimes, aggregatedVolumes, selectedTimeUnit, forecast, changepoints]);

//     return <div ref={chartRef} style={{ height: 400 }} />;
// };

// export default LineChart;