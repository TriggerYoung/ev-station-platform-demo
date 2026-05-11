# analysis_service.py
import logging
import pandas as pd
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from sklearn.cluster import KMeans
from sklearn.metrics import mean_absolute_error, mean_squared_error
from jinja2 import Template
from scipy.signal import find_peaks
import numpy as np

logger = logging.getLogger(__name__)


def _preprocess_forecast_df(data):
    df = data.reset_index()[["time", "volume"]].rename(columns={"time": "ds", "volume": "y"})
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = df["y"].ewm(span=3, adjust=False).mean()
    mean_y, std_y = df["y"].mean(), df["y"].std()
    if std_y and std_y > 0:
        df["y"] = np.where(
            (df["y"] > mean_y + 3 * std_y) | (df["y"] < mean_y - 3 * std_y),
            mean_y,
            df["y"],
        )
    return df


def _generate_forecast_fallback(df, periods=24):
    """
    当 CmdStan 未安装导致 Prophet 无法初始化时，使用 Holt-Winters 或线性趋势外推，
    返回结构与 _generate_forecast_prophet 一致。
    """
    y = np.asarray(df["y"], dtype=float)
    n = len(y)
    last_ts = pd.Timestamp(df["ds"].iloc[-1])
    future_ds = pd.date_range(last_ts + pd.Timedelta(hours=1), periods=periods, freq="h")

    fitted = None
    fc_vals = None
    if n >= 72:
        try:
            hw_fit = ExponentialSmoothing(
                y, trend="add", seasonal="add", seasonal_periods=24, initialization="estimated"
            ).fit(optimized=True)
            fitted = np.asarray(hw_fit.fittedvalues, dtype=float)
            fc_vals = np.asarray(hw_fit.forecast(periods), dtype=float)
        except Exception:
            fitted = None
            fc_vals = None

    if fitted is None or fc_vals is None or not np.all(np.isfinite(fitted)):
        t_ix = np.arange(n, dtype=float)
        coeffs = np.polyfit(t_ix, y, min(1, max(0, n - 1)))
        p = np.poly1d(coeffs)
        fitted = np.clip(p(t_ix), 0, None)
        fc_vals = np.clip(np.array([p(n + i) for i in range(1, periods + 1)]), 0, None)

    fc_vals = np.clip(fc_vals, 0, None)
    resid = y - fitted[:n]
    resid_std = float(np.nanstd(resid)) if n else 0.0
    resid_std = max(resid_std, float(np.mean(y)) * 0.05 if n else 0.1, 0.01)
    yhat_lower = np.clip(fc_vals - 1.96 * resid_std, 0, None).tolist()
    yhat_upper = (fc_vals + 1.96 * resid_std).tolist()

    split_idx = int(n * 0.8)
    test_df = df.iloc[split_idx:]
    y_true = test_df["y"].values
    y_pred = fitted[split_idx:n]
    mae = mean_absolute_error(y_true, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))

    return {
        "history_ds": [pd.Timestamp(ts).to_pydatetime() for ts in df["ds"]],
        "history_y": df["y"].tolist(),
        "forecast_ds": [ts.to_pydatetime() for ts in future_ds],
        "forecast_yhat": fc_vals.tolist(),
        "forecast_yhat_lower": yhat_lower,
        "forecast_yhat_upper": yhat_upper,
        "changepoints": np.array([], dtype=object),
        "metrics": {
            "test_data": {
                "timestamps": [pd.Timestamp(t).to_pydatetime().isoformat() for t in test_df["ds"]],
                "y_true": y_true.tolist(),
                "y_pred": y_pred.tolist(),
            },
            "mae": round(float(mae), 3),
            "rmse": round(float(rmse), 3),
        },
    }


