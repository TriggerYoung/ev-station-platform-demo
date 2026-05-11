import React, { useEffect, useState } from "react";
import { List, Typography, Spin } from "antd";
import axios from "axios";
import moment from "moment";

const { Text } = Typography;

const Messages = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios
      .get(`/api/community/comments/messages/${userId}`)
      .then((res) => {
        setMessages(res.data.data); // 假设返回的数据是data数组
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div>
      {loading ? (
        <Spin />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={messages}
          renderItem={(item) => (
            <List.Item>
              <Text strong>{item.username}</Text>{" "}
              回复了你的评论：“
              <Text code>{item.parent_content}</Text>”
              <br />
              回复内容：<Text type="secondary">“{item.content}”</Text>
              <div style={{ fontSize: 12, color: "#999" }}>
                {moment(item.created_at).format("YYYY-MM-DD HH:mm")}
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default Messages;
