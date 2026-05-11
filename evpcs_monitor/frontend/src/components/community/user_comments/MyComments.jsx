import React, { useEffect, useState } from "react";
import { List, Button, message, Spin, Tooltip, Space, Popconfirm } from "antd";
import { LikeOutlined, LikeFilled, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const PAGE_SIZE = 10;

const MyComments = ({ userId, toggleModal }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadComments = async (reset = false) => {
        if (loading || (!reset && !hasMore)) return;
        setLoading(true);
        try {
            const targetPage = reset ? 1 : page;
            const { data } = await axios.get("/api/community/comments/my", {
                params: { page: targetPage, page_size: PAGE_SIZE, user_id: userId },
            });
            const newComments = data.data;
            setComments(reset ? newComments : [...comments, ...newComments]);
            setPage(targetPage + 1);
            setHasMore(newComments.length === PAGE_SIZE);
        } catch {
            message.error("加载我的留言失败");
        } finally {
            setLoading(false);
        }
    };

    const toggleLike = async (comment) => {
        try {
            await axios.post(`/api/community/comments/like/${comment.comment_id}`, { user_id: userId });
            loadComments(true);
        } catch {
            message.error("点赞失败");
        }
    };

    const deleteComment = async (commentId) => {
        try {
            await axios.delete(`/api/community/comments/${commentId}`, {
                data: { user_id: userId },
            });
            message.success("删除成功");
            loadComments(true);
        } catch {
            message.error("删除失败");
        }
    };

    useEffect(() => {
        loadComments(true);
    }, []);

    return (
        <>
            <List
                dataSource={comments}
                renderItem={(comment) => (
                    <List.Item
                        style={{
                            flexDirection: "column",
                            alignItems: "stretch",
                            paddingBottom: 12,
                            borderBottom: "1px solid #f0f0f0",
                        }}
                    >
                        <div style={{ marginBottom: 4 }}>
                            <strong>{comment.username}</strong>
                            {comment.parent_id && comment.parent_author && (
                                <span style={{ marginLeft: 8, fontSize: 12, color: "#999" }}>
                                    回复了 <strong>@{comment.parent_author}</strong>
                                </span>
                            )}
                            ：{comment.content}
                        </div>
                        <div style={{ color: "#999", fontSize: 12, marginBottom: 8 }}>
                            {dayjs.utc(comment.created_at).format("YYYY-MM-DD HH:mm:ss")}
                        </div>

                        <Space size="middle" style={{ marginBottom: 8 }}>
                            <Tooltip title="点赞 / 取消点赞" key="like">
                                <Space onClick={() => toggleLike(comment)} style={{ cursor: "pointer", userSelect: "none" }}>
                                    {comment.liked ? <LikeFilled style={{ color: "#eb2f96" }} /> : <LikeOutlined />}
                                    <span>{comment.likes}</span>
                                </Space>
                            </Tooltip>

                            <Button
                                type="link"
                                size="small"
                                style={{ padding: 0 }}
                                onClick={() => toggleModal(comment, () => loadComments(true))}
                            >
                                回复
                            </Button>

                            <Popconfirm
                                title="确定要删除这条留言吗？"
                                onConfirm={() => deleteComment(comment.comment_id)}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button
                                    type="link"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    danger
                                    style={{ padding: 0 }}
                                >
                                    删除
                                </Button>
                            </Popconfirm>
                        </Space>
                    </List.Item>
                )}
            />

            {loading && <Spin style={{ display: "block", margin: "16px auto" }} />}
            {!loading && hasMore && (
                <div style={{ textAlign: "center", marginTop: 16 }}>
                    <Button onClick={() => loadComments()}>显示更多</Button>
                </div>
            )}
            {!loading && !hasMore && (
                <div style={{ textAlign: "center", marginTop: 16, color: "#999" }}>已经到底啦~</div>
            )}
        </>
    );
};

export default MyComments;
