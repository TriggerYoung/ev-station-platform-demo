// DataPanel.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Layout, Row, Col, Statistic, Space } from "antd";
import { EnvironmentOutlined, AimOutlined } from "@ant-design/icons";
import ShenZhenMap from "./ShenZhenMap";
import StationsPiles from "./StationsPiles";
import TypePies from "./TypePies";
import RealTimeVolume from "./RealTimeVolume";
import RealTimeOccupancy from "./RealTimeOccupancy";
import PriceTrend from "./PriceTrend";
import OccupancyRanking from "./OccupancyRanking";
import ShenZhenWeather from "./ShenZhenWeather";
import '../../assets/css/datapanel.css'; 
import withAuth from "../withAuth";


const { Header, Content } = Layout;

const DataPanel = () => {
  const [stations, setStations] = useState([]); // 充电站数据
  const [districts, setDistricts] = useState([]); // 行政区数据
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString()); // 当前时间

  // 从后端获取充电站数据
  useEffect(() => {
    axios.get('/api/datapanel/stations')
      .then(response => {
        setStations(response.data);
      })
      .catch(error => {
        console.error('获取充电站数据失败:', error);
      });
  }, []);

  // 从后端获取行政区数据
  useEffect(() => {
    axios.get('/api/datapanel/districts')
      .then(response => {
        setDistricts(response.data);
      })
      .catch(error => {
        console.error('获取行政区数据失败:', error);
      });
  }, []);

  // 每秒更新时间
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000); // 每秒更新时间

    // 清除定时器
    return () => clearInterval(intervalId);
  }, []);

  // 计算总共的充电桩数量
  const totalPiles = stations.reduce((total, station) => total + station.pile_count, 0);

  return (
    <div>
      <Layout style={{ minHeight: "100vh", backgroundColor:"#00102A" }}>
        {/* Header Section */}
        <Header className="header">
          {/* 左侧天气信息 */}
          <Space style={{ marginRight: "auto" }}>
            <ShenZhenWeather />
          </Space>
          {/* 中间标题 */}
          <Space className="title">
            深圳市电动汽车公共充电基础设施数据可视化大屏
          </Space>
          {/* 右侧日期时间 */}
          <Space>
            <span style={{ color: "white", fontSize: "16px" }}>
              {currentTime}
            </span>
          </Space>
        </Header>
        {/* Content Section */}
        <Content style={{ padding: "20px", display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>
          <Row gutter={[16, 16]} style={{ flex: 1 }}>
            {/* Left Column */}
            <Col span={7} style={{ display: "flex", flexDirection: "column" }}>
              <div className="cardContainer">
                {/* 行政区充电站和充电桩分布柱状图 */}
                <StationsPiles districts={districts} />
              </div>
              <div className="cardContainer">
                {/* 近24小时充电能耗折线图 */}
                <RealTimeVolume />
              </div>
              <div className="cardContainer">
                {/* 近24小时充电平均价格折线图 */}
                <PriceTrend />
              </div>
            </Col>
            {/* Middle Column */}
            <Col span={10} style={{ display: "flex", flexDirection: "column" }}> 
              <Row gutter={[16, 16]} style={{ flex: 1 }}>
                <Col span={24} style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Row style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
                    <Col span={12} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <Statistic
                        value={stations.length}
                        precision={0}
                        title={<span style={{ color: "white", fontSize: "16px", fontWeight: "bold" }}>充电站数量</span>}
                        valueStyle={{
                          color: '#1E90FF',
                          fontSize: '36px',
                          fontFamily: "'Orbitron', sans-serif", 
                        }}
                        prefix={<EnvironmentOutlined />}
                      />
                    </Col>
                    <Col span={12} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <Statistic
                        value={stations.reduce((total, station) => total + station.pile_count, 0)}
                        precision={0}
                        title={<span style={{ color: "white", fontSize: "16px", fontWeight: "bold" }}>充电桩数量</span>}
                        valueStyle={{
                          color: '#FF6347',
                          fontSize: '36px',
                          fontFamily: "'Orbitron', sans-serif",  
                        }}
                        prefix={<AimOutlined />}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>

              {/* 地图部分 */}
              <Row style={{ flex: 8 }}>
                <Col span={24} style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <div className="mapCardContainer">
                    {/* 站点区域分布地图 */}
                    <ShenZhenMap stations={stations} />
                  </div>
                </Col>
              </Row>
            </Col>

            {/* Right Column */}
            <Col span={7} style={{ display: "flex", flexDirection: "column" }}>
              <div className="cardContainer">
                {/* 行政区充电站和充电桩分布 */}
                <TypePies stations={stations} />
              </div>
              <div className="cardContainer">
                {/* 近一小时内充电桩总占用率 */}
                <RealTimeOccupancy total_piles={totalPiles} />
              </div>
              <div className="cardContainer">
                {/* 近一小时内充电桩占用率排名前50的站点 */}
                <OccupancyRanking />
              </div>
            </Col>
          </Row>
        </Content>
      </Layout>
    </div>
  );
};

export default withAuth(DataPanel);
