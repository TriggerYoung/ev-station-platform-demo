// App.js — client routes; UI stills: see root README「页面展示」.
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Helmet } from "react-helmet";

import Intro from "./components/Intro";
import Login from "./components/Login";
import InfoMaintenance from "./components/info_maintenance/InfoMaintenance";
import NetworkAnalysis from "./components/network_analysis/NetworkAnalysis";
import DataPanel from "./components/data_panel/DataPanel";
import AnalysisReport from "./components/analysis_report/AnalysisReport";
import Business from "./components/business/Business";
import Community from "./components/community/Community";
import DemoModeBanner from "./demo/DemoModeBanner";

// 路由配置数组
const routes = [
  { path: "/", title: "Intro Page", element: <Intro /> }, // screenshot: docs/screenshots/intro.png
  { path: "/login", title: "Login Page", element: <Login /> }, // screenshot: docs/screenshots/login.png
  { path: "/info_maintenance/*", title: "Info Maintenance", element: <InfoMaintenance /> }, // docs/screenshots/info-maintenance.png
  { path: "/network_analysis/*", title: "Network Analysis", element: <NetworkAnalysis /> }, // docs/screenshots/network-analysis.png
  { path: "/data_panel/*", title: "Data Panel", element: <DataPanel /> }, // docs/screenshots/data-panel.png
  { path: "/analysis_report/*", title: "Analysis Report", element: <AnalysisReport /> }, // docs/screenshots/analysis-report.png
  { path: "/business/*", title: "Business", element: <Business /> }, // docs/screenshots/business.png
  { path: "/community/*", title: "Community", element: <Community /> }, // docs/screenshots/community.png
];

const App = () => {
  return (
    <Router>
      <DemoModeBanner />
      <Routes>
        {routes.map(({ path, title, element }) => (
          <Route
            key={path}
            path={path}
            element={
              <>
                <Helmet>
                  <title>{title}</title>
                </Helmet>
                {element}
              </>
            }
          />
        ))}
      </Routes>
    </Router>
  );
};

export default App;
