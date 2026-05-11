// FileUpload.js
import React from "react";
import { Upload, Button, message, Modal } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import moment from "moment";

const FileUpload = ({ fileList, setFileList, setOriginalData, resetPage }) => {
    const handleFileChange = (info) => {
        if (info.file.status === "done") {
            message.success(`${info.file.name} 文件上传成功`);
        } else if (info.file.status === "error") {
            message.error(`${info.file.name} 文件上传失败`);
        }
        setFileList(info.fileList);
    };

    const parseCSVData = (file) => {
        const isCSV = file.type === 'text/csv';
        if (!isCSV) {
            message.error('只能上传CSV文件!');
            return false;
        }
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                const data = results.data;
                const times = data.map(item => moment.utc(item.time).format("yyyy-MM-DD HH:mm:ss"));
                const volumes = data.map(item => item.volume);

                setOriginalData({ times, volumes });
            },
            error: (error) => {
                console.error("解析 CSV 文件出错:", error);
                message.error("CSV 文件解析失败，请检查文件格式");
            }
        });
    };

    const handleRemove = (file) => {
        return new Promise((resolve, reject) => {
            Modal.confirm({
                title: '确认清除该文件？清除文件后分析页面将重置，注意保存分析结果！',
                content: `文件名：${file.name}`,
                okText: '确认',
                cancelText: '取消',
                onOk() {
                    resetPage(); // 清空页面状态
                    resolve(true); // 允许
                },
                onCancel() {
                    resolve(false); // 取消
                }
            });
        });
    };

    const updatedFileList = fileList.map((file) => ({
        ...file,
        name: `${file.name} (${Math.floor(file.size / 1024)} KB)`
    }));

    return (
        <Upload
            maxCount={1}
            fileList={updatedFileList}
            onChange={handleFileChange}
            beforeUpload={(file) => {
                parseCSVData(file);
                return false;
            }}
            onRemove={handleRemove}
        >
            <Button icon={<UploadOutlined />} block>点击上传CSV文件</Button>
        </Upload>
    );
};

export default FileUpload;