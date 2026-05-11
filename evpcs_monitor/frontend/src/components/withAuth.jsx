import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";  // 使用 useNavigate
import { message } from "antd";

const withAuth = (WrappedComponent) => {
  return (props) => {
    const navigate = useNavigate(); // 使用 useNavigate
    const isLoggedIn = localStorage.getItem("role"); // 根据实际的登录状态判断逻辑

    useEffect(() => {
      // 判断用户是否登录
      if (!isLoggedIn) {
        message.warning("请先登录！");
        navigate("/login"); // 未登录则跳转到登录页面
      }
    }, [isLoggedIn, navigate]);

    // 如果已登录，渲染原组件
    return isLoggedIn ? <WrappedComponent {...props} /> : null;
  };
};

export default withAuth;
