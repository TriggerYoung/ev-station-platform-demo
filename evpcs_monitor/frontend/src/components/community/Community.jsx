// Community.jsx

import React from "react";
import { Typography, Divider, Row, Col, Tag, Avatar, Button } from "antd";
import { LoginOutlined, UserOutlined } from "@ant-design/icons";
import IndustryNews from "./IndustryNews";
import UserComments from "./user_comments/UserComments";
import "../../assets/css/Community.css";
import { clearDemoGuestSession, getAppRole } from "../../demo/demoMode";

const { Title, Paragraph } = Typography;

const Community = () => {
  const role = getAppRole();
  const username = localStorage.getItem("username");
  const isLoggedIn = !!role;

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    clearDemoGuestSession();
    window.location.reload(); // 刷新当前页 
  };

  return (
    <div className="community-container">
      <div className="community-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} className="community-title">⚡ 社区交流平台</Title>
        </div>

        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar style={{ backgroundColor: '#87d068' }}>
              {username?.slice(0, 3) || '用户'}
            </Avatar>
            <Button type="primary" onClick={handleLogout}>
              <LoginOutlined />
            </Button>
          </div>
        ) : (
          <Button
            type="primary"
            id="loginButton"
            onClick={() => {
              const currentPath = window.location.pathname + window.location.search;
              window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
            }}
          >
            <UserOutlined /> 登录
          </Button>

        )}
      </div>

      <Paragraph className="community-intro">
        欢迎来到社区交流平台，这里是用户与平台互动的桥梁。在这里查看最新行业资讯、分享建议、参与讨论，让出行更美好。
      </Paragraph>

      <Divider />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <IndustryNews />
        </Col>
        <Col xs={24} md={12}>
          <UserComments isLoggedIn={isLoggedIn} />
        </Col>
      </Row>

    </div>
  );
};

export default Community;
