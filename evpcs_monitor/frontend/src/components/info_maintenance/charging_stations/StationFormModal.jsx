// ChargingStationTable.jsx: 用于展示充电桩信息的表单组件
import React from "react";
import { Modal, Form, Input, Select, Row, Col } from "antd";

const StationFormModal = ({ visible, onCancel, onSave, form, editingStation }) => {
    return (
        <Modal
            title={editingStation ? "编辑充电站信息" : "新增充电站信息"}
            open={visible}
            onOk={onSave}
            onCancel={onCancel}
            okText="保存"
            cancelText="取消"
            width={700} // 调整表单弹框宽度
        >
            <Form form={form} layout="vertical">
                {/* 独占一行 */}
                <Form.Item
                    name="station_id"
                    label="充电站 ID"
                    rules={[{ required: true, message: "请输入充电站 ID!" }]}
                >
                    <Input placeholder="输入充电站 ID" disabled={!!editingStation} />
                </Form.Item>
                <Form.Item
                    name="address"
                    label="地址名称"
                    rules={[{ required: true, message: "请输入充电站地址名称!" }]}
                >
                    <Input placeholder="输入地址名称" />
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="longitude"
                            label="经度"
                            rules={[{ required: true, message: "请输入经度!" }]}
                        >
                            <Input placeholder="输入经度" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="latitude"
                            label="纬度"
                            rules={[{ required: true, message: "请输入纬度!" }]}
                        >
                            <Input placeholder="输入纬度" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="pile_count"
                            label="充电桩数"
                            rules={[{ required: true, message: "请输入充电桩数!" }]}
                        >
                            <Input min={0} placeholder="输入充电桩数" type="number" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="adcode"
                            label="行政区"
                            rules={[{ required: true, message: "请选择行政区!" }]}
                        >
                            <Select placeholder="选择行政区">
                                <Select.Option value="440303">罗湖区</Select.Option>
                                <Select.Option value="440304">福田区</Select.Option>
                                <Select.Option value="440305">南山区</Select.Option>
                                <Select.Option value="440306">宝安区</Select.Option>
                                <Select.Option value="440307">龙岗区</Select.Option>
                                <Select.Option value="440308">盐田区</Select.Option>
                                <Select.Option value="440309">龙华区</Select.Option>
                                <Select.Option value="440310">坪山区</Select.Option>
                                <Select.Option value="440311">光明区</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>



                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="has_parking_fee"
                            label="停车收费"
                            rules={[{ required: true, message: "请选择是否停车收费!" }]}
                        >
                            <Select>
                                <Select.Option value="0">否</Select.Option>
                                <Select.Option value="1">是</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="status"
                            label="状态"
                            rules={[{ required: true, message: "请选择状态!" }]}
                        >
                            <Select>
                                <Select.Option value="0">离线</Select.Option>
                                <Select.Option value="1">在线</Select.Option>
                                <Select.Option value="2">维护中</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default StationFormModal;
