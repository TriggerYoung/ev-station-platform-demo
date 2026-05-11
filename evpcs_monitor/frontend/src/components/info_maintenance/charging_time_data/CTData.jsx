import React, { useEffect, useState } from "react";
import { Card, Space, Spin, message } from "antd";
import moment from "moment";
import axios from "axios";
import QueryForm from "./QueryForm";
import LineChart from "./LineChart";
import DataTable from "./DataTable";

const fieldMap = {
    volume: "充电量 (kWh)", 
    occupancy: "充电桩占用数 (个)",
    duration: "充电时长 (小时)", 
    e_price: "用电费用 (元)", 
    s_price: "服务费用 (元)"
};

const CTData = () => {
    // 初始状态
    const [stationId, setStationId] = useState("1001");
    const [dateRange, setDateRange] = useState([
        moment("2022-09-01"),
        moment("2023-01-01")
    ]);
    const [selectedFields, setSelectedFields] = useState(["volume"]);  // 用户初始选择的字段
    const [chartFields, setChartFields] = useState(["volume"]);         // 点击查询后，图表展示的字段
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [chartData, setChartData] = useState([]); // 图表数据

    // 组件挂载时自动查询
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!stationId.trim()) {
            message.warning("请输入有效的充电站 ID！");
            return;
        }

        setLoading(true);
        try {
            const start = dateRange[0].utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
            const stop = dateRange[1].utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
            let params = { start, stop, fields: selectedFields.join(","), station_id: stationId.trim() };

            console.log("请求参数：", params);
            const response = await axios.get("/api/ctdata/", { params });

            if (response.data.success) {
                processData(response.data.data);
                setChartData(response.data.data);  // 更新图表数据
                setChartFields([...selectedFields]);  // 确保点击“查询”后才更新图表字段
            } else {
                message.error("数据加载失败：" + response.data.error);
            }
        } catch (error) {
            message.error("请求错误，请检查 API 连接：" + error.message);
        }
        setLoading(false);
    };

    const processData = (rawData) => {
        if (rawData.length === 0) {
            message.warning("暂无数据");
            setData([]);
            setChartData([]); // 清空图表数据
            return;
        }

        // 统一时间格式
        const processedData = rawData.map(item => ({
            ...item,
            time: moment(item.time).format("YYYY-MM-DD HH:mm:ss")
        }));

        // 生成表格列
        const cols = [
            {
                title: "时间",
                dataIndex: "time",
                key: "time",
                sorter: (a, b) => moment(a.time).valueOf() - moment(b.time).valueOf(), // 时间排序
            }
        ];

        // 为每个选中字段添加排序
        selectedFields.forEach(field => {
            cols.push({
                title: fieldMap[field],   // 显示对应的中文名称
                dataIndex: field,
                key: field,
                sorter: (a, b) => (a[field] || 0) - (b[field] || 0), // 数值排序
            });
        });

        setColumns(cols);
        setData(processedData);
    };

    return (
        <Card title={
            <Space>
                <span>充电时序数据</span>
                <QueryForm
                    stationId={stationId} setStationId={setStationId}
                    dateRange={dateRange} setDateRange={setDateRange}
                    selectedFields={selectedFields} setSelectedFields={setSelectedFields}
                    fetchData={fetchData} data={data}
                />
            </Space>
        } style={{ margin: "12px" }}>

            {loading ? <Spin size="large" /> : (
                <>
                    {chartData.length > 0 && chartFields.map(field => (
                        <LineChart key={field} field={field} data={chartData} />
                    ))}
                    {data.length > 0 && <DataTable data={data} columns={columns} />}
                </>
            )}
        </Card>
    );
};

export default CTData;
