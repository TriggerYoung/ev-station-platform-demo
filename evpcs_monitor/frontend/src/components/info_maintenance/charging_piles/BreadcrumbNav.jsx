import React from "react";
import { Breadcrumb } from "antd";
import { HomeOutlined, ApartmentOutlined, EnvironmentOutlined } from "@ant-design/icons";

/**
 * 面包屑导航组件
 */
const BreadcrumbNav = ({ breadcrumbItems }) => {
    return (
        <div style={{
            background: "rgba(228, 238, 239, 0.7)", // 更深一点的灰色，区分背景
            padding: "5px 20px",
            borderRadius: "8px",
            marginBottom: 5, // 让其更贴近顶部
            boxShadow: "0px 2px 5px rgba(27, 233, 248, 0.7)", // 提高立体感
        }}>
            <Breadcrumb
                separator=">"
                items={breadcrumbItems.map((b, index) => ({
                    title: (
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "16px",
                                fontWeight: index === breadcrumbItems.length - 1 ? "bold" : "normal", // 让最后一级加粗
                                color: index === breadcrumbItems.length - 1 ? "#333" : "#555", // 站点名称颜色更深
                                transition: "color 0.2s ease-in-out",
                            }}
                        >
                            {index === 0 ? (
                                <HomeOutlined />
                            ) : index === 1 ? (
                                <ApartmentOutlined />
                            ) : (
                                <EnvironmentOutlined />
                            )}
                            {b.title}
                        </span>
                    ),
                    key: b.key,
                }))}
            />
        </div>
    );
};

export default BreadcrumbNav;

