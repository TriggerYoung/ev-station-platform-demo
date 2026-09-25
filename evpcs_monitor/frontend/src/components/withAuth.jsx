import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message } from "antd";
import { getAppRole } from "../demo/demoMode";

const withAuth = (WrappedComponent) => {
  return (props) => {
    const navigate = useNavigate(); // 使用 useNavigate
    const location = useLocation();
    const isLoggedIn = Boolean(getAppRole());

    useEffect(() => {
      // 判断用户是否登录
      if (!isLoggedIn) {
        message.warning("请先登录！");
        const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
        navigate(`/login?redirect=${redirect}`, { replace: true });
      }
    }, [isLoggedIn, location.pathname, location.search, navigate]);

    // 如果已登录，渲染原组件
    return isLoggedIn ? <WrappedComponent {...props} /> : null;
  };
};

export default withAuth;
