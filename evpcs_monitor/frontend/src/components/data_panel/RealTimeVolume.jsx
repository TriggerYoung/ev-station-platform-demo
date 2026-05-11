// RealTimeVolume.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import axios from 'axios';

const RealTimeVolume = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null); // 保存 ECharts 实例
  const [realTimeData, setRealTimeData] = useState([]); // 存储实时数据
  const [startTime, setStartTime] = useState("2022-09-01T00:00:00Z"); // 用于记录最新的时间点

  // 初始化图表（仅执行一次）
  useEffect(() => {
    if (chartRef.current && !chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
      chartInstance.current.showLoading(); // 显示loading
      // 添加窗口 resize 监听
      const resizeHandler = () => chartInstance.current?.resize();
      window.addEventListener('resize', resizeHandler);
      return () => window.removeEventListener('resize', resizeHandler);
    }
  }, []);

  // 数据更新逻辑
  const fetchData = async () => {
    try {
      // 将最新的startTime传递给后端
      const response = await axios.get('/api/datapanel/realtime/volume', {
        params: { start: startTime } // 发送起始时间作为查询参数
      });

      if (response.data?.length > 0) {
        // 转换时间格式为时间戳（如果后端返回的是 ISO 字符串）
        const formattedData = response.data.map(item => [
          new Date(item.time).getTime(), // x 轴时间戳
          (item.value / 10000).toFixed(3) // y 轴值，除以 10000 后保留 3 位小数，单位为 "万千瓦时"
        ]);

        // 添加新的数据点到现有数据中
        setRealTimeData(prevData => {
          const updatedData = [...prevData, ...formattedData];
          // 每次将startTime向后移动1小时
          let newStartTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();
          setStartTime(newStartTime); // 更新为向后移动1小时后的时间
          // 保持最新的24小时数据，过滤掉过时的数据
          const maxDataLength = 24;
          const limitedData = updatedData.slice(-maxDataLength); // 获取最新的24条数据
          return limitedData; // 只返回最新的24个数据点
        });
      }
    } catch (error) {
      console.error('获取实时能耗失败:', error);
    }
  };

  // 定时请求数据，每5秒请求一次
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000); // 每5秒请求一次

    return () => clearInterval(intervalId); // 组件卸载时清除定时器
  }, [startTime]);

  // 配置图表
  useEffect(() => {
    if (chartInstance.current) {
      const option = {
        title: {
          text: '近24小时充电能耗',
          left: 'center',
          top: '5%',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: function (params) {
            // console.log(params);
            // 使用 startTime 来提取时间信息
            const date = new Date(startTime);
            const timeStr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours()}时`;
            return `时间: ${timeStr} <br/>能耗: ${params[0].value[1]} 万KWh`;
          },
          axisPointer: {
            animation: true
          }
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '5%',
          top: '20%',
          containLabel: true
        },
        xAxis: {
          type: 'time',
          boundaryGap: false, // 时间轴不留白
          axisLabel: {
            formatter: function (value) {
              const date = new Date(value);
              // 只在0时显示完整日期，其它时间只显示小时
              return date.getHours() === 0 ? `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}` : `${date.getHours()}时`;
            },
            color: '#fff'
          }
        },
        yAxis: {
          type: 'value',
          name: '能耗(万KWh)',
          nameTextStyle: {
            color: '#fff'  // 设置 y 轴名称的颜色为白色
          },
          fontSize: 12,
          axisLabel: {
            show: true,
            formatter: '{value}',
            color: '#fff'
          },
          splitLine: {
            show: true,
            lineStyle: {
              width: 0.5,
              type: 'dashed', // 使用虚线
              color: '#fff'
            }
          }
        },
        series: [
          {
            data: realTimeData,
            type: 'line',
            smooth: true,
            showSymbol: false,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgb(255, 158, 68)'
                },
                {
                  offset: 1,
                  color: 'rgb(255, 70, 131)'
                }
              ])
            }, // 增强可视化效果
            lineStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: 'rgb(252, 201, 192)' }, // 略带红色的渐变色
                { offset: 1, color: 'rgb(255, 69, 0)' }   // 略带橙色的渐变色
              ])
            },

          }
        ]
      };

      chartInstance.current.setOption(option, { notMerge: true });
      chartInstance.current.hideLoading(); // 隐藏loading
    }
  }, [realTimeData, startTime]);

  return <div ref={chartRef} style={{ height: '100%', width: '100%' }} />;
};

export default RealTimeVolume;
