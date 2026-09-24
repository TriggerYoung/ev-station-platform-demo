import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import axios from 'axios';

const PriceTrend = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null); // 保存 ECharts 实例
    const [priceData, setPriceData] = useState([]);
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
    const fetchPriceData = async () => {
        try {
            const response = await axios.get('/api/datapanel/realtime/price', {
                params: { start: startTime }
            });

            if (response.data?.length > 0) {
                const formattedData = response.data.map(item => [
                    new Date(item.time).getTime(), // x轴时间戳
                    item.service_price.toFixed(3), // 服务价格
                    item.electric_price.toFixed(3) // 电价
                ]);

                // 更新价格数据
                setPriceData(prevData => {
                    const updatedData = [...prevData, ...formattedData];
                    let newStartTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();
                    setStartTime(newStartTime); // 更新为向后移动1小时后的时间

                    // 保持最新的24小时数据
                    const maxDataLength = 24;
                    const limitedData = updatedData.slice(-maxDataLength); // 获取最新的24条数据
                    return limitedData; // 返回最新的24个数据点
                });
            }
        } catch (error) {
            console.error('获取实时价格数据失败:', error);
        }
    };

    // 定时请求数据，每5秒请求一次
    useEffect(() => {
        fetchPriceData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchPriceData();
        }, 5000); // 每5秒请求一次

        return () => clearInterval(intervalId);
    }, [startTime]);

    // 配置图表
    useEffect(() => {
        if (chartInstance.current) {
            const option = {
                title: {
                    text: '近24小时充电平均价格',
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
                        const date = new Date(params[0].axisValue);
                        const timeStr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours()}时`;
                        return `时间: ${timeStr} <br/>服务价格: ${params[0].value[1]} 元/kWh <br/>电价: ${params[1].value[1]} 元/kWh`;
                    }
                },
                grid: {
                    left: '5%',  // 增加左侧空白
                    right: '5%',  // 增加右侧空白
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
                yAxis: [
                    { 
                        type: 'value', 
                        name: '服务价格(元/kWh)', 
                        position: 'left',
                        axisLine: { show: true, lineStyle: { color: 'rgb(0, 188, 212)' } },
                        axisLabel: { color: '#fff' },
                        splitLine: { show: true, lineStyle: { width: 0.5, color: '#fff', type: 'dashed' } },    
                    },
                    { 
                        type: 'value', 
                        name: '电价(元/kWh)', 
                        position: 'right',
                        axisLine: { show: true, lineStyle: { color: 'rgb(255, 99, 71)' } },
                        axisLabel: { color: '#fff' },
                        splitLine: { show: false },
                    },
                ],
                series: [
                    {
                        name: '服务价格',
                        type: 'line',
                        data: priceData.map(item => [item[0], item[1]]),
                        yAxisIndex: 0,
                        itemStyle: { color: 'rgb(0, 188, 212)' },
                    },
                    {
                        name: '电价',
                        type: 'line',
                        data: priceData.map(item => [item[0], item[2]]),
                        yAxisIndex: 1,
                        itemStyle: { color: 'rgb(255, 99, 71)' },
                    },
                ]
            };
            echarts.init(chartRef.current).setOption(option);
            chartInstance.current.hideLoading(); // 隐藏loading
        }
    }, [priceData, startTime]);

    return <div ref={chartRef} style={{ height: '100%', width: '100%' }} />;
};

export default PriceTrend;
