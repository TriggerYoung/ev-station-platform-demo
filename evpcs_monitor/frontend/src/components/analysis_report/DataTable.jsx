// DataTable.jsx
import React from "react";
import { Table } from "antd";
import moment from "moment";

const DataTable = ({ rawData }) => {
    // rawData形如 { time: [...], volume: [...] }
    // 需要转换为table可用的datasource
    if (!rawData || !rawData.time || !rawData.volume) {
        return <div>暂无数据</div>;
    }

    // 将后端返回的 time、volume 列映射为表格需要的数组
    const tableData = rawData.time.map((t, index) => ({
        key: index,            // rowKey
        time: t,               // 时间
        volume: rawData.volume[index],  // 充电量
    }));

    // 定义表格列
    const columns = [
        {
            title: "时间",
            dataIndex: "time",
            key: "time",
            render: (text) => moment.utc(text).format("YYYY-MM-DD HH:mm:ss"),
            sorter: (a, b) => new Date(a.time) - new Date(b.time),
        },
        {
            title: "充电量",
            dataIndex: "volume",
            key: "volume",
            sorter: (a, b) => a.volume - b.volume,
        },
    ];

    return (
        <Table
            rowKey="key"                   // 必须指定 rowKey，保证行数据可唯一识别
            dataSource={tableData}
            columns={columns}
            bordered                       // 显示表格边框
            size="middle"                 // 表格尺寸：'large' | 'middle' | 'small'
            pagination={{
                defaultPageSize: 10,        // 默认每页条数
                showSizeChanger: true,      // 允许切换每页条数
                pageSizeOptions: ["10", "20", "50", "100"],
                total: tableData.length,    // 总数据条数
            }}
        />
    );
};

export default DataTable;
