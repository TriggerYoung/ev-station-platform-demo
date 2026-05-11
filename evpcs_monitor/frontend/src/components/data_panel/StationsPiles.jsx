import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const StationsPiles = ({ districts }) => {  // 接收districts作为props
    const chartRef = useRef(null);

    useEffect(() => {
        const myChart = echarts.init(chartRef.current);

        // 获取行政区名称、充电站数量和充电桩数量
        const districtNames = districts.map(item => item.district_name);  // 行政区名称
        const stationCounts = districts.map(item => item.station_count);  // 充电站数量
        const pileCounts = districts.map(item => item.pile_count);  // 充电桩数量

        const option = {
            title: {
                text: '行政区充电站和充电桩分布',
                left: 'center',
                top: '5%',
                textStyle: {
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 'bold',
                },
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',  // 阴影指示器
                },
            },
            grid: {
                left: '10%',  // 增加左侧空白
                right: '12%',  // 增加右侧空白
                bottom: '15%',
                top: '20%',
            },
            xAxis: {
                type: 'category',
                data: districtNames,  // 设置行政区名称为x轴数据
                axisTick: {
                    alignWithLabel: true,
                },
                axisLabel: {
                    color: '#fff',  // 设置x轴标签颜色为白色
                    interval: 0,  // 显示所有x轴标签
                    // rotate: 45,  // 旋转x轴标签，避免重叠
                    margin: 10,  // 增加x轴标签的间距
                    fontSize: 10,  // 减小x轴标签的字体大小
                },
            },
            yAxis: [
                {
                    type: 'value',
                    name: '站数',
                    position: 'left',
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: '#1E90FF',  // 充电站轴的颜色
                        },
                    },
                    axisLabel: {
                        color: '#fff',  // 设置y轴标签颜色为白色
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            width: 0.5,
                            color: '#fff',  // 充电站轴的颜色
                            type: 'dashed',  // 虚线样式
                        },
                    },
                },
                {
                    type: 'value',
                    name: '桩数',
                    position: 'right',
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: '#FF6347',  // 充电桩轴的颜色
                        },
                    },
                    axisLabel: {
                        color: '#fff',  // 设置y轴标签颜色为白色
                    },
                    splitLine: {
                        show: false,
                    },
                },
            ],
            series: [
                {
                    name: '站数',
                    type: 'bar',
                    data: stationCounts,  // 充电站数量
                    itemStyle: {
                        color: '#1E90FF',  // 蓝色表示充电站
                    },
                    yAxisIndex: 0,  // 使用左侧y轴
                },
                {
                    name: '桩数',
                    type: 'bar',
                    data: pileCounts,  // 充电桩数量
                    itemStyle: {
                        color: '#FF6347',  // 红色表示充电桩
                    },
                    yAxisIndex: 1,  // 使用右侧y轴
                },
            ],
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
    }, [districts]);

    return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;  // 使用100%宽度和高度
};

export default StationsPiles;
