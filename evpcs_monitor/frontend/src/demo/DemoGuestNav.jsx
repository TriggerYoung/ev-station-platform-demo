import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearDemoGuestSession, isDemoGuestSession } from "./demoMode";

const MODULE_LINKS = [
  { path: "/", label: "模块首页" },
  { path: "/info_maintenance", label: "信息维护" },
  { path: "/network_analysis", label: "网络分析" },
  { path: "/analysis_report", label: "智能报告" },
  { path: "/data_panel", label: "数据大屏" },
  { path: "/community", label: "充电社区" },
  { path: "/business", label: "商务合作" },
];

const DemoGuestNav = () => {
  const [active, setActive] = useState(isDemoGuestSession());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = () => setActive(isDemoGuestSession());
    window.addEventListener("ev-station-demo-guest-change", refresh);
    window.addEventListener("ev-station-demo-mode-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("ev-station-demo-guest-change", refresh);
      window.removeEventListener("ev-station-demo-mode-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!active || location.pathname === "/" || location.pathname === "/login") return null;

  const handleExit = () => {
    window.localStorage.removeItem("role");
    window.localStorage.removeItem("user_id");
    window.localStorage.removeItem("username");
    clearDemoGuestSession();
    navigate("/");
  };

  return (
    <nav aria-label="演示访客模块导航" style={{
      position: "sticky", top: 0, zIndex: 9999, display: "flex", flexWrap: "wrap",
      alignItems: "center", gap: "6px 14px", padding: "9px 16px",
      background: "#001529", color: "#fff", fontSize: 14,
    }}>
      <strong style={{ marginRight: 8, whiteSpace: "nowrap" }}>演示访客</strong>
      {MODULE_LINKS.map(({ path, label }) => {
        const selected = path === "/"
          ? location.pathname === path
          : location.pathname.startsWith(path);
        return (
          <Link key={path} to={path} style={{ color: selected ? "#69c0ff" : "#fff", whiteSpace: "nowrap" }}>
            {label}
          </Link>
        );
      })}
      <button type="button" onClick={handleExit} style={{
        marginLeft: "auto", padding: "3px 8px", color: "#fff", background: "transparent",
        border: "1px solid #8c8c8c", borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
      }}>
        退出体验
      </button>
    </nav>
  );
};

export default DemoGuestNav;
