// InfoWelcome.jsx:
import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spin } from "antd";
import {
    SmileTwoTone,
    AimOutlined,
    TeamOutlined,
    EnvironmentOutlined,
    ApartmentOutlined,
    DatabaseOutlined,
    HeartTwoTone,
    CommentOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

// 基础卡片样式
const cardBaseStyle = {
    borderRadius: "18px",
    background: "linear-gradient(135deg, #1f1c2c, #928dab)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 0 8px rgba(0, 255, 255, 0.25)",
    transition: "all 0.3s ease-in-out",
    cursor: "pointer",
};

// 鼠标悬停时的样式
const glowHover = {
    boxShadow: "0 0 16px 4px rgba(0, 255, 255, 0.6), 0 0 32px 8px rgba(0, 128, 255, 0.3)",
    transform: "scale(1.03)",
};

const InfoWelcome = () => {
    const [role, setRole] = useState(null);
    const navigate = useNavigate(); // 初始化 navigate

    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        console.log("💡当前登录角色为：", storedRole);
        setRole(storedRole);
    }, []);

    // 卡片信息
    const cards = [
        {
            title: "充电站管理",
            icon: <EnvironmentOutlined style={{ fontSize: 32, color: "#ffe58f" }} />,
            description: "管理公共充电站的基本信息，包括位置、容量、类型等。",
            path: "/info_maintenance/stations",
        },
        {
            title: "充电桩管理",
            icon: <AimOutlined style={{ fontSize: 32, color: "#87e8de" }} />,
            description: "管理每个站点内的充电桩明细信息，包括接口类型、编号、功率等数据。",
            path: "/info_maintenance/piles",
        },
        {
            title: "充电时序数据",
            icon: <DatabaseOutlined style={{ fontSize: 32, color: "#bae637" }} />,
            description: "支持查看和下载特定站点在不同时间段的充电时序数据。",
            path: "/info_maintenance/ctdata",
        },
        {
            title: "合作意向信息",
            icon: <CommentOutlined style={{ fontSize: 32, color: "#8457d6" }} />,
            description: "浏览潜在合作伙伴的联系方式与合作需求，助力共赢发展。",
            path: "/info_maintenance/business_info",
        },
        {
            title: "行政区信息",
            icon: <ApartmentOutlined style={{ fontSize: 32, color: "#ffd666" }} />,
            description: "查看行政区的常住人口、区域面积、公共充电站和充电桩数目。",
            path: "/info_maintenance/districts",
        },
        // 只在 admin 情况下加入该模块
        ...(role === "admin"
            ? [{
                title: "系统用户管理",
                icon: <TeamOutlined style={{ fontSize: 32, color: "#ffccc7" }} />,
                description: "管理平台管理员、操作员和普通用户账户，配置权限与角色。",
                path: "/info_maintenance/users",
            }]
            : []),
    ];
    if (!role) return <Spin />;

    return (
        <div>
            <Card>
                <h2><SmileTwoTone /> 欢迎回来{role ? `，${role === "admin" ? "管理员" : "操作员"}` : ""}！</h2>
                <p>这里是信息维护中心，您可以管理平台中重要的数据资产。</p>
            </Card>

            <Card>
                <Row gutter={[32, 32]}>
                    {cards.map((item, index) => (
                        <Col key={index} xs={24} sm={24} md={12} lg={12}>
                            <Card
                                hoverable
                                onClick={() => navigate(item.path)}
                                style={cardBaseStyle}
                                onMouseEnter={(e) => Object.assign(e.currentTarget.style, glowHover)}
                                onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}
                            >
                                <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                                    {item.icon}
                                    <h3 style={{ marginLeft: 16, color: "#fff", fontSize: 18 }}>{item.title}</h3>
                                </div>
                                <p style={{ color: "#e6f7ff", fontSize: 14 }}>{item.description}</p>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>
            <Card>
                <h2><HeartTwoTone twoToneColor="#eb2f96" /> 小贴士~</h2>
                <p>点击上方卡片可快速跳转至对应模块；系统数据定期更新，确保数据一致性。</p>
            </Card>
        </div>
    );
};

export default InfoWelcome;
