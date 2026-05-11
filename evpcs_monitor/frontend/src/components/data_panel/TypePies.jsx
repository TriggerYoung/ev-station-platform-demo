import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const TypePies = ({ stations }) => {  // 接收stations作为props
    const chartRef = useRef(null);

    useEffect(() => {
        const myChart = echarts.init(chartRef.current);

        // 统计充电站停车类型占比（免费和收费）
        const parkingTypeCounts = stations.reduce((acc, station) => {
            const parkingType = station.has_parking_fee === 1 ? '收费' : '免费';
            acc[parkingType] = (acc[parkingType] || 0) + 1;
            return acc;
        }, {});

        // 统计充电桩类型占比（交流和直流）
        const pileTypeCounts = stations.reduce((acc, station) => {
            acc['交流'] = (acc['交流'] || 0) + Number(station.ac_piles_count);
            acc['直流'] = (acc['直流'] || 0) + Number(station.dc_piles_count);
            return acc;
        }, {});

        const option = {
            title: {
                text: '充电站停车收费类型与充电桩类型占比',
                left: 'center',
                top: '5%',
                textStyle: {
                    color: '#fff',  // 设置标题颜色
                    fontSize: 16,  // 设置标题字体大小
                    fontWeight: 'bold',  // 设置标题字体加粗
                },
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)',
            },
            grid: {
                left: '5%',
                right: '5%',
                top: '15%',
                bottom: '15%',
                containLabel: true,
            },
            series: [
                {
                    name: '充电站停车类型',
                    type: 'pie',
                    radius: ['30%', '50%'],
                    avoidLabelOverlap: false,
                    center: ['30%', '50%'],
                    data: [
                        { value: parkingTypeCounts['免费'] || 0, name: '免费' },
                        { value: parkingTypeCounts['收费'] || 0, name: '收费' }
                    ],
                    itemStyle: {
                        // 设置不同颜色
                        color: (params) => {
                            const colorList = ['#1E90FF', '#32CD32'];  // 蓝色为免费，绿色为收费
                            return colorList[params.dataIndex];
                        },
                        borderRadius: 5,
                        borderColor: '#fff',
                        borderWidth: 0.5
                    },
                    label: {
                        show: true,
                        color: '#fff',  // 设置标签颜色为白色
                        position: 'outside',  // 标签显示在外部
                    },
                    labelLine: {
                        show: true,  // 显示指示线
                        length: 20,  // 指示线长度
                        lineStyle: {
                            color: '#fff',  // 设置指示线颜色为白色
                        },
                    }
                },
                {
                    name: '充电桩类型',
                    type: 'pie',
                    radius: ['30%', '50%'],
                    avoidLabelOverlap: false,
                    center: ['70%', '50%'],
                    data: [
                        { value: pileTypeCounts['交流'] || 0, name: '交流' },
                        { value: pileTypeCounts['直流'] || 0, name: '直流' }
                    ],
                    itemStyle: {
                        // 设置不同颜色
                        color: (params) => {
                            const colorList = ['#FF6347', '#FFD700'];  // 红色为交流，金色为直流
                            return colorList[params.dataIndex];
                        },
                        borderRadius: 5,
                        borderColor: '#fff',
                        borderWidth: 0.5
                    },
                    label: {
                        show: true,
                        color: '#fff',  // 设置标签颜色为白色
                        position: 'outside',  // 标签显示在外部
                    },
                    labelLine: {
                        show: true,  // 显示指示线
                        length: 3,  // 指示线长度
                        lineStyle: {
                            color: '#fff',  // 设置指示线颜色为白色
                        },
                    }
                }
            ],
            // 添加下方说明文本
            graphic: [
                {
                    type: 'text',
                    left: '25%',
                    top: '85%',
                    style: {
                        text: '充电站',
                        fill: '#fff',
                        font: '14px Arial',
                    }
                },
                {
                    type: 'text',
                    left: '65%',
                    top: '85%',
                    style: {
                        text: '充电桩',
                        fill: '#fff',
                        font: '14px Arial',
                    }
                }
            ]
        };

        myChart.setOption(option);

        // 监听窗口大小变化，重新调整图表大小
        window.addEventListener('resize', () => {
            myChart.resize();
        });

        // 清理函数，在组件卸载时移除事件监听
        return () => {
            window.removeEventListener('resize', () => myChart.resize());
            myChart.dispose();  // 销毁图表实例
        };
    }, [stations]);

    return (
        <div ref={chartRef} style={{ width: '100%', height: '100%' }}></div>  // 设置一个固定的高度
    );
}

export default TypePies;
