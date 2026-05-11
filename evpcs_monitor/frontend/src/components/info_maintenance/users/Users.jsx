import React, { useEffect, useState } from "react";
import { Row, Col, Button, Input, message, Form, Tooltip } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import axios from "axios";
import UserTable from "./UserTable";
import UserFormModal from "./UserFormModal";
import UserActions from "./UserActions";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const fetchUsers = async (params = {}) => {
    setLoading(true);
    try {
      const response = await axios.get("/api/users", {
        params: {
          page: params.page || pagination.current,
          pageSize: params.pageSize || pagination.pageSize,
          search: params.search || "",
          sortField: params.sortField || "created_at",
          sortOrder: params.sortOrder || "DESC",
        }
      });

      if (response.data.success) {
        setUsers(response.data.data.items.map(user => ({
          key: user.user_id,
          ...user,
          tags: [user.role],
          name: user.username
        })));
        setPagination(prev => ({
          ...prev,
          current: params.page || prev.current,
          pageSize: params.pageSize || prev.pageSize,
          total: response.data.data.total,
        }));
      }
    } catch (error) {
      message.error("获取系统用户信息失败。");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    const params = {
      page: newPagination.current,
      pageSize: newPagination.pageSize,
      sortField: sorter.field || "created_at",
      sortOrder: sorter.order ? (sorter.order === "ascend" ? "ASC" : "DESC") : "DESC"
    };
    fetchUsers(params);
  };

  const handleSearch = (value) => {
    fetchUsers({
      search: value,
      page: 1,
      pageSize: pagination.pageSize
    });
  };

  const handleUpdate = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user ? user.name : "",
      password: user ? user.password : "",
      role: user ? user.tags[0] : "viewer",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        const response = await axios.put(`/api/users/${editingUser.user_id}`, values);
        if (response.data.success) {
          message.success("用户信息更新成功！");
        } else {
          message.error("用户信息更新失败。");
        }
      } else {
        const response = await axios.post(`/api/users`, values);
        if (response.data.success) {
          message.success("新增用户成功！");
        } else {
          message.error("新增新增用户失败。");
        }
      }
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers({ page: pagination.current, pageSize: pagination.pageSize });
    } catch (error) {
      message.error("保存用户信息失败。");
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  useEffect(() => {
    fetchUsers({
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortField: "created_at",
      sortOrder: "DESC"
    });
  }, []);

  return (
    <div>
      <Row gutter={[16, 16]} justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Input.Search
            placeholder="输入用户ID或者用户名进行检索"
            onSearch={handleSearch}
            style={{ width: 300 }}
            allowClear
          />
        </Col>
        <Col>
          <Tooltip title="新增用户">
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => handleUpdate(null)}
            >
            </Button>
          </Tooltip>

        </Col>
      </Row>

      <UserTable
        data={users}
        loading={loading}
        pagination={pagination}
        onTableChange={handleTableChange}
        onEdit={handleUpdate}
        onDelete={(userId) => UserActions.showDeleteConfirm(userId, fetchUsers, pagination)}
      />

      <UserFormModal
        visible={isModalOpen}
        onCancel={handleCancel}
        onSave={handleSave}
        form={form}
        editingUser={editingUser}
      />
    </div>
  );
};

export default Users;