import React from 'react';
import { Modal, Table, Typography } from 'antd';

const { Text } = Typography;

const StationModal = ({ visible, onClose, station }) => {
    if (!station) return null; // 如果没有充电站数据，不渲染

    const { station_id, address, latitude, longitude, pile_count } = station;

    // 经纬度格式化
    const lon = longitude;
    const lat = latitude;

    // 根据正负判断东经/西经、北纬/南纬，并添加度符号
    const lonText = (lon >= 0 ? "E " : "W ") + Math.abs(lon) + "°";
    const latText = (lat >= 0 ? "N " : "S ") + Math.abs(lat) + "°";

    // Table 数据源
    const dataSource = [
        {
            key: '1',
            label: '充电站ID',
            value: station_id,
        },
        {
            key: '2',
            label: '桩数',
            value: pile_count,
        },
        {
            key: '3',
            label: '地址',
            value: address,
        },
        {
            key: '4',
            label: '位置',
            value: <em>{lonText}, {latText}</em>,
        },
    ];

    // Table 列配置
    const columns = [
        {
            title: '字段',
            dataIndex: 'label',
            key: 'label',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: '值',
            dataIndex: 'value',
            key: 'value',
        },
    ];

    return (
        <Modal
            title="充电站详细信息"
            open={visible}
            onCancel={onClose}
            footer={null} // 不显示底部按钮
            width={500} // 设置宽度
        >
            <Table
                dataSource={dataSource}
                columns={columns}
                pagination={false} // 不显示分页
                showHeader={false} // 不显示表头
                bordered
                size="small" // 表格小型显示
            />
        </Modal>
    );
};

export default StationModal;
