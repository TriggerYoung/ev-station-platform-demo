// BarChart.jsx
import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

const BarChart = ({ hourlyMean }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!hourlyMean) return;

    const chart = echarts.init(chartRef.current);

    // 将hourlyMean对象转换为数组
    // hourlyMean形如: {0: 10.5, 1: 8.2, ..., 23: 12.0}
    let hours = Object.keys(hourlyMean)
      .map((h) => parseInt(h, 10))
      .sort((a, b) => a - b);
    // [0, 1, 2, ..., 23]

    // x轴显示 "0点", "1点", ...
    let dataAxis = hours.map((h) => `${h}点`);

    // 对应的数据
    let data = hours.map((hour) => hourlyMean[hour] || 0);

    let yMax = Math.max(...data) * 1.2;
    if (!isFinite(yMax)) yMax = 500;

    // 背景shadow数据
    let dataShadow = data.map(() => yMax);

    // 构造ECharts配置
    const option = {
      // title: {
      //   text: "每小时平均用电量",
      //   left: "center"
      // },
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          // params是数组, params[0]表示第一个系列
          if (!params[0]) return "";
          const idx = params[0].dataIndex;
          const hourLabel = dataAxis[idx];
          const val = data[idx].toFixed(2);
          return `时间：${hourLabel}<br/>平均用电量：${val} kWh`;
        }
      },
      xAxis: {
        type: "category",
        name: "时间",
        data: dataAxis,
        axisLabel: {
          color: "#999"
        },
        axisTick: {
          show: false
        },
        axisLine: {
          show: true
        }
      },
      yAxis: {
        type: "value",
        name: "充电量(kWh)",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#999"
        }
      },
      dataZoom: [
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
        }
      },
      series: [
        // 背景 shadow
        {
          type: "bar",
          itemStyle: {
            color: "rgba(0,0,0,0.05)"
          },
          barGap: "-100%", // overlay shadow
          barCategoryGap: "40%",
          data: dataShadow,
          animation: false
        },
        // 实际数据
        {
          type: "bar",
          showBackground: true,
          backgroundStyle: {
            color: "rgba(180, 180, 180, 0.2)"
          },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#83bff6" },
              { offset: 0.5, color: "#188df0" },
              { offset: 1, color: "#188df0" }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#2378f7" },
                { offset: 0.7, color: "#2378f7" },
                { offset: 1, color: "#83bff6" }
              ])
            }
          },
          data: data
        }
      ]
    };

    chart.setOption(option);

    // 点击柱子 -> dataZoom
    const zoomSize = 6;
    chart.on("click", function (params) {
      const idx = params.dataIndex;
      chart.dispatchAction({
        type: "dataZoom",
        startValue: dataAxis[Math.max(idx - zoomSize / 2, 0)],
        endValue: dataAxis[Math.min(idx + zoomSize / 2, dataAxis.length - 1)]
      });
    });

    return () => {
      chart.dispose();
    };
  }, [hourlyMean]);

  return <div ref={chartRef} style={{ height: 400 }} />;
};

export default BarChart;
