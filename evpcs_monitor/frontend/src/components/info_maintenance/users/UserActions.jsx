import { message, Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import axios from "axios";
const { confirm } = Modal;

const UserActions = {
    handleDelete: async (userId, fetchUsers, pagination) => {
        try {
            const response = await axios.delete(`/api/users/${userId}`);
            if (response.data.success) {
                message.success("删除用户成功！");
                fetchUsers({ page: pagination.current, pageSize: pagination.pageSize });
            } else {
                message.error("删除用户失败。");
            }
        } catch (error) {
            message.error("删除用户时出错。");
        }
    },

    showDeleteConfirm: (userId, fetchUsers, pagination) => {
        confirm({
            title: "确定删除此用户？",
            icon: <ExclamationCircleOutlined />,
            content: "该操作不能被撤销，请谨慎操作。",
            okText: "确认",
            okType: "danger",
            cancelText: "取消",
            onOk() {
                UserActions.handleDelete(userId, fetchUsers, pagination);
            },
        });
    },
};

export default UserActions;