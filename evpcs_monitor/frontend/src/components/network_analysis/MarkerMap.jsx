// MarkerMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import { MultiMarker, MultiPolyline, TMap } from 'tlbs-map-react';
import StationModal from './StationModal';

// 定义样式
const styles = {
    markerStyle: {
        width: 20,
        height: 30,
        anchor: { x: 10, y: 30 },
    },
    polylineStyle: {
        // color: '#2C68FF',
        // width: 5,
        borderWidth: 0,
    },
};

const MarkerMap = ({ center, stations, community }) => {
    const markerRef = useRef(null);
    const mapRef = useRef(null); // 用于存储 TMap 实例
    const [geometries, setGeometries] = useState([]);
    const [polylines, setPolylines] = useState([]); // 存储连边的坐标数据
    const [isModalVisible, setIsModalVisible] = useState(false); // 控制 Modal 的显示状态
    const [selectedStation, setSelectedStation] = useState(null); // 存储当前选中的充电站信息

    // 更新 marker 和连边
    useEffect(() => {
        // 生成充电站的 geometries
        const stationsGeometries = stations.map(station => ({
            styleId: 'markerStyle',
            position: { lat: station.latitude, lng: station.longitude },
            properties: {
                station_id: station.station_id,
                address: station.address,
                latitude: station.latitude,
                longitude: station.longitude,
                adcode: station.adcode,
                pile_count: station.pile_count
            },
        }));
        setGeometries(stationsGeometries);
    }, [stations]); // 监听 stations 变化


    // 更新连边
    useEffect(() => {
        if (community) {
            // 清空现有连线
            setPolylines([]);

            // 创建新的连线
            const polylinePaths = community.edges.map(edge => {
                const startStation = community.stations.find(station => station.station_id === edge.source);
                const endStation = community.stations.find(station => station.station_id === edge.target);
                return [
                    { lat: startStation.latitude, lng: startStation.longitude },
                    { lat: endStation.latitude, lng: endStation.longitude },
                ];
            });
            setPolylines(polylinePaths);
        }
    }, [community]); // 监听社群数据变化

    useEffect(() => {
        if (mapRef.current && center) {
            mapRef.current.setCenter(new window.TMap.LatLng(center.lat, center.lng));
        }
    }, [center]);

    // 点击 marker 时显示 Modal
    const clickHandler = (event) => {
        const { properties } = event.geometry;
        setSelectedStation(properties);
        setIsModalVisible(true);
    };

    // 关闭 Modal
    const handleCloseModal = () => {
        setIsModalVisible(false);
    };

    // 地图加载完成后获取地图实例
    const handleMapLoad = (map) => {
        mapRef.current = map;
    };

    return (
        <div className="demo-box">
            <TMap
                apiKey="OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77"
                options={{
                    zoom: 12,
                    center: center ? { lat: center.lat, lng: center.lng } : { lat: 22.5431, lng: 114.0579 },
                }}
                onLoad={handleMapLoad}
            >
                <MultiMarker
                    ref={markerRef}
                    styles={styles}
                    geometries={geometries}
                    onClick={clickHandler}
                />
                {/* 绘制社群连边 */}
                {polylines.length > 0 && (
                    <MultiPolyline
                        styles={styles.polylineStyle}
                        geometries={polylines.map(path => ({ paths: path }))}
                    />
                )}
            </TMap>

            <StationModal
                visible={isModalVisible}
                onClose={handleCloseModal}
                station={selectedStation}
            />
        </div>
    );
};

export default MarkerMap;