def _generate_forecast_prophet(df, periods=24):
    """使用 Prophet（依赖本机已安装 CmdStan，见 README）。"""
    from prophet import Prophet

    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=False,
        changepoint_prior_scale=0.08,
        seasonality_prior_scale=10.0,
        n_changepoints=30,
        stan_backend="CMDSTANPY",
    )
    model.add_seasonality(name="hourly", period=24, fourier_order=12)
    model.add_seasonality(name="workweek", period=7, fourier_order=5)
    model.add_country_holidays(country_name="CN")

    model.fit(df)

    future = model.make_future_dataframe(periods=periods, freq="h")
    forecast = model.predict(future)
    forecast["yhat"] = forecast["yhat"].clip(lower=0)

    peaks, _ = find_peaks(forecast["yhat"], height=0.05, prominence=0.2)
    valleys, _ = find_peaks(-forecast["yhat"], height=0.05, prominence=0.2)
    changepoints = sorted(np.concatenate([peaks, valleys]))
    if len(changepoints):
        changepoint_times = np.array(
            [ts.to_pydatetime() for ts in forecast["ds"].iloc[changepoints]]
        )
    else:
        changepoint_times = np.array([], dtype=object)

    split_idx = int(len(df) * 0.8)
    test_df = df.iloc[split_idx:]
    test_forecast = forecast.set_index("ds").loc[test_df["ds"]]

    y_true = test_df["y"].values
    y_pred = test_forecast["yhat"].values

    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))

    evaluation_data = {
        "timestamps": [x.to_pydatetime().isoformat() for x in test_df["ds"]],
        "y_true": y_true.tolist(),
        "y_pred": y_pred.tolist(),
    }

    return {
        "history_ds": [pd.Timestamp(ts).to_pydatetime() for ts in df["ds"]],
        "history_y": df["y"].tolist(),
        "forecast_ds": [ts.to_pydatetime() for ts in forecast["ds"].tail(periods)],
        "forecast_yhat": forecast["yhat"][-periods:].tolist(),
        "forecast_yhat_lower": forecast["yhat_lower"][-periods:].tolist(),
        "forecast_yhat_upper": forecast["yhat_upper"][-periods:].tolist(),
        "changepoints": changepoint_times,
        "metrics": {
            "test_data": evaluation_data,
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
        },
    }


def generate_forecast(data, periods=24):
    """优先使用 Prophet；若 CmdStan 未安装等导致失败，则使用 Holt-Winters / 线性外推。"""
    df = _preprocess_forecast_df(data)
    try:
        return _generate_forecast_prophet(df, periods)
    except AttributeError as e:
        if "stan_backend" in str(e):
            logger.warning(
                "Prophet 未加载 CmdStan（可执行一次: python -m cmdstanpy.install_cmdstan）。"
                "已改用统计回退预测。"
            )
        else:
            logger.warning("Prophet 失败 (%s)，已改用统计回退预测。", e)
        return _generate_forecast_fallback(df, periods)
    except Exception as e:
        logger.warning("Prophet 失败 (%s)，已改用统计回退预测。", e)
        return _generate_forecast_fallback(df, periods)


# 高级分析
def enhanced_analysis(data):
    # 基础统计
    stats = {
        "total": data["volume"].sum(),
        "mean": round(data["volume"].mean(), 2),
        "max": data["volume"].max(),
        "max_time": data["volume"].idxmax().strftime("%Y-%m-%d %H:%M"),
        "min": data["volume"].min(),
        "min_time": data["volume"].idxmin().strftime("%Y-%m-%d %H:%M"),
    }

    # 趋势分解
    decomposition = seasonal_decompose(data["volume"], period=24)
    trend = decomposition.trend.dropna()

    # 用电模式聚类
    kmeans = KMeans(n_clusters=4)
    data["cluster"] = kmeans.fit_predict(data[["volume"]])

    # 使用Prophet生成未来预测
    forecast = generate_forecast(data)

    # 处理聚类结果
    clusters = []
    for i in range(4):
        cluster_data = data[data["cluster"] == i]

        if not cluster_data.empty:
            # 提取时间列并转换为小时
            cluster_hours = cluster_data.index.hour

            # 统计每个小时的出现次数
            hour_counts = cluster_hours.value_counts().sort_index()

            # 找到连续的高频时间段
            max_count = hour_counts.max()
            main_hours = hour_counts[hour_counts == max_count].index.tolist()

            # 动态计算时间段的起始和结束
            if len(main_hours) > 1:
                start_hour = main_hours[0]
                end_hour = main_hours[-1] + 1  # 结束时间为最后一个高频小时的下一小时
            else:
                start_hour = main_hours[0]
                end_hour = (start_hour + 1) % 24  # 如果只有一个高频小时，时间段为1小时

            # 格式化时间段
            time_range = f"{start_hour:02d}:00 - {end_hour:02d}:00"

            # 添加到聚类结果
            clusters.append(
                {
                    "description": f"典型用电量 {cluster_data['volume'].mean():.1f} kWh（主要时间段：{time_range}）",
                    "percentage": len(cluster_data) / len(data) * 100,
                }
            )

    # 计算每个小时的平均用电量
    # data索引是DatetimeIndex, 直接groupby index.hour
    hourly_mean_series = data.groupby(data.index.hour)["volume"].mean()
    # 转成字典 { hour: avg_volume }
    hourly_mean_dict = hourly_mean_series.to_dict()

    # 生成自然语言报告模板
    report_template = Template(
        """
    用电分析报告：
    1. 基础统计：
    - 总用电量：{{ stats.total }} kWh
    - 平均每小时用电量：{{ stats.mean }} kWh
    - 最高用电量：{{ stats.max }} kWh（发生在 {{ stats.max_time }}）
    - 最低用电量：{{ stats.min }} kWh（发生在 {{ stats.min_time }}）

    2. 趋势特征：
    {% if trend[-24:].mean() > trend.mean() %}
    - 近期呈现总体上升趋势（最近24小时平均 {{ trend[-24:].mean()|round(2) }} kWh）
    {% else %}
    - 近期呈现总体平稳/下降趋势
    {% endif %}

    3. 用电模式：
    - 系统识别到{{ clusters|length }}种典型用电模式
    {% for c in clusters %}
    模式{{ loop.index }}：{{ c.description }}（占比{{ c.percentage|round(1) }}%）
    {% endfor %}

    4. 未来预测（基于提供的历史数据）：
    - 预计未来24小时平均用电量：{{ forecast_mean|round(1) }} kWh
    - 最高预测值：{{ forecast_max|round(3) }} kWh（{{ forecast_max_time }}）
    - 最低预测值：{{ forecast_min|round(3) }} kWh（{{ forecast_min_time }}）
    """
    )

    # 计算预测统计
    forecast_values = pd.Series(forecast["forecast_yhat"][-24:])
    forecast_stats = {
        "forecast_mean": forecast_values.mean(),
        "forecast_max": forecast_values.max(),
        "forecast_max_time": forecast["forecast_ds"][
            -24 + forecast_values.argmax()
        ].strftime("%Y-%m-%d %H:%M"),
        "forecast_min": forecast_values.min(),
        "forecast_min_time": forecast["forecast_ds"][
            -24 + forecast_values.argmin()
        ].strftime("%Y-%m-%d %H:%M"),
    }

    return {
        "stats": stats,
        "report": report_template.render(
            stats=stats,
            trend=trend,
            clusters=clusters,
            forecast_mean=forecast_stats["forecast_mean"],
            forecast_max=forecast_stats["forecast_max"],
            forecast_max_time=forecast_stats["forecast_max_time"],
            forecast_min=forecast_stats["forecast_min"],
            forecast_min_time=forecast_stats["forecast_min_time"],
        ),
        "clusters": clusters,  # 返回聚类结果
        "hourly_mean": hourly_mean_dict,  # 返回每小时平均用电量
        "forecast": forecast,  # 返回预测数据
    }


