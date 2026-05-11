import React, { useEffect } from "react";
import { Modal, Form, Input, Select, Button, Radio, Row, Col } from "antd";

const { Option } = Select;

const PileFormModal = ({
    visible,
    onClose,
    initialData,
    stationId,
    onSave  // 由父组件传入的保存逻辑
}) => {
    const [form] = Form.useForm();

    // 当对话框打开时，根据 initialData 判断是编辑还是新增，并设置表单默认值
    useEffect(() => {
        if (visible) {
            if (initialData) {
                // 编辑模式：填充已有数据
                form.setFieldsValue({
                    ...initialData,
                    maintenance_needed: initialData.maintenance_needed === 1, // 转换 1/0 为 true/false
                    station_id: stationId
                });
            } else {
                // 新增模式：重置表单，设置 station_id
                form.resetFields();
                form.setFieldsValue({ station_id: stationId });
            }
        }
    }, [visible, initialData, stationId, form]);

    // 提交表单
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // 将 maintenance_needed 转换回 0/1 格式
            values.maintenance_needed = values.maintenance_needed ? 1 : 0;
            const isEdit = !!initialData;
            onSave(values, isEdit);
        } catch (error) {
            // 表单验证失败
        }
    };

    return (
        <Modal
            title={initialData ? "编辑充电桩信息" : "新增充电桩信息"}
            open={visible}
            onCancel={onClose}
            destroyOnClose={true}  // 每次关闭后销毁对话框内容，保证下次打开为全新表单
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" onClick={handleSubmit}>
                    Submit
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical">
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="充电站 ID"
                            name="station_id"
                            rules={[{ required: true, message: "充电站 ID 是必需的！" }]}
                        >
                            <Input disabled />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="充电桩 ID"
                            name="pile_id"
                            rules={[{ required: true, message: "充电桩 ID 是必需的！" }]}
                        >
                            <Input placeholder="Enter Pile ID" disabled={!!initialData} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="充电类型"
                            name="charging_type"
                            rules={[{ required: true, message: "请输入充电类型！" }]}
                        >
                            <Select placeholder="选择充电类型">
                                <Option value="0">交流 (Alternating Current)</Option>
                                <Option value="1">直流 (Direct Current)</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="充电功率 (KW)"
                            name="charging_power"
                            rules={[{ required: true, message: "请输入充电功率！" }]}
                        >
                            <Input min={7} type="number" placeholder="输入充电功率" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="接口类型"
                            name="connector_type"
                            rules={[{ required: true, message: "请输入接口类型！" }]}
                        >
                            <Input placeholder="例如： CCS, CHAdeMO, GB/T" />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="位置描述"
                            name="location_desc"
                            rules={[{ required: true, message: "请输入位置描述！" }]}
                        >
                            <Select placeholder="选择位置">
                                <Option value="G">地面 (Ground)</Option>
                                <Option value="B1">地下一层 (Basement 1)</Option>
                                <Option value="B2">地下二层 (Basement 2)</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="是否需要维修"
                            name="maintenance_needed"
                            rules={[{ required: true, message: "请选择是否需要维修！" }]}
                        >
                            <Radio.Group>
                                <Radio value={true}>是</Radio>
                                <Radio value={false}>否</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default PileFormModal;
