import React, { useState, useEffect } from "react";
import { Table, Spin, Alert } from "antd";
import axios from "axios";

const Districts = () => {
    const [data, setData] = useState([]);  // 存储行政区数据
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 通过 axios 请求数据
    const fetchDistricts = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/districts");  // 请求后端 API
            console.log("API 返回数据:", response.data);  // 检查数据格式
            if (response.data) {
                setData(response.data);
            } else {
                setError(response.data.error || "获取数据失败");
            }
        } catch (err) {
            setError("无法连接到服务器");
        } finally {
            setLoading(false);
        }
    };

    // 在组件挂载时获取数据
    useEffect(() => {
        fetchDistricts();
    }, []);

    // 定义表头（支持排序）
    const columns = [
        { title: "行政区编码", dataIndex: "adcode", key: "adcode" },
        { title: "行政区名称", dataIndex: "district_name", key: "district_name" },
        {
            title: "常住人口（万人）",
            dataIndex: "population",
            key: "population",
            sorter: (a, b) => a.population - b.population,
        },
        {
            title: "面积（平方千米）",
            dataIndex: "area",
            key: "area",
            sorter: (a, b) => a.area - b.area,
        },
        {
            title: "公共充电站数",
            dataIndex: "station_count",
            key: "station_count",
            sorter: (a, b) => a.station_count - b.station_count
        },
        {
            title: "公共充电桩数",
            dataIndex: "total_piles",
            key: "total_piles",
            sorter: (a, b) => a.total_piles - b.total_piles
        }
    ];

    // 加载状态
    if (loading) return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;
    if (error) return <Alert message={error} type="error" showIcon />;

    return (
        <div style={{ padding: "16px", background: "#fff", borderRadius: "8px" }}>
            <h2 style={{ marginBottom: "16px" }}>行政区基本统计信息</h2>
            <Table
                columns={columns}
                dataSource={data}
                rowKey="adcode"
                pagination={{ pageSize: 10 }}
                bordered
            />
        </div>
    );
};

export default Districts;