# 修改前
#
# def generate_forecast(data, periods=24):
#     """使用Prophet生成未来24小时预测，并优化变点识别"""
#     df = data.reset_index()[['time', 'volume']].rename(columns={'time': 'ds', 'volume': 'y'})

#     # 配置更精确的模型参数
#     model = Prophet(
#         daily_seasonality=True,
#         weekly_seasonality=True,
#         growth='linear',
#         seasonality_mode='additive',
#         changepoint_prior_scale=5,  # 增加变点灵敏度
#         n_changepoints=100,  # 设置潜在变点数量
#         changepoint_range=0.9
#     )
#     model.add_seasonality(name='hourly', period=1, fourier_order=5)
#     model.fit(df)

#     future = model.make_future_dataframe(periods=periods, freq='h')
#     forecast = model.predict(future)

#     # 确保非负
#     forecast['yhat'] = forecast['yhat'].clip(lower=0)

#     # 使用Prophet原生变点检测
#     changepoints = model.changepoints

#     # 计算趋势变化量
#     forecast['trend_diff'] = forecast['trend'].diff().abs()


#     # 使用波峰波谷检测来优化显著变点的检测
#     peaks, _ = find_peaks(forecast['yhat'], height=0.05, prominence=0.2)  # 只检测较大的波峰
#     valleys, _ = find_peaks(-forecast['yhat'], height=0.05, prominence=0.2)  # 只检测较大的波谷

#     # 合并波峰和波谷的变点
#     changepoints = np.concatenate([peaks, valleys])

#     # 排序变点并转换为时间格式
#     changepoints = sorted(changepoints)
#     # 修复：通过列表推导式避免直接使用dt.to_pydatetime()
#     changepoint_times = np.array([ts.to_pydatetime() for ts in forecast['ds'].iloc[changepoints]])

#     return {
#         # 修复：使用列表推导式转换每个时间戳
#         'history_ds': np.array([ts.to_pydatetime() for ts in df['ds']]),
#         'history_y': df['y'].tolist(),
#         # 修复：使用tail获取最后periods个元素并通过列表推导式转换
#         'forecast_ds': np.array([ts.to_pydatetime() for ts in forecast['ds'].tail(periods)]),
#         'forecast_yhat': forecast['yhat'][-periods:].tolist(),
#         'forecast_yhat_lower': forecast['yhat_lower'][-periods:].tolist(),
#         'forecast_yhat_upper': forecast['yhat_upper'][-periods:].tolist(),
#         'changepoints': changepoint_times  # 返回变点时间
#     }
