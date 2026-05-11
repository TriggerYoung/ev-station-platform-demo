// CommentModal.jsx:

import React from "react";
import { Modal, Input } from "antd";

const { TextArea } = Input;

const CommentModal = ({ visible, replyingTo, content, setContent, onCancel, onSubmit }) => (
    <Modal
        title={replyingTo ? "回复评论" : "发表留言"}
        open={visible}
        onCancel={onCancel}
        onOk={onSubmit}
        okText="发表"
        cancelText="取消"
    >
        {replyingTo && (
            <div style={{ marginBottom: 12, background: "#f5f5f5", padding: 12, borderRadius: 6 }}>
                <strong>{replyingTo.username}</strong>: {replyingTo.content}
            </div>
        )}
        <TextArea
            style={{ marginBottom: 12 }}
            rows={6}
            maxLength={200}
            showCount
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyingTo ? "请输入你的回复..." : "请输入你的留言..."}
        />
    </Modal>
);

export default CommentModal;
