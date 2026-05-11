// BusinessInfo.jsx

import React, { useEffect, useState } from "react";
import { List, Button, Modal, Badge, Descriptions, message, Popconfirm, Typography, Space, Tag, Input, Select, Pagination, } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { FilterOutlined } from "@ant-design/icons";


const { Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const pageSize = 5;

const BusinessInfo = () => {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [cooperationFilter, setCooperationFilter] = useState(null);
  const [regionFilter, setRegionFilter] = useState(null);
  const [readFilter, setReadFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/business/list");
      const data = res.data.data.reverse(); // 倒序
      setAllData(data);
      setFilteredData(data);
    } catch (err) {
      message.error("获取数据失败");
    }
  };

  const deleteItem = async (id) => {
    try {
      await axios.delete(`/api/business/delete/${id}`);
      message.success("删除成功");
      fetchData();
    } catch (err) {
      message.error("删除失败");
    }
  };

  const showDetails = async (item) => {
    try {
      // 如果是未读，先设为已读
      if (!item.is_read) {
        await axios.post(`/api/business/mark_read/${item.id}`);
        fetchData(); // 重新获取数据以刷新状态
      }
      setSelectedItem(item);
      setModalVisible(true);
    } catch (err) {
      message.error("设置已读失败");
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    applyFilter(value, cooperationFilter, regionFilter);
  };

  const applyFilter = (search, coop, region, read) => {
    const result = allData.filter((item) => {
      const matchesSearch =
        item.company?.includes(search) || item.contact_name?.includes(search);
      const matchesCoop = coop ? item.cooperation_type === coop : true;
      const matchesRegion = region ? item.region === region : true;
      const matchesRead =
        read === null ? true : read === "已读" ? item.is_read : !item.is_read;
      return matchesSearch && matchesCoop && matchesRegion && matchesRead;
    });
    setFilteredData(result);
    setCurrentPage(1);
  };

  const handleReadFilterChange = (value) => {
    const read = value === undefined ? null : value;
    setReadFilter(read);
    applyFilter(searchText, cooperationFilter, regionFilter, read);
  };
  

  const handleCooperationChange = (value) => {
    const coop = value === undefined ? null : value;
    setCooperationFilter(coop);
    applyFilter(searchText, coop, regionFilter, readFilter);
  };
  


  useEffect(() => {
    fetchData();
  }, []);

  // 分页切片
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ padding: 32, background: "#f4f6f8", borderRadius: 12 }}>
      <Space style={{ marginBottom: 24 }} wrap>
        <Search
          placeholder="搜索公司/联系人"
          allowClear
          onSearch={handleSearch}
          style={{ width: 240 }}
        />
        <Select
          placeholder="筛选合作类型"
          allowClear
          style={{ width: 180 }}
          onChange={handleCooperationChange}
        >
          <Option value="技术合作">技术合作</Option>
          <Option value="投资入驻">投资入驻</Option>
          <Option value="业务拓展">业务拓展</Option>
        </Select>
        <Select
          placeholder="是否已读"
          allowClear
          style={{ width: 120 }}
          onChange={handleReadFilterChange}
          suffixIcon={<FilterOutlined />}
        >
          <Option value="未读">未读</Option>
          <Option value="已读">已读</Option>
        </Select>
      </Space>

      <List
        itemLayout="horizontal"
        dataSource={pagedData}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="link" onClick={() => showDetails(item)}>详情</Button>,
              <Popconfirm
                title="确认删除这条意向信息？"
                onConfirm={() => deleteItem(item.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button danger type="link">删除</Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Badge dot={!item.is_read}>
                    <span style={{ fontWeight: 500 }}>
                      【{item.company}】{item.contact_name}（{item.position}）
                    </span>
                  </Badge>
                  <Tag color="blue">{item.cooperation_type}</Tag>
                  <Tag color="geekblue">{item.region}</Tag>
                </Space>
              }
              description={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#666" }}>
                  <Paragraph
                    style={{ maxWidth: "70%", marginBottom: 0 }}
                    ellipsis={{ rows: 1, expandable: true, symbol: "更多" }}
                  >
                    {item.needs}
                  </Paragraph>
                  <span style={{ fontSize: 12, color: "#999" }}>
                    {dayjs.utc(item.created_at).format("YYYY-MM-DD HH:mm")}
                  </span>
                </div>
              }
            />
          </List.Item>
        )}
      />

      {/* 分页 */}
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={filteredData.length}
        onChange={(page) => setCurrentPage(page)}
        style={{ textAlign: "center", marginTop: 32 }}
      />

      {/* 详情弹窗 */}
      <Modal
        title="合作意向详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={720}
        bodyStyle={{ paddingTop: 16 }}
      >
        {selectedItem && (
          <Descriptions
            bordered
            column={2}
            size="middle"
            labelStyle={{ fontWeight: "bold", width: 120 }}
            contentStyle={{ background: "#fcfcfc" }}
          >
            <Descriptions.Item label="联系人">{selectedItem.contact_name}</Descriptions.Item>
            <Descriptions.Item label="联系方式">{selectedItem.contact_info}</Descriptions.Item>
            <Descriptions.Item label="公司">{selectedItem.company}</Descriptions.Item>
            <Descriptions.Item label="职位">{selectedItem.position}</Descriptions.Item>
            <Descriptions.Item label="公司规模">{selectedItem.company_size}</Descriptions.Item>
            <Descriptions.Item label="所属行业">{selectedItem.industry}</Descriptions.Item>
            <Descriptions.Item label="合作类型">{selectedItem.cooperation_type}</Descriptions.Item>
            <Descriptions.Item label="区域">{selectedItem.region}</Descriptions.Item>
            <Descriptions.Item label="官网">{selectedItem.website || "-"}</Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {dayjs.utc(selectedItem.created_at).format("YYYY-MM-DD HH:mm:ss")}
            </Descriptions.Item>
            <Descriptions.Item label="合作需求" span={2}>
              {selectedItem.needs}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default BusinessInfo;
