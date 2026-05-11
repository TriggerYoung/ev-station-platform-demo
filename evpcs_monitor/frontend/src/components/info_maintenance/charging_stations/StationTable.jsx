// ChargingStationTable.jsx
import React from "react";
import { Table, Tag, Tooltip, Space, Button } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs"; // 处理时间格式
import utc from "dayjs/plugin/utc";
// 扩展 Day.js 以支持 UTC 功能
dayjs.extend(utc);

const StationTable = ({
    data,
    loading,
    pagination,
    onTableChange,
    onEdit,
    onDelete,
    selectedRowKeys,
    setSelectedRowKeys,
}) => {
    const rowSelection = {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
    };

    const columns = [
        {
            title: "充电站 ID",
            dataIndex: "station_id",
            key: "station_id",
            width: 100,
            fixed: "left",
        },
        {
            title: "经纬度坐标",
            key: "location",
            width: 220,
            render: (_, record) => {
                const lon = record.longitude;
                const lat = record.latitude;
                // 根据正负判断东经/西经、北纬/南纬，并添加度符号
                const lonText = (lon >= 0 ? "E " : "W ") + Math.abs(lon) + "°";
                const latText = (lat >= 0 ? "N " : "S ") + Math.abs(lat) + "°";
                return <em>{lonText}, {latText}</em>;
            },
            sorter: (a, b) => a.longitude - b.longitude || a.latitude - b.latitude,
        },
        {
            title: "地址名称",
            dataIndex: "address",
            key: "address",
            width: 200,
            ellipsis: true,
            render: (text, record) => {
                // 生成腾讯地图导航链接
                const link = `https://apis.map.qq.com/uri/v1/routeplan?type=drive&from=我的位置&to=${encodeURIComponent(text)}&tocoord=${record.latitude},${record.longitude}`;
                return <a href={link} target="_blank" rel="noopener noreferrer">{text}</a>;
            },
        },
        {
            title: "充电桩数",
            dataIndex: "pile_count",
            key: "pile_count",
            width: 120,
            sorter: (a, b) => a.pile_count - b.pile_count,
        },
        {
            title: "状态",
            dataIndex: "status",
            key: "status",
            width: 50,
            render: (status) => {
                let color = status === 1 ? "green" : status === 2 ? "volcano" : "default";
                let text = status === 1 ? "在线" : status === 2 ? "维护中" : "离线";
                return <Tag color={color}>{text}</Tag>;
            },
            filters: [
                { text: "在线", value: 1 },
                { text: "维护中", value: 2 },
                { text: "离线", value: 0 },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: "停车收费",
            dataIndex: "has_parking_fee",
            key: "has_parking_fee",
            width: 130,
            render: (type) => {
                if (type === 1) {
                    return <Tag color="orange">是</Tag>;
                } else if (type === 0) {
                    return <Tag color="blue">否</Tag>;
                } else {
                    return <Tag>Unknown</Tag>;
                }
            },
            filters: [
                { text: "是", value: 1 },
                { text: "否", value: 0 },
            ],
            onFilter: (value, record) => record.has_parking_fee === value,
        },
        {
            title: "行政区编码",
            dataIndex: "adcode",
            key: "adcode",
            width: 120,
        },
        {
            title: "信息创建时间",
            dataIndex: "created_at",
            key: "created_at",
            width: 180,
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
            render: (text) => dayjs.utc(text).format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            title: "最后更新时间",
            dataIndex: "updated_at",
            key: "updated_at",
            width: 180,
            sorter: (a, b) => dayjs(a.updated_at).unix() - dayjs(b.updated_at).unix(),
            render: (text) => dayjs.utc(text).format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            title: "操作",
            key: "action",
            fixed: "right",
            width: 120,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="编辑">
                        <Button shape="circle" onClick={() => onEdit(record)}>
                            <EditOutlined />
                        </Button>
                    </Tooltip>
                    <Tooltip title="删除">
                        <Button shape="circle" danger onClick={() => onDelete([record.station_id])}>
                            <DeleteOutlined />
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
            }}
            onChange={onTableChange}
            rowKey="station_id"
            scroll={{ x: "max-content" }}
        />
    );
};

export default StationTable;
