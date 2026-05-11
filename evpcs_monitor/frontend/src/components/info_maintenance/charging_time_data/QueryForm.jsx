import React from "react";
import { Space, Input, Button, DatePicker, Select, message, Tooltip, ConfigProvider } from "antd";
import { DownloadOutlined, SearchOutlined } from "@ant-design/icons";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import locale from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn"); // 设置 dayjs 语言为中文
const { RangePicker } = DatePicker;
const { Option } = Select;

const fieldOptions = [
    { label: "充电量", value: "volume" },
    { label: "充电桩占用数", value: "occupancy" },
    { label: "充电时长", value: "duration" },
    { label: "用电费用", value: "e_price" },
    { label: "服务费用", value: "s_price" },
];

const QueryForm = ({ stationId, setStationId, dateRange, setDateRange, selectedFields, setSelectedFields, fetchData, data }) => {
    // 下载 CSV
    const downloadCSV = () => {
        if (data.length === 0) {
            message.warning("暂无可下载的数据");
            return;
        }
        const filteredData = data.map(row => {
            const newRow = { time: row.time };
            selectedFields.forEach(field => {
                newRow[field] = row[field];
            });
            return newRow;
        });

        // 使用XLSX库将数据转为工作表
        const ws = XLSX.utils.json_to_sheet(filteredData);

        // 将工作表转为CSV格式
        const csvData = XLSX.utils.sheet_to_csv(ws);

        // 将生成的CSV数据保存为CSV文件
        const fileData = new Blob([csvData], { type: "text/csv;charset=utf-8" });
        saveAs(fileData, `ctdata_${stationId}_${dateRange[0].format("YYYYMMDD")}_${dateRange[1].format("YYYYMMDD")}.csv`);
    };

    return (
        <Space>
            <span>站点ID:</span>
            <Input placeholder="输入充电站 ID" value={stationId} onChange={e => setStationId(e.target.value)} style={{ width: 120 }} />
            <span>范围:</span>

            <ConfigProvider locale={locale}>
                <RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    format="YYYY/MM/DD"
                    disabledDate={current => current.isBefore(dayjs("2022-09-01")) || current.isAfter(dayjs("2023-09-01"))}
                    style={{ width: 220 }}
                />
            </ConfigProvider>

            <span>字段:</span>
            <Select mode="multiple" placeholder="选择查询字段" value={selectedFields} onChange={setSelectedFields} style={{ width: 400 }}>
                {fieldOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
            </Select>
            <Tooltip title="查询时序数据"><Button type="primary" icon={<SearchOutlined />} onClick={fetchData}></Button></Tooltip>
            <Tooltip title="下载为CSV文件"><Button type="primary" icon={<DownloadOutlined />} onClick={downloadCSV}></Button></Tooltip>
        </Space>
    );
};

export default QueryForm;
