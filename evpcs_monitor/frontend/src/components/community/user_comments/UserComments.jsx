// UserComments.jsx
import React, { useState, useEffect } from "react";
import { Card, Button, message, Spin, Menu } from "antd";
import { MessageOutlined, SendOutlined, LoginOutlined, LoadingOutlined } from "@ant-design/icons";
import axios from "axios";
import CommentList from "./CommentList";
import CommentModal from "./CommentModal";
import HotComments from "./HotComments";
import MyComments from "./MyComments";
import Messages from "./Messages";
import WordCloudView from "./WordCloudView";

const PAGE_SIZE = 10;

const menuItems = [
    { key: "latest", label: "最新" },
    { key: "hot", label: "热门" },
    { key: "my_comments", label: "我的" },
    { key: "messages", label: "消息" },
    { key: "wordcloud", label: "词云" },
];

const UserComments = ({ isLoggedIn }) => {
    const user_id = localStorage.getItem("user_id");
    const [activeKey, setActiveKey] = useState("latest");

    const [comments, setComments] = useState([]);
    const [repliesMap, setRepliesMap] = useState({});
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [visibleModal, setVisibleModal] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [content, setContent] = useState("");

    const loadComments = async (reset = false) => {
        if (loading || (!reset && !hasMore)) return;
        setLoading(true);
        try {
            const targetPage = reset ? 1 : page;
            const res = await axios.get("/api/community/comments", {
                params: { page: targetPage, page_size: PAGE_SIZE, user_id },
            });
            const newComments = res.data.data;
            setComments(reset ? newComments : [...comments, ...newComments]);
            setPage(targetPage + 1);
            setHasMore(newComments.length === PAGE_SIZE);
            if (reset) setRepliesMap({});
        } catch {
            message.error("获取评论失败");
        } finally {
            setLoading(false);
        }
    };

    const loadReplies = async (parentId) => {
        if (repliesMap[parentId]) return;
        try {
            const res = await axios.get("/api/community/comments/replies", {
                params: { parent_id: parentId },
            });
            setRepliesMap({
                ...repliesMap,
                [parentId]: res.data.data,
            });
        } catch {
            message.error("获取回复失败");
        }
    };

    const toggleModal = (comment = null) => {
        setReplyingTo(comment);
        setContent("");
        setVisibleModal(true);
    };

    const submitComment = async () => {
        if (!content.trim()) return message.warning("请输入内容");
        try {
            await axios.post("/api/community/comments", {
                user_id,
                content,
                parent_id: replyingTo?.comment_id || null,
            });
            message.success(replyingTo ? "回复成功" : "留言成功");
            setVisibleModal(false);
            loadComments(true);
        } catch {
            message.error("提交失败");
        }
    };

    const toggleLike = async (comment) => {
        try {
            await axios.post(`/api/community/comments/like/${comment.comment_id}`, { user_id });
            loadComments(true);
        } catch {
            message.error("点赞失败");
        }
    };

    useEffect(() => {
        if (activeKey === "latest") loadComments(true);
    }, [activeKey]);

    const renderContent = () => {
        switch (activeKey) {
            case "latest":
                return (
                    <>
                        <CommentList
                            comments={comments}
                            repliesMap={repliesMap}
                            userId={user_id}
                            loadReplies={loadReplies}
                            toggleModal={toggleModal}
                            toggleLike={toggleLike}
                        />
                        {loading && <Spin indicator={<LoadingOutlined />} style={{ display: "block", margin: "16px auto" }} />}
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
            case "hot":
                return <HotComments userId={user_id}  toggleModal={toggleModal}/>;
            case "my_comments":
                return <MyComments userId={user_id} toggleModal={toggleModal}/>;
            case "messages":
                return <Messages userId={user_id} />;
            case "wordcloud":
                return <WordCloudView />;
            default:
                return null;
        }
    };

    return (
        <>
            <Card
                className="community-card"
                hoverable
                title={
                    <span>
                        <MessageOutlined /> 我有话说
                    </span>
                }
                extra={
                    isLoggedIn ? (
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <Menu
                                mode="horizontal"
                                theme="light"
                                selectedKeys={[activeKey]}
                                style={{ fontSize: "16px" }}
                                onClick={(e) => setActiveKey(e.key)}
                                items={menuItems}
                            />
                            <Button type="primary" icon={<SendOutlined />} onClick={() => toggleModal()}>
                                发表留言
                            </Button>
                        </div>
                    ) : (
                        <Button type="link" icon={<LoginOutlined />} onClick={() => message.info("请先登录")}>
                            登录后留言
                        </Button>
                    )
                }
            >
                {/* 卡片内容 */}
                <div className="scroll-outer">
                    <div className="scroll-inner-static">{renderContent()}</div>
                </div>
            </Card>

            {/* 留言框 */}
            <CommentModal
                visible={visibleModal}
                replyingTo={replyingTo}
                content={content}
                setContent={setContent}
                onCancel={() => setVisibleModal(false)}
                onSubmit={submitComment}
            />
        </>
    );
};

export default UserComments;
