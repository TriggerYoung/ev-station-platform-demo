import React, { useState } from "react";
import { TreeSelect } from "antd";

/**
 * 充电站树组件，支持异步加载和模糊搜索
 */
const ChargingTreeSelect = ({
    treeData,
    expandedKeys,
    value,
    onTreeExpand,
    onSelectNode,
}) => {
    const [searchValue, setSearchValue] = useState(""); // 绑定 searchValue
    const [searching, setSearching] = useState(false);

    // 处理展开/收起
    const handleTreeExpand = (newExpandedKeys) => {
        onTreeExpand(newExpandedKeys);
    };

    // 处理选择节点
    const handleSelect = (newValue, node) => {
        if (!node) return;
        onSelectNode(newValue, node);
    };

    // 处理搜索输入
    const handleSearch = (inputValue) => {
        setSearchValue(inputValue); // 绑定搜索值
        setSearching(true);
        setTimeout(() => setSearching(false), 500); // 模拟搜索加载
    };

    // 仅在本地已加载的数据中搜索
    const filterTreeNode = (inputValue, treeNode) => {
        if (!inputValue) return false;
        return treeNode.title.toLowerCase().includes(inputValue.toLowerCase());
    };

    return (
        <TreeSelect
            style={{
                width: "100%",
                fontSize: "16px",
                padding: "2px",
                borderRadius: "8px",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            }}
            treeData={treeData}
            treeExpandedKeys={expandedKeys}
            onTreeExpand={handleTreeExpand}
            value={value}
            onSelect={handleSelect}
            placeholder="🔍 请输入充电站ID或地址"
            showSearch
            searchValue={searchValue} // 绑定 searchValue
            onSearch={handleSearch}
            filterTreeNode={filterTreeNode}
            dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
            allowClear
            notFoundContent={searching ? "🔍 搜索中..." : "⚠️ 未找到匹配的充电站"}
        />
    );
};

export default ChargingTreeSelect;
