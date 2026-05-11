import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import axios from "axios";

const WordCloudView = () => {
    const [imageData, setImageData] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("/api/community/comments/wordcloud")  // 你后端的接口路径
            .then(res => {
                setImageData(res.data.image);  // base64 字符串
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            {loading ? (
                <Spin tip="加载词云中..." />
            ) : (
                <img
                    src={`data:image/png;base64,${imageData}`}
                    alt="词云图"
                    style={{ maxWidth: "100%", borderRadius: "12px", boxShadow: "0 0 12px rgba(0,0,0,0.2)" }}
                />
            )}
        </div>
    );
};

export default WordCloudView;
