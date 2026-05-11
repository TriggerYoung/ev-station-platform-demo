import React, { useState } from "react";
import { Table } from "antd";

const DataTable = ({ data, columns }) => {
    // 分页状态
    const [pagination, setPagination] = useState({
        current: 1,    // 当前页
        pageSize: 10,  // 每页显示条数
    });

    // 处理分页变更
    const handleTableChange = (pagination) => {
        setPagination({
            ...pagination,
            pageSize: pagination.pageSize,
            current: pagination.current,
        });
    };

    return (
        <Table
            dataSource={data}
            columns={columns}
            rowKey="time"
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                showSizeChanger: true,  // 允许用户改变每页显示条数
                pageSizeOptions: ["10", "20", "50", "100"],  // 可选条数
                showTotal: (total, range) => `${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
            onChange={handleTableChange} // 监听分页变化
            style={{ marginTop: "20px" }}
        />
    );
};

export default DataTable;
