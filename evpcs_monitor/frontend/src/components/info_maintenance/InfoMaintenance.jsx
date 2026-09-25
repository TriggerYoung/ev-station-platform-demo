// InfoMaintenance.jsx
import React, { useState, useEffect } from "react";
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    AimOutlined,
    TeamOutlined,
    EnvironmentOutlined,
    CommentOutlined,
    ThunderboltFilled,
    ApartmentOutlined,
    DatabaseOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import InfoMaintenanceRoutes from "./InfoMaintenanceRoutes"; // 引入路由组件
import withAuth from "../withAuth"; // 引入认证组件
import { canViewDemoAdminPages, getAppRole } from "../../demo/demoMode";

const { Header, Sider, Content, Footer } = Layout;

const siderStyle = {
    overflow: "auto",
    height: "100vh",
    position: "sticky",
    insetInlineStart: 0,
    top: 0,
    bottom: 0,
    scrollbarWidth: "thin",
    scrollbarGutter: "stable",
};

const InfoMaintenance = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [role, setRole] = useState(null);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const navigate = useNavigate();
    const location = useLocation();

    // 读取本地存储的角色信息
    useEffect(() => {
        const storedRole = getAppRole();
        setRole(storedRole);
    }, []);

    // 侧边栏菜单项
    const menuItems = [
        { key: "/info_maintenance/", icon: <ThunderboltFilled />, label: "首页" },
        { key: "/info_maintenance/stations", icon: <EnvironmentOutlined />, label: "充电站管理" },
        { key: "/info_maintenance/piles", icon: <AimOutlined />, label: "充电桩管理" },
        { key: "/info_maintenance/ctdata", icon: <DatabaseOutlined />, label: "充电时序数据" },
        { key: "/info_maintenance/business_info", icon: <CommentOutlined />, label: "合作意向信息" },
        { key: "/info_maintenance/districts", icon: <ApartmentOutlined />, label: "行政区信息" },
        // 只有角色是 admin 时才显示“系统用户管理”菜单项
        canViewDemoAdminPages(role) && { key: "/info_maintenance/users", icon: <TeamOutlined />, label: "系统用户管理" },
    ].filter(Boolean); // 过滤掉 role 为 null 或不显示的菜单项

    return (
        <Layout style={{ minHeight: "100vh" }}>
            {/* 侧边栏 */}
            <Sider trigger={null} collapsible collapsed={collapsed} style={siderStyle}>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]} // 动态绑定当前路由
                    onClick={(e) => {
                        navigate(e.key);
                    }}
                    items={menuItems} // 使用过滤后的菜单项
                />
            </Sider>

            <Layout>
                {/* 头部区 */}
                <Header
                    style={{
                        padding: 0,
                        background: colorBgContainer,
                        textAlign: "center",
                        fontSize: "26px",
                        height: 48,
                        lineHeight: "48px",
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: "16px",
                            float: "left",
                            width: 48,
                            height: 48,
                        }}
                    />
                    电动汽车公共充电基础设施管理监测分析系统信息维护
                </Header>

                {/* 内容区 */}
                <Content
                    style={{
                        margin: "10px 16px 0px 16px",
                        padding: 10,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    {/* 渲染路由逻辑 */}
                    <InfoMaintenanceRoutes />
                </Content>

                {/* 底部区 */}
                <Footer style={{ textAlign: "center" }}>
                    ©{new Date().getFullYear()} ChargeMind Created by YOUNG
                </Footer>
            </Layout>
        </Layout>
    );
};

export default withAuth(InfoMaintenance);
