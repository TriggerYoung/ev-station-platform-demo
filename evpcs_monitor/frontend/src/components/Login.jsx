import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import axios from "axios";
import { Form, Input, Button, Checkbox, Card, message } from "antd";
import ParticlesBg from "particles-bg";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation(); 
  const navigate = useNavigate(); 

  // 获取 URL 中的 redirect 参数
  const redirectPath = new URLSearchParams(location.search).get("redirect") || "/";

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/users/login", values);
      const result = response.data;

      if (result.success) {
        message.success(`登录成功！欢迎, ${result.role}`, 2);
        localStorage.setItem("user_id", result.user_id);
        localStorage.setItem("role", result.role);
        localStorage.setItem("username", values.username);

        // 登录成功后跳转回 redirectPath（默认是 /）
        navigate(redirectPath, { replace: true });
      } else {
        message.error(result.message || "用户名或密码错误", 2);
      }
    } catch (error) {
      message.error("请求失败，请稍后重试！", 2);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <ParticlesBg color="#fff" num={100} type="square" bg={true} />
      <Card title="Charge Mind 用户登录" style={{ width: 400, textAlign: "center" }}>
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入邮箱地址！", type: "email" }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码！" }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="rememberMe" valuePropName="checked">
            <Checkbox>保存密码</Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
