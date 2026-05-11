// PileTable.jsx
import React from "react";
import { Table, Tag, Tooltip, Button, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
// 扩展 Day.js 以支持 UTC 功能
dayjs.extend(utc);

const PileTable = ({
    pileData,
    onEdit,
    onDelete,
    selectedRowKeys,   // 接收父组件传递的选中状态
    onSelectChange     // 接收父组件传递的状态更新函数
}) => {

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const columns = [
        {
            title: "充电桩 ID",
            dataIndex: "pile_id",
            key: "pile_id",
            width: 140,
            fixed: "left",
        },
        {
            title: "充电类型",
            dataIndex: "charging_type",
            key: "charging_type",
            width: 160,
            align: "center",
            filters: [
                { text: "AC (交流)", value: "0" },
                { text: "DC (直流)", value: "1" }
            ],
            onFilter: (value, record) => record.charging_type === value,
            render: (type) => (
                <Tag color={type === "1" ? "blue" : "green"}>
                    {type === "1" ? "DC (直流)" : "AC (交流)"}
                </Tag>
            ),
        },
        {
            title: "充电功率 (KW)",
            dataIndex: "charging_power",
            key: "charging_power",
            width: 180,
            align: "center",
            sorter: (a, b) => a.charging_power - b.charging_power,
        },
        {
            title: "接口类型",
            dataIndex: "connector_type",
            key: "connector_type",
            width: 180,
            align: "center",
            render: (text) => <Tag color="purple">{text}</Tag>,
        },
        {
            title: "位置描述",
            dataIndex: "location_desc",
            key: "location_desc",
            width: 140,
            align: "center",
            render: (location) => (
                <Tooltip title={`Floor: ${location}`}>
                    <Tag color="geekblue">{location}</Tag>
                </Tooltip>
            ),
        },
        {
            title: "是否需要维修",
            dataIndex: "maintenance_needed",
            key: "maintenance_needed",
            width: 160,
            align: "center",
            filters: [
                { text: "正常", value: 0 },
                { text: "需要维护", value: 1 }
            ],
            onFilter: (value, record) => record.maintenance_needed === value,
            render: (needed) => (
                <Tag color={needed === 1 ? "volcano" : "green"}>
                    {needed === 1 ? "需要维护" : "正常"}
                </Tag>
            ),
        },
        {
            title: "信息创建时间",
            dataIndex: "created_at",
            key: "created_at",
            width: 200,
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
            render: (text) => dayjs.utc(text).format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            title: "最后更新时间",
            dataIndex: "updated_at",
            key: "updated_at",
            width: 200,
            sorter: (a, b) => dayjs(a.updated_at).unix() - dayjs(b.updated_at).unix(),
            render: (text) => dayjs.utc(text).format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            title: "操作",
            key: "action",
            width: 160,
            align: "center",
            fixed: "right",
            render: (_, record) => (
                <Space>
                    <Tooltip title="编辑">
                        <Button icon={<EditOutlined />} onClick={() => onEdit(record)} shape="circle" />
                    </Tooltip>
                    <Tooltip title="删除">
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            shape="circle"
                            onClick={() => onDelete([record.pile_id])} // 兼容单个删除
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Table
            style={{ marginTop: 16, borderRadius: 8 }}
            rowSelection={rowSelection} // 添加复选框
            columns={columns}
            dataSource={pileData}
            rowKey="pile_id"
            bordered
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "暂无充电桩数据，请选择充电站点以查看数据..." }}
        />
    );
};

export default PileTable;
