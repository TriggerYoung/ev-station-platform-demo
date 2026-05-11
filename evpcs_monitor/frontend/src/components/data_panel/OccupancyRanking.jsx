import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import axios from 'axios';
import { Pagination } from 'antd';  // 引入Ant Design的分页组件

const OccupancyRanking = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null); // 保存 ECharts 实例
    const [rankingData, setRankingData] = useState([]); // 存储排名数据
    const [startTime, setStartTime] = useState("2022-09-01T00:00:00Z"); // 最新的时间点
    const [currentPage, setCurrentPage] = useState(1); // 当前分页
    const pageSize = 10; // 每页显示5条

    // 初始化图表（仅执行一次）
    useEffect(() => {
        if (chartRef.current && !chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current);
            chartInstance.current.showLoading(); // 显示loading
            const resizeHandler = () => chartInstance.current?.resize();
            window.addEventListener('resize', resizeHandler);
            return () => window.removeEventListener('resize', resizeHandler);
        }
    }, []);

    // 数据更新逻辑
    const fetchData = async () => {
        try {
            const response = await axios.get('/api/datapanel/realtime/occupancy_ranking', {
                params: { start: startTime } // 向后端发送时间参数
            });

            if (response.data?.occupancy?.length > 0) {
                // 将数据转换为图表所需格式
                const formattedData = response.data.occupancy.map(item => ({
                    station_id: item.station_id,
                    occupancy_rate: item.occupancy_rate * 100 // 转换为百分比
                }));

                // 更新排名数据并设置新的时间点
                setRankingData(formattedData);
                const newStartTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString(); // 向后推1小时
                setStartTime(newStartTime);
            }
        } catch (error) {
            console.error('获取占用率排名失败:', error);
        }
    };

    // 定时请求数据，每10秒请求一次
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchData();
        }, 10000); // 每10秒请求一次数据

        return () => clearInterval(intervalId); // 组件卸载时清除定时器
    }, [startTime]);

    // 获取当前分页的数据
    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = currentPage * pageSize;
        return rankingData.slice(startIndex, endIndex);
    };

    // 配置图表
    useEffect(() => {
        if (chartInstance.current && rankingData.length > 0) {
            const currentData = getCurrentPageData();

            const option = {
                title: {
                    text: `近一小时内充电桩占用率排名前50的站点`,
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
                        return `站点ID: ${params[0].name} <br/>占用率: ${params[0].value.toFixed(2)}%`;
                    }
                },
                grid: {
                    left: '3%',
                    right: '5%',
                    bottom: '2%',
                    top: '20%',
                    containLabel: true
                },
                xAxis: {
                    type: 'value',
                    nameStyle: {
                        color: '#fff'
                    },
                    min: 0,
                    max: 100,
                    axisLabel: {
                        formatter: '{value}%', // 显示百分比
                        color: '#fff'
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            width: 0.5,
                            type: 'dashed',
                            color: '#fff'
                        }
                    }
                },
                yAxis: {
                    type: 'category',
                    data: currentData.map(item => item.station_id),
                    axisLabel: {
                        color: '#fff',
                        formatter: (value) => value,  // 显示每个站点ID
                        showMaxLabel: true,  // 显示所有ID
                        fontSize: 10,  // 增加字体大小使得ID更容易识别
                        interval: 0,  // 显示所有ID
                    }
                },
                series: [
                    {
                        data: currentData.map(item => item.occupancy_rate),
                        type: 'bar',
                        barWidth: '90%', // 增加柱状图的宽度
                        showBackground: true,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                { offset: 0, color: 'rgb(85, 158, 255)' },
                                { offset: 1, color: 'rgb(255, 85, 0)' }
                            ])
                        },
                    }
                ]
            };

            chartInstance.current.setOption(option, { notMerge: true });
            chartInstance.current.hideLoading(); // 隐藏loading
        }
    }, [rankingData, currentPage]);

    // 分页控制
    const onPageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 图表区域 */}
            <div ref={chartRef} style={{ flex: 9, width: '100%' }} />

            {/* 分页区域 */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={rankingData.length}
                    onChange={onPageChange}
                    showSizeChanger={false} // 禁用改变每页显示条数
                />
            </div>
        </div>

    );
};

export default OccupancyRanking;
