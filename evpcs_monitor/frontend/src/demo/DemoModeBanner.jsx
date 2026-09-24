import React, { useEffect, useState } from "react";
import { ExperimentOutlined } from "@ant-design/icons";
import { DEMO_DATA_SOURCE_NOTE } from "./demoData";
import { isDemoMode } from "./demoMode";

const DemoModeBanner = () => {
  const [enabled, setEnabled] = useState(isDemoMode());

  useEffect(() => {
    const handleChange = (event) => setEnabled(Boolean(event.detail?.enabled));
    window.addEventListener("ev-station-demo-mode-change", handleChange);
    return () => window.removeEventListener("ev-station-demo-mode-change", handleChange);
  }, []);

  if (!enabled) return null;

  return (
    <div
      title={DEMO_DATA_SOURCE_NOTE}
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 10000,
        maxWidth: 430,
        padding: "9px 14px",
        border: "1px solid #ffd666",
        borderRadius: 8,
        color: "#613400",
        background: "rgba(255, 251, 230, 0.96)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.16)",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <ExperimentOutlined style={{ marginRight: 7 }} />
      <strong>演示模式 · 模拟数据</strong>
      <span>｜写操作仅在本次页面会话内生效</span>
    </div>
  );
};

export default DemoModeBanner;
