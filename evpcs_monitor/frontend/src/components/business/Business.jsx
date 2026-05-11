import React, { useEffect, useState } from "react";
import {
    Typography, Row, Col, Card, Steps, Collapse,
    Form, Input, Button, message, Select, Radio, Modal
} from "antd";
import axios from "axios";
import ParticlesBg from "particles-bg";

const { Title, Paragraph } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;
const { Option } = Select;

const Business = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const handleFormSubmit = async (values) => {
        try {
            setLoading(true);
            const response = await axios.post("api/business/submit", values);
            if (response.data.success !== false) {
                message.success("您的合作意向已提交，我们将尽快与您联系！");
                form.resetFields();
                setModalVisible(false);
            } else {
                message.error(response.data.message || "提交失败，请稍后重试");
            }
        } catch (error) {
            console.error("提交失败:", error);
            message.error("提交失败，请检查网络或稍后再试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", position: "relative", minHeight: "100vh" }}>
            <ParticlesBg color="#fff" num={10} type="polygon" bg={true} />
            <div>
                <Title level={2} style={{ textAlign: "center", marginBottom: 20 }}>
                    商业合作
                </Title>

                {/* 合作简介 */}
                <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
                    <Col span={24}>
                        <Card >
                            <Title level={4}>为什么选择与我们合作？</Title>
                            <Paragraph style={{ fontSize: 16, lineHeight: 2 }}>
                                我们致力于推动电动汽车充电基础设施的建设与发展，如果您正在寻找商业合作伙伴，共同拓展充电网络业务或开发更具创新性的解决方案，我们可以作为您的选择之一。
                            </Paragraph>
                            <Paragraph style={{ fontSize: 16, lineHeight: 2 }}>
                                不论您是充电站运营商、车辆制造商、技术开发团队，还是产业投资者，只要对电动汽车基础设施及相关生态有兴趣，都可以与我们探讨合作模式。
                            </Paragraph>
                        </Card>
                    </Col>
                </Row>

                {/* 合作流程 */}
                <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
                    <Col span={24}>
                        <Card title="合作流程">
                            <Steps current={0} progressDot>
                                <Step title="提交合作意向" description="填写并提交合作意向表单" />
                                <Step title="商务洽谈" description="我们将与您沟通合作模式、权益分配等" />
                                <Step title="签订协议" description="就合作条款达成一致，签署正式协议" />
                                <Step title="执行与运营" description="双方共同推进项目落地并持续运营" />
                            </Steps>
                        </Card>
                    </Col>
                </Row>

                {/* 常见问题 */}
                <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
                    <Col span={24}>
                        <Card title="常见问题">
                            <Collapse accordion>
                                <Panel header="1. 合作的主要方向有哪些？" key="1">
                                    我们在充电网络建设、技术开发、数据增值服务以及运营推广等方面都可以探索合作。您也可以提出其他创新业务模式。
                                </Panel>
                                <Panel header="2. 是否限制合作方的企业类型或规模？" key="2">
                                    暂无明确限制，任何对电动汽车充电产业有兴趣或有资源的企业、团队或个人都可以与我们联系。
                                </Panel>
                                <Panel header="3. 整个洽谈周期大概需要多久？" key="3">
                                    视合作内容复杂度而定，一般沟通确定意向后，1-2周内可进入协议签署阶段。
                                </Panel>
                            </Collapse>
                        </Card>
                    </Col>
                </Row>

                {/* 底部按钮 */}
                <div style={{
                    position: "fixed",
                    bottom: 50,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1000,
                    textAlign: "center"
                }}>
                    <Button type="primary" size="large" onClick={() => setModalVisible(true)}>让我们成为伙伴，共同进步吧！</Button>
                </div>
                {/* 弹出 Modal 表单 */}
                <Modal
                    title="提交合作意向"
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    footer={null}
                    destroyOnClose
                    width={800}
                >
                    <Form layout="vertical" form={form} onFinish={handleFormSubmit}>
                        <Title level={5}>基础信息</Title>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="联系人姓名" name="contactName" rules={[{ required: true, message: "请输入姓名" }]}>
                                    <Input maxLength={30} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="联系方式" name="contactInfo" rules={[{ required: true, message: "请输入联系方式" }]}>
                                    <Input maxLength={50} placeholder="邮箱或电话" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Title level={5}>公司/团队信息</Title>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="公司/团队名称" name="company" rules={[{ required: true }]}>
                                    <Input maxLength={50} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="职位" name="position">
                                    <Input placeholder="如：市场总监" maxLength={30} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="公司规模" name="companySize">
                                    <Select placeholder="请选择">
                                        <Option value="1-10人">1-10人</Option>
                                        <Option value="11-50人">11-50人</Option>
                                        <Option value="51-200人">51-200人</Option>
                                        <Option value="200人以上">200人以上</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="所属行业" name="industry">
                                    <Select showSearch allowClear placeholder="请选择">
                                        <Option value="电动汽车">电动汽车</Option>
                                        <Option value="能源">能源</Option>
                                        <Option value="物流">物流</Option>
                                        <Option value="地产">地产</Option>
                                        <Option value="其他">其他</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Title level={5}>合作信息</Title>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="合作类型" name="cooperationType" rules={[{ required: true }]}>
                                    <Radio.Group>
                                        <Radio value="技术合作">技术合作</Radio>
                                        <Radio value="投资入驻">投资入驻</Radio>
                                        <Radio value="业务拓展">业务拓展</Radio>
                                        <Radio value="其他">其他</Radio>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="所在地区" name="region">
                                    <Input placeholder="如：深圳市南山区" maxLength={50} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="公司网站" name="website">
                                    <Input placeholder="如：www.example.com" maxLength={100} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="合作需求" name="needs">
                            <Input.TextArea rows={4} maxLength={500} placeholder="请描述您的合作意向或需求" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                提交意向
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default Business;
