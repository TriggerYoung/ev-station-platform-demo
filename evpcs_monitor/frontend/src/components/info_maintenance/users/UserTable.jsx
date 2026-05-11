import React from "react";
import { Table, Tag, Tooltip, Space, Button } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs"; // 处理时间格式
import utc from "dayjs/plugin/utc";
// 扩展 Day.js 以支持 UTC 功能
dayjs.extend(utc);

const roleMap = {
    admin: "管理员",
    operator: "操作员",
    viewer: "访客",
  };
  
  const roleColorMap = {
    admin: "geekblue",
    operator: "green",
    viewer: "volcano",
  };
  

const UserTable = ({ data, loading, pagination, onTableChange, onEdit, onDelete }) => {
    const columns = [
        {
            title: "用户 ID",
            dataIndex: "user_id",
            key: "user_id",
            width: 120,
            sorter: (a, b) => a.user_id - b.user_id, // 启用排序
        },
        {
            title: "用户名（邮箱）",
            dataIndex: "name",
            key: "name",
            width: 250,
            render: (text) => (
                <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${text}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {text}
                </a>
            ), // 使用 Gmail 的邮件链接
        },
        {
            title: "角色",
            key: "tags",
            dataIndex: "tags",
            width: 150,
            filters: [
                { text: "管理员", value: "admin" },
                { text: "操作员", value: "operator" },
                { text: "访客", value: "viewer" },
            ],
            onFilter: (value, record) => record.tags.includes(value), // 修复过滤逻辑
            render: (_, { tags }) =>
                tags.map(tag => (
                  <Tag 
                    color={roleColorMap[tag] || "default"} 
                    key={tag}
                  >
                    {roleMap[tag] || tag}
                  </Tag>
                ))              
        },
        {
            title: "用户创建时间",
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
            fixed: "right", // 固定操作列
            width: 120,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="编辑">
                        <Button shape="circle" onClick={() => onEdit(record)}>
                            <EditOutlined />
                        </Button>
                    </Tooltip>
                    <Tooltip title="删除">
                        <Button shape="circle" danger onClick={() => onDelete(record.user_id)}>
                            <DeleteOutlined />
                        </Button>
                    </Tooltip>
                </Space>
            ),
        }
    ];

    return (
        <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
            }}
            onChange={onTableChange}
            rowKey="user_id"
            scroll={{ x: "max-content" }} // 适应内容宽度，防止换行
        />
    );
};

export default UserTable;
