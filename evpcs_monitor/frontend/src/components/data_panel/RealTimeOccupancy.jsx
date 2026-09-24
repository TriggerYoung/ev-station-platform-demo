// RealTimeOccupancy.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import axios from 'axios';

const RealTimeOccupancy = ({ total_piles }) => {
  // console.log("total_piles", total_piles);
  const chartRef = useRef(null);
  const chartInstance = useRef(null); // 保存 ECharts 实例
  const [occupancyRate, setOccupancyRate] = useState(0); // 存储实时占用率
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
      const response = await axios.get('/api/datapanel/realtime/occupancy', {
        params: { start: startTime } // 发送起始时间作为查询参数
      });

      if (response.data?.length > 0) {
        // 获取最新的占用率数据
        const item = response.data[response.data.length - 1]; // 假设数据按时间升序排列
        // 计算占用率，避免除以0
        const rate = total_piles > 0 ? ((item.value / total_piles) * 100).toFixed(2) : 0;

        // 更新实时占用率
        setOccupancyRate(rate);

        // 每次将startTime向后移动1小时
        let newStartTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();
        setStartTime(newStartTime); // 更新为向后移动1小时后的时间
      }
    } catch (error) {
      console.error('获取实时占用率失败:', error);
    }
  };

  // 定时请求数据，每5秒请求一次
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000); // 每5秒请求一次

    return () => clearInterval(intervalId); // 组件卸载时清除定时器
  }, [startTime]);

  // 配置仪表盘
  useEffect(() => {
    if (chartInstance.current) {
      const option = {
        title: {
          text: '近一小时内充电桩总占用率',
          left: 'center',
          top: '5%',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff', // 标题颜色
          }
        },
        tooltip: {
          formatter: function (params) {
            // 使用 startTime 来提取时间信息
            const date = new Date(startTime);
            const timeStr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours()}时`;
            return `时间: ${timeStr} <br/>占用率: ${params.value}%`;
          },
        },
        series: [
          {
            name: null, // 移除“占用率”文本
            type: 'gauge',
            center: ['50%', '50%'], // 仪表盘居中
            min: 0,
            max: 100,
            splitNumber: 5,
            radius: '70%',
            pointer: {
              width: 5,
              length: '60%',
              color: 'rgba(255, 255, 255, 0.6)',
            },
            axisLine: {
              lineStyle: {
                width: 10,
                color: [
                  [0.2, 'rgb(60, 141, 188)'], // 蓝色
                  [0.5, 'rgb(51, 204, 51)'], // 绿色
                  [0.8, 'rgb(255, 236, 61)'], // 黄色
                  [1, 'rgb(255, 69, 0)'], // 红色
                ],
              },
            },
            axisTick: {
              splitNumber: 10,
              length: 8,
              lineStyle: {
                color: '#fff',
              },
            },
            axisLabel: {
              fontSize: 10,
              color: '#fff',
            },
            splitLine: {
              length: 12,
              lineStyle: {
                color: '#fff',
              },
            },
            detail: {
              formatter: '{value}%', // 显示占用率数值
              fontSize: 28,
              color: '#fff', // 白色
              offsetCenter: ['0%', '85%'], // 将数值放在仪表盘的下方
            },
            data: [{ value: occupancyRate }], // 只显示占用率数值
          },
        ],
      };

      chartInstance.current.setOption(option, { notMerge: true });
      chartInstance.current.hideLoading(); // 隐藏loading
    }
  }, [occupancyRate, startTime]); // 每次占用率和startTime变化时更新图表


  return <div ref={chartRef} style={{ height: '100%', width: '100%' }} />;
};

export default RealTimeOccupancy;
