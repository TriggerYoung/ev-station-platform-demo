import React from "react";
import { Modal, Form, Input, Select } from "antd";

const UserFormModal = ({ visible, onCancel, onSave, form, editingUser }) => {
    return (
        <Modal
            title={editingUser ? "编辑用户信息" : "新增用户信息"}
            open={visible}
            onOk={onSave}
            onCancel={onCancel}
            okText="保存"
            cancelText="取消"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                        { required: true, message: "请输入用户名（邮箱）!" },
                        { type: "email", message: "用户名必须为有效的邮箱格式!" },
                    ]}
                >
                    <Input placeholder="输入邮箱" />
                </Form.Item>
                <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: "请输入密码！" }]}
                >
                    <Input.Password placeholder="输入密码" />
                </Form.Item>
                <Form.Item
                    name="role"
                    label="角色"
                    rules={[{ required: true, message: "请选择一个角色!" }]}
                >
                    <Select>
                        <Select.Option value="admin">管理员</Select.Option>
                        <Select.Option value="operator">操作员</Select.Option>
                        <Select.Option value="viewer">访客</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default UserFormModal;