# routes.py
from flask import Blueprint, jsonify, request
import pandas as pd
from .analysis_service import enhanced_analysis

analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.route("/", methods=["POST"])
def analysis_route():
    file = request.files["file"]
    data = pd.read_csv(file)

    # 数据处理
    data["time"] = pd.to_datetime(data["time"])
    data.set_index("time", inplace=True)
    hourly_data = data.resample("h").sum()

    # 高级分析
    analysis = enhanced_analysis(hourly_data)

    # 返回结构化结果
    return jsonify(
        {
            "analysis_result": {
                "stats": analysis["stats"],
                "report": analysis["report"],
                "raw_data": hourly_data.reset_index().to_dict(orient="list"),
                "clusters_data": analysis["clusters"],  # 包含聚类数据
                "hourly_mean": analysis["hourly_mean"],  # 包含每小时均值数据
                "forecast": {  # 包含预测数据
                    "times": [
                        x.isoformat() for x in analysis["forecast"]["forecast_ds"]
                    ],
                    "yhat": analysis["forecast"]["forecast_yhat"],
                    "yhat_lower": analysis["forecast"]["forecast_yhat_lower"],
                    "yhat_upper": analysis["forecast"]["forecast_yhat_upper"],
                    "changepoints": [
                        x.isoformat() for x in analysis["forecast"]["changepoints"]
                    ],
                },
                "metrics": analysis["forecast"]["metrics"],  # 包含预测模型评估指标
            }
        }
    )
