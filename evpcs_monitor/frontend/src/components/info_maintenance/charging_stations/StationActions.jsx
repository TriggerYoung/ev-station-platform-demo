// ChargingStationActions.jsx: 定义了一个名为 ChargingStationActions 的组件，用于渲染充电站的操作按钮和搜索框。
import React from 'react';
import { Input, Tooltip, Button, Space, Upload } from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const StationActions = ({
  onSearch,
  onAdd,
  onUpload,
  onDownload,
  onBatchDelete,
  selectedRowKeys,
}) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        {/* 搜索框 */}
        <Input.Search
          placeholder="输入充电站ID或者地址名称进行检索"
          onSearch={onSearch}
          onChange={(e) => onSearch(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />

        {/* 操作按钮组：均为图标按钮，并结合 Tooltip 提示 */}
        <Space>
          <Tooltip title="新增">
            <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} />
          </Tooltip>
          <Upload beforeUpload={onUpload} showUploadList={false}>
            <Tooltip title="上传 CSV/Excel 文件">
              <Button icon={<UploadOutlined />} />
            </Tooltip>
          </Upload>
          <Tooltip title="下载 CSV 文件">
            <Button icon={<DownloadOutlined />} onClick={onDownload} />
          </Tooltip>
          <Tooltip title="批量删除">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={onBatchDelete}
              disabled={!selectedRowKeys || selectedRowKeys.length === 0}
            />
          </Tooltip>
        </Space>
      </Space>
    </div>
  );
};

export default StationActions;