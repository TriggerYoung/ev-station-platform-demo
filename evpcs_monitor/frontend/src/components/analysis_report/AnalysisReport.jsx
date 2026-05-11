// AnalysisReport.jsx
import React, { useState, useEffect } from "react";
import { Layout, Steps, Spin, Row, Col, Card, Tooltip, Button, message, Tour, Popover } from "antd";
import { DownloadOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import ParticlesBg from "particles-bg";

// 子组件
import LineChart from "./LineChart";
import Selections from "./Selections";
import FileUpload from "./FileUpload";
import FutureForecastChart from "./FutureForecastChart";
import ModelEvaluationChart from "./ModelEvaluationChart";
import ClustersPieChart from "./ClustersPieChart";
import BarChart from "./BarChart";
import DataTable from "./DataTable";
import InfoHelpButton from "./InfoHelpButton";

const { Step } = Steps;
const { Header, Content } = Layout;

const AnalysisReport = () => {
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [originalData, setOriginalData] = useState(null);
    const [selectedTimeUnit, setSelectedTimeUnit] = useState("hour");
    const [aggregatedData, setAggregatedData] = useState({
        aggregatedTimes: [],
        aggregatedVolumes: [],
    });

    // Tour相关
    const [tourOpen, setTourOpen] = useState(true);

    // Tour 步骤定义
    const tourSteps = [
        {
            title: "上传数据",
            description: `请上传包含time（时间，例如"2022-09-01 08:00:00"）、volume（充电量kWh） 两列的CSV文件，点击这里选择上传文件`,
            target: () => document.querySelector("#uploadFileArea"),
        },
        {
            title: "提交分析",
            description: `选择完文件后，点击此处开始智能分析，分析过程需要时间，稍等片刻哦~`,
            target: () => document.querySelector("#analysisButton"),
        },
        {
            title: "查看分析结果",
            description: `上传成功并分析完成后，这里会显示可视化图表和报告内容，可以下载分析结果`,
            target: () => document.querySelector("#analysisResultArea"),
        },
    ];

    // 上传并分析
    const handleUpload = async () => {
        // 判断是否有文件
        if (fileList.length === 0) {
            message.error("请先上传文件！");
            return;
        }
        // 检查 originalData 是否包含 time 和 volume
        // 例如 originalData.times / originalData.volumes
        if (!originalData || !originalData.times || !originalData.volumes) {
            message.error(
                "文件格式不正确，请确保CSV中包含 'time' 与 'volume' 列，并已正确解析。"
            );
            return;
        }

        // 如果通过了检查，才发请求
        setLoading(true);
        setCurrentStep(1);

        const formData = new FormData();
        formData.append("file", fileList[0].originFileObj);

        try {
            const response = await axios.post("/api/analysis", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setLoading(false);
            setCurrentStep(2);

            if (response.data) {
                setAnalysisResult(response.data.analysis_result);
            }
        } catch (error) {
            setLoading(false);
            setCurrentStep(0);
            message.error("智能分析出错");
        }
    };

    // 数据聚合函数
    const aggregateData = (times, volumes) => {
        const aggregatedTimes = [];
        const aggregatedVolumes = [];
        const timeFormat =
            selectedTimeUnit === "hour"
                ? "YYYY-MM-DD HH:mm"
                : selectedTimeUnit === "day"
                    ? "YYYY-MM-DD"
                    : selectedTimeUnit === "month"
                        ? "YYYY-MM"
                        : "YYYY";

        let currentSum = 0;
        let currentTime = times[0];

        times.forEach((time, idx) => {
            const formattedTime = moment(time).format(timeFormat);
            if (formattedTime !== currentTime) {
                aggregatedTimes.push(currentTime);
                aggregatedVolumes.push(currentSum);
                currentSum = volumes[idx];
                currentTime = formattedTime;
            } else {
                currentSum += volumes[idx];
            }
        });

        aggregatedTimes.push(currentTime);
        aggregatedVolumes.push(currentSum);

        return { aggregatedTimes, aggregatedVolumes };
    };

    // 触发数据聚合
    const handleAggregation = () => {
        if (originalData) {
            const { aggregatedTimes, aggregatedVolumes } = aggregateData(
                originalData.times,
                originalData.volumes
            );
            setAggregatedData({ aggregatedTimes, aggregatedVolumes });
        }
    };

    // 下载分析报告
    const handleDownLoadReport = async () => {
        if (analysisResult) {
            const reportText = analysisResult.report;
            const blob = new Blob([reportText], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "analysis_report.txt";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    // 重置页面
    const resetPage = () => {
        setFileList([]);
        setAnalysisResult(null);
        setCurrentStep(0);
        setOriginalData(null);
        setSelectedTimeUnit("hour");
        setAggregatedData({
            aggregatedTimes: [],
            aggregatedVolumes: [],
        });
    };

    // 当 selectedTimeUnit 或 originalData 变化时触发聚合
    useEffect(() => {
        handleAggregation();
    }, [selectedTimeUnit, originalData]);

    return (
        <Layout style={{ height: "100vh", background: "none" }}>
            <ParticlesBg type="cobweb" bg={true} num={70} />
            <Header style={{ color: "#fff", textAlign: "center", fontSize: "24px" }}>
                基于充电站历史充电量数据的智能分析平台
            </Header>
            <Content style={{ padding: "20px" }}>
                <Steps current={currentStep}>
                    <Step title="上传数据" />
                    <Step title="智能分析" />
                    <Step title="分析报告" />
                </Steps>
                <div style={{ marginTop: 20 }}>
                    <Row gutter={16}>
                        {/* 文件上传 */}
                        <Col span={11}>
                            {/* 添加 ID 让 Tour 能定位 */}
                            <div id="uploadFileArea">
                                <FileUpload
                                    fileList={fileList}
                                    setFileList={setFileList}
                                    setOriginalData={setOriginalData}
                                    resetPage={resetPage}
                                />

                            </div>
                        </Col>
                        {/* 智能分析按钮 */}
                        <Col span={2}>
                            <Button
                                id="analysisButton"
                                type="primary"
                                block
                                onClick={handleUpload}
                                loading={loading}
                            >
                                开始智能分析
                            </Button>
                        </Col>
                    </Row>
                    {/* 加载 */}
                    {loading && (
                        <Spin
                            size="large"
                            style={{ marginTop: 20, display: "block", textAlign: "center" }}
                        />
                    )}
                    {/* 分析结果 */}
                    {analysisResult && (
                        <div style={{ marginTop: 30 }} id="analysisResultArea">
                            {/* 第一行：趋势分析 */}
                            <Row gutter={16} style={{ marginBottom: 10 }}>
                                <Col span={24}>
                                    <Card
                                        title="趋势分析"
                                        extra={
                                            <Selections
                                                selectedTimeUnit={selectedTimeUnit}
                                                setSelectedTimeUnit={setSelectedTimeUnit}
                                            />
                                        }
                                    >
                                        <LineChart
                                            aggregatedTimes={aggregatedData.aggregatedTimes}
                                            aggregatedVolumes={aggregatedData.aggregatedVolumes}
                                            selectedTimeUnit={selectedTimeUnit}
                                            changepoints={analysisResult.forecast.changepoints}
                                        />
                                    </Card>
                                </Col>
                            </Row>

                            {/* 第二行：用电模式（饼图） & 24小时平均用电量（柱状图） */}
                            <Row gutter={16} style={{ marginBottom: 10 }}>
                                <Col span={12}>
                                    <Card title="典型用电模式" extra={<InfoHelpButton type="cluster" />}>
                                        <ClustersPieChart
                                            clustersData={analysisResult.clusters_data || []}
                                        />
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card title="24小时平均用电量分布" extra={<InfoHelpButton type="hourly" />}>
                                        <BarChart
                                            hourlyMean={
                                                analysisResult.hourly_mean
                                                    ? analysisResult.hourly_mean
                                                    : []
                                            }
                                        />
                                    </Card>
                                </Col>
                            </Row>

                            {/* 第三行：模型预测效果和预测结果卡片 */}
                            <Row gutter={16} style={{ marginBottom: 10 }}>
                                <Col span={12}>
                                    <Card title="Prophet模型预测效果" extra={<InfoHelpButton type="prophet" />}>
                                        <ModelEvaluationChart metrics={analysisResult.metrics} />
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card title="未来24小时用电量预测" extra={<InfoHelpButton type="forecast" />}>
                                        <FutureForecastChart forecast={analysisResult.forecast} />
                                    </Card>
                                </Col>
                            </Row>



                            {/* 第四行：详细数据 & 分析报告 */}
                            <Row gutter={16} style={{ marginBottom: 10 }}>
                                <Col span={12}>
                                    <Card title="详细数据" >
                                        <div style={{ height: 500, overflow: "auto" }}>
                                            <DataTable rawData={analysisResult.raw_data || {}} />
                                        </div>

                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card
                                        title="分析报告"
                                        extra={
                                            <Tooltip title="下载报告">
                                                <Button icon={<DownloadOutlined />} onClick={handleDownLoadReport} />
                                            </Tooltip>
                                        }
                                    >
                                        <div style={{ whiteSpace: "pre-wrap", height: 500, overflow: "auto" }}>
                                            {analysisResult.report}
                                            {analysisResult.forecast &&
                                                `预测区间：
- 下限：${(
                                                    Math.max(
                                                        0,
                                                        analysisResult.forecast.yhat_lower
                                                            .slice(-24)
                                                            .reduce((a, b) => a + b, 0) / 24
                                                    )
                                                ).toFixed(3)} kWh
- 上限：${(
                                                    Math.max(
                                                        0,
                                                        analysisResult.forecast.yhat_upper
                                                            .slice(-24)
                                                            .reduce((a, b) => a + b, 0) / 24
                                                    )
                                                ).toFixed(3)} kWh`}
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    )}
                </div>
            </Content>

            {/* 漫游式引导 */}
            <Tour
                steps={tourSteps}
                open={tourOpen}
                onClose={() => setTourOpen(false)}
            />
        </Layout>
    );
};

export default AnalysisReport;
