// ChargingPiles.jsx
import React, { useState, useEffect } from "react";
import { Spin, message, Button, Modal, Col, Row, Tooltip, Space, Typography } from "antd";
import { ExclamationCircleOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import ChargingTreeSelect from "./ChargingTreeSelect";
import PileTable from "./PileTable";
import BreadcrumbNav from "./BreadcrumbNav";
import PileFormModal from "./PileFormModal";
// 从 utils.js 导入工具函数
import { findNode, updateTreeChildren, createBreadcrumbItems } from "./utils";

const { confirm } = Modal;

const ChargingPiles = () => {
    const [breadcrumbItems, setBreadcrumbItems] = useState([{ title: "深圳市", key: "sz" }]);
    const [value, setValue] = useState("sz");
    const [expandedKeys, setExpandedKeys] = useState(["sz"]);
    const [treeData, setTreeData] = useState([
        { title: "深圳市", value: "sz", key: "sz", level: 1, isLeaf: false, children: [] },
    ]);
    const [loading, setLoading] = useState(false);
    const [pileData, setPileData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPile, setEditingPile] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    // 树形展开
    const onTreeExpand = (newExpandedKeys) => {
        const newlyExpanded = newExpandedKeys.find((k) => !expandedKeys.includes(k));
        if (newlyExpanded) {
            const node = findNode(treeData, newlyExpanded);
            if (node) handleExpand(node.value, node.level);
        }
        setExpandedKeys(newExpandedKeys);
    };

    // 加载子节点数据
    const handleExpand = async (nodeValue, level) => {
        try {
            let apiPath, params, mapper;

            if (level === 1) {
                apiPath = "/api/piles/districts";
                mapper = (d) => ({
                    title: d.district_name,
                    value: d.adcode,
                    key: d.adcode,
                    level: 2,
                    isLeaf: false,
                    children: [],
                });
            } else if (level === 2) {
                apiPath = "/api/piles/stations";
                params = { adcode: nodeValue };
                const parentNode = findNode(treeData, nodeValue, "value");
                mapper = (s) => ({
                    title: `${s.station_id}__${s.address}`,
                    value: s.station_id,
                    key: s.station_id,
                    level: 3,
                    isLeaf: true,
                    districtName: parentNode?.title,
                    districtKey: parentNode?.key,
                });
            } else return;

            const res = await axios.get(apiPath, { params });
            if (res.data.success) {
                const childrenNodes = res.data.data.map(mapper);
                setTreeData((prev) => updateTreeChildren(prev, nodeValue, childrenNodes));

                // 如果是加载区级数据，自动选第一个站点
                if (level === 2 && childrenNodes.length > 0) {
                    const firstStation = childrenNodes[0];
                    setValue(firstStation.value);
                    const items = createBreadcrumbItems(firstStation);
                    setBreadcrumbItems(items);
                    fetchPileData(firstStation.value);
                }
            }
        } catch (error) {
            message.error("数据加载失败");
        }
    };

    // 选择节点
    const onSelectNode = (newValue, node) => {
        setValue(newValue);
        if (node.level === 3) {
            const items = createBreadcrumbItems(node);
            setBreadcrumbItems(items);
            fetchPileData(newValue);
        } else {
            setPileData([]);
            const items = createBreadcrumbItems(node);
            setBreadcrumbItems(items);
        }
    };

    // 加载充电桩数据
    const fetchPileData = async (stationId) => {
        setLoading(true);
        try {
            const res = await axios.get("/api/piles/piles", { params: { station_id: stationId } });
            setPileData(res.data.success ? res.data.data : []);
            setSelectedRowKeys([]);
        } catch (error) {
            message.error("桩数据加载失败");
        } finally {
            setLoading(false);
        }
    };

    // 打开弹窗：新增 or 编辑
    const handleOpenModal = (pile = null) => {
        setEditingPile(pile);
        setIsModalOpen(true);
    };

    // 关闭弹窗
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPile(null);
    };

    // 新增/编辑充电桩逻辑
    const handleSave = async (values, isEdit) => {
        try {
            if (!values.station_id) {
                message.error("缺少station_id，请先选择一个站点。");
                return;
            }

            // 根据 isEdit 判断是新增还是编辑
            const apiUrl = isEdit
                ? `/api/charging_piles/update/${values.pile_id}`
                : "/api/charging_piles/add";
            const method = isEdit ? axios.put : axios.post;

            const res = await method(apiUrl, values);
            if (res.data.success) {
                message.success(`充电桩信息 ${isEdit ? "更新" : "新增"} 成功！`);
                fetchPileData(values.station_id);
                handleCloseModal();
            } else {
                message.error(`操作失败： ${res.data.message}`);
            }
        } catch (error) {
            message.error("信息提交失败，请仔细检查输入信息。");
        }
    };

    // 删除（单个 or 批量）
    const handleDeletePile = (pileIds) => {
        if (pileIds.length === 0) {
            message.warning("请选择要删除的充电桩！");
            return;
        }
        confirm({
            title: "确认删除选中的充电桩？",
            icon: <ExclamationCircleOutlined />,
            content: `将删除 ${pileIds.length} 个充电桩，删除后无法恢复！`,
            okText: "确认",
            okType: "danger",
            cancelText: "取消",
            onOk: async () => {
                try {
                    const res = await axios.post("/api/charging_piles/delete_batch", {
                        pile_ids: pileIds,
                        station_id: value,
                    });
                    if (res.data.success) {
                        message.success("删除成功");
                        fetchPileData(value);
                        setSelectedRowKeys([]);
                    } else {
                        message.error("删除失败");
                    }
                } catch (error) {
                    message.error("删除失败");
                }
            },
        });
    };

    // 初始化：加载 "深圳市" 行政区
    useEffect(() => {
        handleExpand("sz", 1);
    }, []);

    // 监听 treeData 变化，尝试选中第一个可用的充电站
    useEffect(() => {
        if (!value || value === "sz") { // 仅在没有选中站点时执行
            const szNode = treeData.find(node => node.value === "sz");
            if (szNode && szNode.children && szNode.children.length > 0) {
                const firstDistrict = szNode.children[0]; // 选中第一个区
                handleExpand(firstDistrict.value, 2).then(() => {
                    const updatedDistrictNode = findNode(treeData, firstDistrict.value, "value");
                    if (updatedDistrictNode && updatedDistrictNode.children && updatedDistrictNode.children.length > 0) {
                        const firstStation = updatedDistrictNode.children[0]; // 选中第一个充电站
                        setValue(firstStation.value);
                        setBreadcrumbItems(createBreadcrumbItems(firstStation));
                        fetchPileData(firstStation.value); // 加载该站点的充电桩数据
                    }
                });
            }
        }
    }, [treeData]); // 依赖 treeData，确保数据更新后触发


    return (
        <div style={{ padding: 16 }}>
            <BreadcrumbNav breadcrumbItems={breadcrumbItems} />
            <Row gutter={12} align="middle" style={{ marginTop: 10 }}>
                {/* 充电站选择区域 */}
                <Col flex="auto">
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <Typography.Text strong style={{ minWidth: "50px", whiteSpace: "nowrap" }}>充电站：</Typography.Text>
                        <ChargingTreeSelect
                            treeData={treeData}
                            expandedKeys={expandedKeys}
                            value={value}
                            onTreeExpand={onTreeExpand}
                            onSelectNode={onSelectNode}
                            style={{ flex: 1 }} // 让 TreeSelect 占满剩余空间
                        />
                    </div>
                </Col>

                {/* 添加充电桩按钮 */}
                <Col>
                    <Tooltip title="新增充电桩信息">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleOpenModal()}
                        />
                    </Tooltip>
                </Col>

                {/* 批量删除按钮 */}
                <Col>
                    <Tooltip title="批量删除充电桩信息">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            disabled={selectedRowKeys.length === 0}
                            onClick={() => handleDeletePile(selectedRowKeys)}
                        />
                    </Tooltip>
                </Col>
            </Row>

            {loading ? (
                <Spin size="large" style={{ marginTop: 16 }} />
            ) : (
                <PileTable
                    pileData={pileData}
                    onEdit={handleOpenModal}
                    onDelete={handleDeletePile}
                    selectedRowKeys={selectedRowKeys}
                    onSelectChange={setSelectedRowKeys}
                />
            )}

            <PileFormModal
                visible={isModalOpen}
                initialData={editingPile}
                stationId={value}
                onClose={handleCloseModal}
                onSave={handleSave}
            />
        </div>
    );
};

export default ChargingPiles;
