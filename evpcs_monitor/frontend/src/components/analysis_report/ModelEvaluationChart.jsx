// ModelEvaluationChart.jsx

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import moment from "moment";

const ModelEvaluationChart = ({ metrics }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!metrics) return;
        console.log("模型效果预测评价指标：", metrics);

        const chart = echarts.init(chartRef.current);

        const option = {
            tooltip: {
                trigger: 'axis',
                formatter: (params) => {
                    const date = moment(params[0].axisValue).format("YYYY-MM-DD HH:mm");
                    return params.map(p => `${date}<br/>${p.seriesName}：${p.value.toFixed(2)} kWh<br/>`).join("");
                }
            },
            legend: {
                data: ['真实值', '预测值'],
                textStyle: { color: '#333'}
            },
            xAxis: {
                type: 'category',
                name: '时间',
                data: metrics.test_data.timestamps,
                axisLabel: {
                    formatter: (value) => moment(value).format("MM-DD HH:mm")
                }
            },
            yAxis: {
                type: 'value',
                name: '充电量(kWh)',
                min: 0,
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
                    type: "inside"
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
                    restore: { title: "还原" },
                }
            },
            series: [
                {
                    name: '真实值',
                    type: 'line',
                    data: metrics.test_data.y_true,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: { color: '#5470C6', width: 2 }
                },
                {
                    name: '预测值',
                    type: 'line',
                    data: metrics.test_data.y_pred,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: { color: '#EE6666', width: 2 }
                }
            ]
        };

        chart.setOption(option);
        return () => chart.dispose();
    }, [metrics]);

    return <div ref={chartRef} style={{ height: 400 }} />;
};

export default ModelEvaluationChart;