// InfoHelpButton.jsx

import React from "react";
import { Button, Popover } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";

const predefinedExplanations = {
    cluster: {
        content: (
            <>
                <p><b>典型用电模式：</b>根据历史用电数据进行聚类分析，识别出在不同时间段、不同强度的用电模式。</p>
                <p>每种模式对应不同的用户行为习惯（如深夜集中、白天分布或高峰时段冲击等），有助于判断站点是否面临集中式用电压力。</p>
                <p><b>管理意义：</b>便于制定错峰调度策略、合理配置站点容量与功率、实现供需动态平衡。</p>
            </>
        ),
    },
    hourly: {
        content: (
            <>
                <p><b>24小时平均用电量：</b>对历史数据按小时聚合，得到每日每个小时段的平均用电情况。</p>
                <p>反映了整体使用负荷的日内波动趋势，例如早晚高峰、夜间空闲等。</p>
                <p><b>管理意义：</b>有助于识别负荷高峰、低谷期，进行时间段定价、电网负载预测和充电引导优化。</p>
            </>
        ),
    },
    prophet: {
        content: (
            <>
                <p><b>Prophet模型：</b>由Facebook开发的时间序列预测模型，适用于具有趋势、季节性和假日效应的场景。</p>
                <p>优势包括：自动拟合趋势+周期成分，鲁棒性强，适配性好。</p>
                <p><b>管理意义：</b>比较预测结果与实际负荷，为充电量分析提供参考。</p>
            </>
        ),
    },
    forecast: {
        content: (
            <>
                <p><b>预测内容：</b>基于历史充电量数据，生成未来24小时逐时用电量预测。</p>
                <p><b>管理意义：</b>提前掌握负荷波动趋势，支持站点功率预警、负载均衡策略、充电引导调度等应用。</p>
                <p>有助于提升能源管理的前瞻性和精细化水平。</p>
            </>
        ),
    },
};

const InfoHelpButton = ({ type = "custom", customTitle, customContent }) => {
    const explanation = predefinedExplanations[type];

    const title = explanation?.title || customTitle || "指标解释";
    const content = explanation?.content || customContent || "暂无内容";

    return (
        <Popover title={title} content={content} trigger="click">
            <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                style={{ marginLeft: 8 }}
            />
        </Popover>
    );
};

export default InfoHelpButton;
