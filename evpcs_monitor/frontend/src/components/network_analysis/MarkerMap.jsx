import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import shenzhenMap from "../../assets/json/shenzhenshi.json";
import StationModal from "./StationModal";

const DEFAULT_CENTER = [114.0579, 22.5431];

const MarkerMap = ({ center, stations, community, communityColor }) => {
  const chartElementRef = useRef(null);
  const [selectedStation, setSelectedStation] = useState(null);

  useEffect(() => {
    const chart = echarts.init(chartElementRef.current);
    echarts.registerMap("shenzhen-network", shenzhenMap);

    const stationsById = new Map(
      (community?.stations || stations).map((station) => [
        String(station.station_id),
        station,
      ])
    );
    const edges = (community?.edges || [])
      .map((edge) => {
        const source = stationsById.get(String(edge.source));
        const target = stationsById.get(String(edge.target));
        if (!source || !target) return null;
        return {
          coords: [
            [Number(source.longitude), Number(source.latitude)],
            [Number(target.longitude), Number(target.latitude)],
          ],
          value: Number(edge.weight) || 1,
        };
      })
      .filter(Boolean);

    chart.setOption({
      animationDurationUpdate: 350,
      backgroundColor: "#f7fbff",
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          if (params.seriesName !== "充电站") return "";
          const station = params.data.station;
          return [
            `<strong>站点 ${station.station_id}</strong>`,
            station.address,
            `充电桩：${station.pile_count}`,
          ].join("<br />");
        },
      },
      geo: {
        map: "shenzhen-network",
        roam: true,
        center: center
          ? [Number(center.lng), Number(center.lat)]
          : DEFAULT_CENTER,
        zoom: center ? 1.8 : 1.05,
        label: { show: true, color: "#3b5068", fontSize: 10 },
        itemStyle: {
          areaColor: "#e6f4ff",
          borderColor: "#69b1ff",
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: { areaColor: "#bae0ff" },
          label: { color: "#102a43" },
        },
      },
      series: [
        {
          name: "社群连边",
          type: "lines",
          coordinateSystem: "geo",
          silent: true,
          zlevel: 1,
          data: edges,
          lineStyle: {
            color: communityColor || "#1677ff",
            width: 1.3,
            opacity: 0.5,
            curveness: 0.08,
          },
        },
        {
          name: "充电站",
          type: "scatter",
          coordinateSystem: "geo",
          zlevel: 2,
          symbolSize: (value) =>
            Math.max(5, Math.min(13, 4 + Number(value[2]) / 8)),
          itemStyle: {
            color: communityColor || "#ff4d4f",
            borderColor: "#fff",
            borderWidth: 0.7,
            opacity: 0.9,
          },
          data: stations.map((station) => ({
            name: String(station.station_id),
            value: [
              Number(station.longitude),
              Number(station.latitude),
              Number(station.pile_count) || 0,
            ],
            station,
          })),
        },
      ],
    });

    const handleStationClick = (params) => {
      if (params.seriesName === "充电站" && params.data?.station) {
        setSelectedStation(params.data.station);
      }
    };
    const handleResize = () => chart.resize();
    chart.on("click", handleStationClick);
    window.addEventListener("resize", handleResize);

    return () => {
      chart.off("click", handleStationClick);
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [center, stations, community, communityColor]);

  return (
    <div className="demo-box">
      <div
        ref={chartElementRef}
        style={{ width: "100%", height: "48vh", minHeight: 380 }}
        aria-label="深圳市充电站网络地图"
      />
      <StationModal
        visible={Boolean(selectedStation)}
        onClose={() => setSelectedStation(null)}
        station={selectedStation}
      />
    </div>
  );
};

export default MarkerMap;
