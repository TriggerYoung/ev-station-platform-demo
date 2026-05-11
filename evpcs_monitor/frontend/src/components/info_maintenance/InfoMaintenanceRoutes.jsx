// InfoMaintenanceRoutes.jsx
import React from "react";
import { Route, Routes } from "react-router-dom";
import { AliveScope, KeepAlive } from "react-activation";
import InfoWelcome from "./welcome/InfoWelcome"; // 引入首页欢迎页面组件
import Users from "./users/Users";
import ChargingStations from "./charging_stations/ChargingStations";
import ChargingPiles from "./charging_piles/ChargingPiles";
import Districts from "./districts/Districts";
import CTData from "./charging_time_data/CTData";
import BusinessInfo from "./business_infomation/BusinessInfo";

const InfoMaintenanceRoutes = () => {
    return (
        <AliveScope> {/* 启用缓存范围 */}
            <Routes>
                <Route path="/" element={<InfoWelcome />} />
                <Route path="stations" element={<KeepAlive><ChargingStations /></KeepAlive>} />
                <Route path="piles" element={<KeepAlive><ChargingPiles /></KeepAlive>} />
                <Route path="users" element={<KeepAlive><Users /></KeepAlive>} />
                <Route path="ctdata" element={<KeepAlive><CTData /></KeepAlive>} />
                <Route path="districts" element={<KeepAlive><Districts /></KeepAlive>} />
                <Route path="business_info" element={<KeepAlive><BusinessInfo /></KeepAlive>} />
            </Routes>
        </AliveScope>
    );
};

export default InfoMaintenanceRoutes;
