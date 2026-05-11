// HotComments.jsx
import React, { useEffect, useState } from "react";
import { List, Button, message, Spin, Tooltip, Space } from "antd";
import { LikeOutlined, LikeFilled } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const PAGE_SIZE = 10;

const HotComments = ({ userId, toggleModal }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [repliesMap, setRepliesMap] = useState({});
    const [expanded, setExpanded] = useState({});

    // 拉热门评论
    const loadComments = async (reset = false) => {
        if (loading || (!reset && !hasMore)) return;
        setLoading(true);
        try {
            const targetPage = reset ? 1 : page;
            const { data } = await axios.get("/api/community/comments/hot", {
                params: { page: targetPage, page_size: PAGE_SIZE, user_id: userId },
            });
            const newComments = data.data;
            setComments(reset ? newComments : [...comments, ...newComments]);
            setPage(targetPage + 1);
            setHasMore(newComments.length === PAGE_SIZE);
            if (reset) {
                setRepliesMap({});
                setExpanded({});
            }
        } catch {
            message.error("加载热门评论失败");
        } finally {
            setLoading(false);
        }
    };

    // 拉取二级回复
    const loadReplies = async (parentId) => {
        if (repliesMap[parentId]) return;
        try {
            const { data } = await axios.get("/api/community/comments/replies", {
                params: { parent_id: parentId },
            });
            setRepliesMap((m) => ({ ...m, [parentId]: data.data }));
        } catch {
            message.error("加载回复失败");
        }
    };

    // 点赞
    const toggleLike = async (comment) => {
        try {
            await axios.post(`/api/community/comments/like/${comment.comment_id}`, { user_id: userId });
            loadComments(true);
        } catch {
            message.error("点赞失败");
        }
    };

    const handleToggleReplies = async (commentId) => {
        await loadReplies(commentId);
        setExpanded((e) => ({ ...e, [commentId]: !e[commentId] }));
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
                        style={{ flexDirection: "column", alignItems: "stretch", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}
                    >
                        <div style={{ marginBottom: 4 }}>
                            <strong>{comment.username}</strong>：{comment.content}
                        </div>
                        <div style={{ color: "#999", fontSize: 12, marginBottom: 8 }}>
                            {dayjs.utc(comment.created_at).format("YYYY-MM-DD HH:mm:ss")}
                        </div>

                        {/* 操作按钮区域 */}
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
                                onClick={() => toggleModal(comment, () => loadComments(true))} // 添加刷新回调
                            >
                                回复
                            </Button>

                            {comment.reply_count > 0 && (
                                <Button
                                    type="link"
                                    size="small"
                                    style={{ padding: 0 }}
                                    onClick={() => handleToggleReplies(comment.comment_id)}
                                >
                                    {expanded[comment.comment_id] ? "收起回复" : `展开${comment.reply_count}条回复`}
                                </Button>
                            )}
                        </Space>

                        {/* 回复列表 */}
                        {expanded[comment.comment_id] && repliesMap[comment.comment_id] && (
                            <List
                                size="small"
                                dataSource={repliesMap[comment.comment_id]}
                                renderItem={(reply) => (
                                    <List.Item style={{ marginLeft: 32, borderBottom: "none", padding: "4px 0" }}>
                                        <div>
                                            <strong>{reply.username}</strong>：{reply.content}
                                            <div style={{ color: "#999", fontSize: 12, marginTop: 2 }}>
                                                {dayjs.utc(reply.created_at).format("YYYY-MM-DD HH:mm:ss")}
                                            </div>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        )}
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

export default HotComments;
