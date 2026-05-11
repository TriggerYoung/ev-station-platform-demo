import React, { useEffect, useState, useCallback } from "react";
import { Checkbox, message, Form, Modal, Spin } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { debounce } from "lodash";
import dayjs from "dayjs";
import StationTable from "./StationTable";
import StationFormModal from "./StationFormModal";
import StationActions from "./StationActions"; // 引入操作子组件
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const { confirm } = Modal;

const ChargingStations = () => {
  const [stations, setStations] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 选中的行 ID
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [form] = Form.useForm();
  // 新增状态保存搜索条件
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadColumns, setDownloadColumns] = useState([]); // 新增：保存可下载的列选项

  // 获取充电站数据
  const fetchStations = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const response = await axios.get("/api/stations", {
          params: {
            page: params.page || pagination.current,
            pageSize: params.pageSize || pagination.pageSize,
            // 这里使用传入的 search 或者当前的 searchTerm 状态
            search: params.search !== undefined ? params.search : searchTerm,
            sortField: params.sortField || "created_at",
            sortOrder: params.sortOrder || "DESC",
          },
        });

        if (response.data.success) {
          setStations(response.data.data.items);
          setPagination((prev) => ({
            ...prev,
            current: params.page || prev.current,
            pageSize: params.pageSize || prev.pageSize,
            total: response.data.data.total,
          }));
        }
      } catch (error) {
        message.error("获取充电站信息失败。");
      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize, searchTerm]
  );

  // 处理表格变化（分页、排序、筛选）
  const handleTableChange = (newPagination, filters, sorter) => {
    fetchStations({
      page: newPagination.current,
      pageSize: newPagination.pageSize,
      // 这里必须传入 searchTerm，确保翻页时搜索条件有效
      search: searchTerm,
      sortField: sorter.field || "created_at",
      sortOrder: sorter.order === "ascend" ? "ASC" : "DESC",
    });
  };

  // 搜索处理 (防抖)
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      // 当搜索时，重置页码为 1，并传入搜索条件
      fetchStations({
        search: value,
        page: 1,
        pageSize: pagination.pageSize,
      });
    }, 500),
    [pagination.pageSize, fetchStations]
  );

  // 处理新增 & 编辑充电站
  const handleUpdate = (station) => {
    setEditingStation(station);
    form.setFieldsValue({
      station_id: station?.station_id || "",
      longitude: station?.longitude || "",
      latitude: station?.latitude || "",
      pile_count: station?.pile_count || "",
      address: station?.address || "",
      adcode: station?.adcode || "",
      has_parking_fee: station?.has_parking_fee?.toString() || "0",
      status: station?.status?.toString() || "1",
    });
    setIsModalOpen(true);
  };

  // 处理保存（新增/编辑）
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const apiUrl = editingStation
        ? `/api/stations/${editingStation.station_id}`
        : `/api/stations`;
      const method = editingStation ? axios.put : axios.post;
      const response = await method(apiUrl, values);

      if (response.data.success) {
        message.success(
          `充电站信息 ${editingStation ? "更新" : "新增"} 成功！`
        );
        fetchStations();
      } else {
        message.error(
          `充电站信息 ${editingStation ? "更新" : "新增"} 失败。`
        );
      }
      setIsModalOpen(false);
      setEditingStation(null);
    } catch (error) {
      message.error("保存充电站信息时发生错误。");
    }
  };

  // 处理取消表单
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingStation(null);
    form.resetFields();
  };

  // 批量删除或单个删除（兼容两种调用方式）
  const handleBatchDelete = (ids) => {
    const stationIds = ids && ids.length ? ids : selectedRowKeys;
    if (stationIds.length === 0) {
      message.warning("请选择需要删除的充电站。");
      return;
    }
    confirm({
      title: "确定要删除选中的充电站吗？",
      icon: <ExclamationCircleOutlined />,
      content: `正在删除 ${stationIds.length} 条充电站记录。该操作无法撤销，请谨慎操作！`,
      okText: "确认",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          const response = await axios.post("/api/stations/delete_batch", {
            station_ids: stationIds,
          });
          if (response.data.success) {
            message.success("删除成功！");
            fetchStations();
            if (!ids) {
              setSelectedRowKeys([]);
            }
          } else {
            message.error("删除失败。");
          }
        } catch (error) {
          message.error("删除记录时发生错误。");
        }
      },
    });
  };

  // 处理CSV 文件上传 —— 上传文件至后端的 uploads 文件夹
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post("/api/stations/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data.success) {
        message.success("充电站信息上传成功！");
        fetchStations();
      } else {
        message.error(response.data.message || "充电站信息上传失败。");
      }
    } catch (error) {
      message.error("文件上传失败！");
    }
    return false; // 阻止 antd Upload 组件的默认上传行为
  };

  // 批量下载
  const handleBatchDownload = (stations) => {
    if (!Array.isArray(stations) || stations.length === 0) {
      message.warning("没有需要下载的数据···");
      return;
    }

    // 生成列选项并重置选中状态
    const keys = Object.keys(stations[0]);
    const columnOptions = keys.map((key) => ({
      label: key,
      value: key,
    }));
    
    setDownloadColumns(columnOptions);
    setSelectedColumns(keys);
    setIsDownloadModalOpen(true); // 打开下载选项模态框
  };

  // 处理下载确认
  const handleDownloadOk = async () => {
    if (selectedColumns.length === 0) {
      message.warning("至少选择一个字段！");
      return;
    }
    console.log('选择的字段：', selectedColumns);
    try {
      const response = await axios.post(
        "/api/stations/download",
        { columns: selectedColumns },
        { responseType: "blob" }
      );

      // 生成文件名
      const timestamp = dayjs().format("YYYYMMDD_HHmmss");
      const filename = `ChargingStations_${timestamp}.csv`;

      // 转换数据为 CSV
      const ws = XLSX.utils.json_to_sheet(stations, { header: selectedColumns });
      const csvData = XLSX.utils.sheet_to_csv(ws);
      const fileData = new Blob([csvData], { type: "text/csv;charset=utf-8" });
      saveAs(fileData, filename);

      setIsDownloadModalOpen(false); // 关闭模态框
    } catch (error) {
      message.error("下载失败，请重试！");
    }
  };


  // 组件挂载时获取充电站数据
  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  return (
    <div>
      {/* 引入操作子组件 */}
      <StationActions
        onSearch={debouncedSearch}
        onAdd={() => handleUpdate(null)}
        onUpload={handleUpload}
        onDownload={() => handleBatchDownload(stations)}
        onBatchDelete={() => handleBatchDelete()}
        selectedRowKeys={selectedRowKeys}
      />

      {/* 表格区域使用 Spin 显示加载状态 */}
      <Spin spinning={loading}>
        <StationTable
          data={stations}
          loading={loading}
          pagination={pagination}
          onTableChange={handleTableChange}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          onEdit={handleUpdate}
          onDelete={handleBatchDelete}
        />
      </Spin>

      {/* 新增/编辑弹窗 */}
      <StationFormModal
        visible={isModalOpen}
        onCancel={handleCancel}
        onSave={handleSave}
        form={form}
        editingStation={editingStation}
      />

      {/* 下载选项模态框 */}
      <Modal
        title="下载字段选项"
        open={isDownloadModalOpen}
        onOk={handleDownloadOk}
        onCancel={() => setIsDownloadModalOpen(false)}
        okText="下载"
        cancelText="取消"
      >
        <div>
          <p>Select columns to include in the CSV download:</p>
          <Checkbox.Group
            options={downloadColumns}
            value={selectedColumns}
            onChange={(checkedValues) => setSelectedColumns(checkedValues)}
            style={{ display: "flex", flexDirection: "column" }}
          />
        </div>
      </Modal>
    </div>


  );
};

export default ChargingStations;
