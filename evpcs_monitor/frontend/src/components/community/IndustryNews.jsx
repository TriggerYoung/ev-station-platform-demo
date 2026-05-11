import React, { useEffect, useRef, useState } from "react";
import { Card, Spin, List, Menu } from "antd";
import { SoundOutlined } from "@ant-design/icons";
import axios from "axios";

const menuItems = [
  { key: "infrastructure", label: "充电基础设施" },
  { key: "ev_trends", label: "新能源汽车" },
  { key: "battery_tech", label: "电池与技术" },
  { key: "clean_energy", label: "清洁能源" },
  { key: "policies", label: "政策与法规" },
];

const SCROLL_SPEED = 0.5; // 每帧滚动速度，单位 px

const IndustryNews = () => {
  const [activeKey, setActiveKey] = useState("infrastructure");
  const [newsData, setNewsData] = useState({});
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const animationFrame = useRef(null);
  const isPaused = useRef(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get("/api/community/news");
        if (res.data.success) {
          setNewsData(res.data.data);
        }
      } catch (error) {
        console.error("新闻获取失败", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // 滚动动画
  useEffect(() => {
    const el = scrollRef.current;
    let offset = 0;

    const step = () => {
      if (!isPaused.current && el) {
        offset += SCROLL_SPEED;
        if (offset >= el.scrollHeight / 2) {
          offset = 0;
        }
        el.style.transform = `translateY(-${offset}px)`;
      }
      animationFrame.current = requestAnimationFrame(step);
    };

    animationFrame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame.current);
  }, [activeKey]);

  const currentNews = newsData[activeKey] || [];

  const duplicatedNews = [...currentNews, ...currentNews];

  return (
    <Card
      title={<span><SoundOutlined /> 行业动态</span>}
      className="community-card"
      hoverable
      extra={
        <Menu
          mode="horizontal"
          theme="light"
          selectedKeys={[activeKey]}
          style={{ fontSize: "16px" }}
          onClick={(e) => setActiveKey(e.key)}
          items={menuItems}
        />
      }
    >
      <Spin spinning={loading}>
        <div
          className="scroll-outer"
          onMouseEnter={() => (isPaused.current = true)}
          onMouseLeave={() => (isPaused.current = false)}
        >
          <div className="scroll-inner" ref={scrollRef}>
            {duplicatedNews.map((item, index) => (
              <div className="scroll-item" key={index}>
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "20px"}}>
                  <strong>{item.title}</strong>
                </a>
                <div style={{ fontSize: "16px", color: "#888" }}>
                  来源：{item.source} ｜ {item.publish_time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Spin>
    </Card>
  );
};

export default IndustryNews;
