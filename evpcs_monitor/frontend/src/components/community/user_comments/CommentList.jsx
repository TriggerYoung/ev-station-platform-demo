import React from "react";
import { Timeline } from "antd";
import CommentItem from "./CommentItem";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const CommentList = ({ comments, repliesMap, userId, loadReplies, toggleModal, toggleLike }) => {
    // 将评论数据转换为 Timeline 需要的 items 格式
    const timelineItems = comments.map((comment) => ({
        key: comment.comment_id,
        label: dayjs.utc(comment.created_at).format("YYYY-MM-DD HH:mm:ss"),
        children: (
            <CommentItem
                comment={comment}
                replies={repliesMap[comment.comment_id]}
                userId={userId}
                loadReplies={loadReplies}
                toggleModal={toggleModal}
                toggleLike={toggleLike}
            />
        ),
        // 如果需要交替显示可以设置 position
        // position: index % 2 === 0 ? 'left' : 'right'
    }));

    return (
        <Timeline 
            mode="alternate"
            items={timelineItems}
            style={{ marginTop: 24 }}
        />
    );
};

export default CommentList;