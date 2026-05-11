// Intro.jsx
import React, { useState, useEffect, useRef } from "react";
import { Layout, Menu, Card, Button, Input, message, Typography, Row, Col, Image, Modal, FloatButton, Tour, Avatar } from "antd";
import { UserOutlined, LoginOutlined, SearchOutlined, ExclamationCircleOutlined, ThunderboltTwoTone } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import maintenanceImg from "../assets/images/maintenance.jpg";
import networkImg from "../assets/images/network.png";
import datapanelImg from "../assets/images/datapanel.png";
import reportImg from "../assets/images/report.png";
import businessImg from "../assets/images/business.jpg";
import communityImg from "../assets/images/community.jpg";
const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;
const { Search } = Input;

// 系统功能模块定义
const MODULES = [
  {
    key: "info_maintenance",
    title: "信息维护",
    description: "查看和更新系统数据，包括充电站、充电桩、用户管理等。",
    image: maintenanceImg,
    path: "/info_maintenance",
  },
  {
    key: "network_analysis",
    title: "区域充电网络分析",
    description: "查看不同区域的充电基础设施布局，分析当前充电站布局的合理性。",
    image: networkImg,
    path: "/network_analysis",
  },
  {
    key: "analysis_report",
    title: "智能分析报告",
    description: "基于充电站的历史充电数据的智能分析平台，自动生成报告辅助决策。",
    image: reportImg,
    path: "/analysis_report",
  },
  {
    key: "data_panel",
    title: "数据可视化大屏",
    description: "实时展示区域充电基础设施的总体运行数据和使用情况。",
    image: datapanelImg,
    path: "/data_panel",
  },
  {
    key: "community",
    title: "充电社区",
    description: "聚焦行业新闻、用户反馈与建言献策，构建公共充电生态的开放交流平台。",
    image: communityImg,
    path: "/community",
  },
  {
    key: "business",
    title: "商务合作",
    description: "汇聚充电领域合作需求，支持意向提交与快速对接，助力产业协同发展。",
    image: businessImg,
    path: "/business",
  },
];
// 定义Intro组件
const Intro = () => {
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const introContentRef = useRef(null);     // 记录页面内容容器
  const originalHtml = useRef("");          // 存储容器的原始HTML

  // 组件挂载时读取本地存储的 role 和 username
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedUsername = localStorage.getItem("username");
    if (storedRole) setRole(storedRole);
    if (storedUsername) setUsername(storedUsername);
    // console.log("user_id:", localStorage.getItem("user_id"));
  }, []);

  // 在初次加载时获取原始HTML
  useEffect(() => {
    if (introContentRef.current) {
      originalHtml.current = introContentRef.current.innerHTML;
    }
  }, []);

  // 定义一个简单的高亮函数
  const highlightText = (html, keyword) => {
    // 若keyword为空, 返回原始html
    if (!keyword) return html;
    // 使用正则替换, 高亮匹配到的内容
    const regex = new RegExp(`(${keyword})`, "gi");
    return html.replace(regex, '<mark>$1</mark>');
  };

  // 搜索处理函数
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (introContentRef.current) {
      // 恢复原始HTML
      introContentRef.current.innerHTML = originalHtml.current;
      // 如果有搜索关键字，则执行替换
      if (value.trim()) {
        const newHtml = highlightText(originalHtml.current, value.trim());
        introContentRef.current.innerHTML = newHtml;
      }
    }
  };

  // Tour相关
  // 初始设置为未登录时才显示 Tour
  const [tourOpen, setTourOpen] = useState(() => {
    return !localStorage.getItem("role");  // role 不存在则为 true（显示）
  });
  const tourSteps = [
    {
      title: "登录与权限",
      description: "点击登录按钮登录系统, 以使用更多功能",
      target: () => document.querySelector("#loginButton"),
    },
    {
      title: "搜索功能",
      description: "在这里输入关键字, 系统将高亮当前页面的匹配内容",
      target: () => document.querySelector("#searchInput"),
    },
  ];

  // 登出处理函数
  const handleLogout = () => {
    // 显示确认对话框
    Modal.confirm({
      title: "确认登出",
      content: "您确定要退出登录吗？",
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        // 用户点击确认时执行的操作
        localStorage.removeItem("role"); // 删除本地存储的角色信息
        setRole(null); // 更新角色状态
        message.success("用户已登出！"); // 显示登出成功消息
        // navigate("/login"); // 跳转到登录页面
      },
      onCancel: () => {
        // 用户点击取消时的操作
        message.info("已取消登出操作");
      },
    });
  };
  // 访问控制：检查用户是否登录并根据角色判断是否允许访问模块
  const handleProtectedNavigation = (url, moduleName) => {
    if (!role && moduleName !== "business" && moduleName !== "community") {
      message.warning({
        content: "请先登录后访问该模块！",
        icon: <ExclamationCircleOutlined />,
        duration: 2,
      });
      navigate("/login");
      return;
    }

    if (
      role === "viewer" &&
      (moduleName === "info_maintenance" || moduleName === "analysis_report")
    ) {
      message.warning({
        content: "当前用户无访问权限！",
        icon: <ExclamationCircleOutlined />,
        duration: 2,
      });
      return;
    }

    window.open(url, "_blank");
  };


  return (
    <Layout>
      {/* 顶部导航栏 */}
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#001529",
          padding: "0 20px",
        }}
      >
        <Title level={3} style={{ color: "#fff", margin: 0 }}>
          <i>ChargeMind</i> <ThunderboltTwoTone twoToneColor="#52c41a" /> 电动汽车公共充电基础设施管理监测分析系统
        </Title>
        {role ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar style={{ backgroundColor: '#87d068' }}>
              {username?.slice(0, 3)}
            </Avatar>
            <Button type="primary" onClick={handleLogout}>
              <LoginOutlined />
            </Button>
          </div>
        ) : (
          <Button type="primary" href="/login" id="loginButton">
            <UserOutlined /> 登录
          </Button>
        )}

      </Header>

      {/* 菜单导航栏 + 搜索框 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "#f0f2f5",
        }}
      >
        {/* 菜单导航栏 */}
        <Menu
          mode="horizontal"
          theme="light"
          defaultSelectedKeys={["home"]}
          style={{ flex: 1, fontSize: "16px" }}
          items={[
            { key: "home", label: "首页" },
            {
              key: "info",
              label: "信息维护",
              onClick: () =>
                handleProtectedNavigation("/info_maintenance", "info_maintenance"),
            },
            {
              key: "analysis",
              label: "数据分析",
              children: [
                {
                  key: "network_analysis",
                  label: "区域充电网络分析",
                  onClick: () =>
                    handleProtectedNavigation(
                      "/network_analysis",
                      "network_analysis"
                    ),
                },

                {
                  key: "analysis_report",
                  label: "智能分析报告",
                  onClick: () =>
                    handleProtectedNavigation("/analysis_report", "analysis_report"),
                },
              ],
            },
            {
              key: "data_panel",
              label: "数据大屏",
              onClick: () =>
                handleProtectedNavigation("/data_panel", "data_panel"),
            },
            {
              key: "community",
              label: "充电社区",
              onClick: () => handleProtectedNavigation("/community", "community"),
            },
            {
              key: "business",
              label: "商务合作",
              onClick: () => handleProtectedNavigation("/business", "business"),
            },
          ]}
        />
        {/* 搜索框 */}
        <Search
          id="searchInput"
          placeholder="搜索..."
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 250, marginLeft: "20px" }}
          onSearch={handleSearch}
        />
      </div>

      {/* 主要内容: 用 ref 包裹, 以便搜索功能在此范围内生效 */}
      <Content style={{ padding: "5px 20px" }} ref={introContentRef}>
        {/* 系统概述 */}
        <Card>
          <Title level={2} style={{ textAlign: "center" }}>
            --系统概述--
          </Title>
          <Paragraph style={{ textAlign: "center", fontSize: "16px" }}>
            本平台致力于提供公共充电基础设施的实时监控与综合分析，
            全面涵盖充电站的运行状态、使用数据、网络健康等关键指标。
            <br />
            通过先进的数据处理与智能分析，本平台能够高效支持充电设施的管理与优化决策，保障充电网络的可靠性与服务质量，
            为电动汽车的普及提供坚实的基础。
          </Paragraph>
        </Card>
        {/* 功能模块 */}
        <Title level={2} style={{ textAlign: "center", marginTop: "20px" }}>
          --功能模块--
        </Title>
        <Row gutter={[24, 24]}>
          {MODULES.map(({ key, title, description, image, path }) => (
            <Col span={12} key={key}>
              <Card
                hoverable
                cover={<div><Image src={image} alt={title} preview={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                onClick={() => handleProtectedNavigation(path, key)}
              >
                <Card.Meta title={<span style={{ fontSize: 20 }}>{title}</span>}
                  description={<span style={{ fontSize: 16 }}>{description}</span>} />
              </Card>
            </Col>
          ))}
        </Row>
      </Content>

      {/* 回到顶部悬浮按钮 */}
      <FloatButton.BackTop />

      {/* 底部信息 */}
      <Footer style={{ textAlign: "center" }}>
        ©2025 ChargeMind Created by YOUNG
      </Footer>

      {/* 漫游式引导组件 */}
      <Tour steps={tourSteps} open={tourOpen} onClose={() => setTourOpen(false)} />
    </Layout>
  );
};

export default Intro;
