import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import shenzhenMap from '../../assets/json/shenzhenshi.json';

const ShenZhenMap = ({ stations }) => {
    const mapRef = useRef(null);

    useEffect(() => {
        const myChart = echarts.init(mapRef.current);
        echarts.registerMap('shenzhen', shenzhenMap);

        // 按行政区（adcode）聚合数据，并将adcode映射为中文name
        const regionData = {};

        // 创建adcode -> name的映射
        const adcodeToName = {};
        shenzhenMap.features.forEach((feature) => {
            adcodeToName[String(feature.properties.adcode)] = feature.properties.name;  // 通过adcode映射name
        });
        // console.log(adcodeToName);

        // 聚合充电站数据，按行政区（adcode）统计
        stations.forEach((station) => {
            const adcode = Number(station.adcode);
            const pile_count = Number(station.pile_count);
            if (!regionData[adcode]) {
                regionData[adcode] = { count: 0, pile_count: 0, name: adcodeToName[adcode] || adcode };  // 获取中文name
            }
            regionData[adcode].count += 1;
            regionData[adcode].pile_count += pile_count;
        });
        // console.log('regionData:', regionData);
        // 将聚合后的数据转化为符合echarts格式的数据
        const regionSeriesData = Object.keys(regionData).map((adcode) => ({
            name: regionData[adcode].name,  // 使用中文名称
            value: regionData[adcode].pile_count,  // 充电桩总数
            count: regionData[adcode].count,       // 充电站数量
        }));

        // 将充电站的经纬度转为 scatter 数据
        const scatterData = stations.map(station => ({
            name: station.address,  // 使用充电站地址作为名称
            value: [
                parseFloat(station.longitude),
                parseFloat(station.latitude),
                station.pile_count
            ],
        }));

        // 区域颜色配置
        const areaColors = [
            { min: 0, max: 50, color: 'rgba(2, 28, 96, 0.8)' },
            { min: 50, max: 100, color: 'rgba(0, 78, 138, 0.8)' },
            { min: 100, max: 200, color: 'rgba(0, 148, 222, 0.8)' }
        ];

        // 生成渐变颜色函数
        const generateGradient = (colors) => {
            return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: colors[0] },
                { offset: 1, color: colors[1] }
            ]);
        };

        const option = {
            title: {
                text: '电动汽车公共充电基础设施分布地图',
                subtext: '数据即时更新',
                top: '10%',
                left: 'center',
                textStyle: {
                    color: '#fff',
                    
                    fontSize: 24,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(0, 24, 48, 0.9)',
                borderColor: '#00d8ff',
                borderWidth: 1,
                textStyle: {
                    color: '#fff',
                    fontSize: 14
                },
                formatter: (params) => {
                    if (params.seriesType === 'map') {
                        return `${params.name}<br/>
                    充电站数量: ${params.data.count}<br/>
                    充电桩总数: <span style="color:#00d8ff">${params.data.value}</span>`;
                    }
                    return '';
                }
            },
            visualMap: {
                show: true,
                min: 0,
                max: 1000,
                calculable: true,
                inRange: {
                    color: areaColors.map(c => c.color)
                },
                textStyle: {
                    color: '#fff'
                }
            },
            geo: {
                map: 'shenzhen',
                roam: true,
                label: {
                    show: true,
                    color: '#fff',
                    fontSize: 12
                },
                itemStyle: {
                    areaColor: generateGradient(['#003366', '#001a33']),
                    borderColor: '#00d8ff',
                    borderWidth: 1,
                    shadowColor: 'rgba(0, 216, 255, 0.5)',
                    shadowBlur: 10,
                    shadowOffsetX: 5,
                    shadowOffsetY: 5
                },
                emphasis: {
                    label: {
                        show: true,
                        color: '#fff',
                        fontWeight: 'bold'
                    },
                    itemStyle: {
                        areaColor: generateGradient(['#00d8ff', '#0077ff']),
                        borderWidth: 2
                    }
                }
            },
            series: [
                {
                    type: 'map',
                    map: 'shenzhen',
                    data: regionSeriesData,
                    geoIndex: 0
                },
                {
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    data: scatterData,
                    symbolSize: 3,
                    itemStyle: {
                        color: generateGradient(['#00fffc', '#00d8ff']),
                        shadowBlur: 10,
                        shadowColor: '#00d8ff'
                    },
                    zlevel: 1
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
        }

    }, [stations]);  // 每次stations更新时，重新渲染地图

    return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default ShenZhenMap;



