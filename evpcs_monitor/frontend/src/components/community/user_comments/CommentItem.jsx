// CommentItem.jsx:

import React from "react";
import { Button, Space, Tooltip } from "antd";
import { LikeOutlined, LikeFilled } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
// 扩展 Day.js 以支持 UTC 功能
dayjs.extend(utc);


const CommentItem = ({ comment, replies, userId, loadReplies, toggleModal, toggleLike }) => (
    <>
        <strong>{comment.username}</strong>: {comment.content}
        <br />
        <Space>
            <Tooltip title="点赞 / 取消点赞">
                <Button
                    size="small"
                    icon={comment.liked ? <LikeFilled style={{ color: "#1890ff" }} /> : <LikeOutlined />}
                    onClick={() => toggleLike(comment)}
                >
                    {comment.likes}
                </Button>
            </Tooltip>
            {comment.user_id !== userId && (
                <Button size="small" type="link" onClick={() => toggleModal(comment)}>回复</Button>
            )}
        </Space>

        {replies ? (
            <div style={{ marginTop: 8, marginLeft: 24 }}>
                {replies.map((r) => (
                    <div key={r.comment_id} style={{ marginBottom: 8 }}>
                        <strong>{r.username}</strong> 回复 {comment.username}: {r.content}
                        <br />
                        <span style={{ fontSize: 12, color: "#999" }}>
                            {dayjs.utc(r.created_at).format("YYYY-MM-DD HH:mm:ss")}
                        </span>
                    </div>
                ))}
            </div>
        ) : (
            comment.reply_count > 0 && (
                <Button
                    type="link"
                    size="small"
                    onClick={() => loadReplies(comment.comment_id)}
                >
                    展开 {comment.reply_count} 条回复
                </Button>
            )
        )}
    </>
);

export default CommentItem;
