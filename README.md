# ChargeMind

电动汽车公共充电基础设施管理监测分析系统。项目围绕充电站与充电桩的数据维护、运行监测和分析展示构建，包含管理后台、数据大屏、区域网络分析、智能报告、社区与商务合作等模块。

[![在线 Demo](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF-Demo-1677ff?style=for-the-badge)](https://ev-station-demo-d8frqazl42cb8a15-1495752147.tcloudbaseapp.com/?demo=1&guest=1)

在线 Demo 自动进入演示访客模式，使用模拟数据展示各模块功能；演示操作不会写入真实业务数据。

## 功能模块

- **信息维护**：管理充电站、充电桩、行政区、时序数据及系统用户等信息。
- **数据大屏**：汇总展示站点与充电桩规模、充电量、占用情况及价格等运行指标。
- **区域网络分析**：展示充电站的空间分布与网络结构。
- **智能分析报告**：对充电量时间序列进行统计、聚类和预测，并生成分析结果。
- **社区与商务合作**：提供行业资讯、评论互动和合作意向管理功能。

## 技术与数据

前端使用 React；后端使用 Flask 提供按业务模块划分的 API。MySQL 存储站点、充电桩、用户等关系型数据，InfluxDB 存储充电量、占用率等时序数据；分析模块使用 pandas、scikit-learn 和 statsmodels 等工具。

在线 Demo 基于仓库中的 1,543 个充电站快照构造演示数据，运行指标与补充字段为确定性模拟数据。完整的 Flask、MySQL 和 InfluxDB 实现保留在仓库中。

## 项目结构

| 路径 | 内容 |
| --- | --- |
| `evpcs_monitor/frontend/` | React 前端与演示数据适配层 |
| `evpcs_monitor/backend/` | Flask API、数据处理与分析逻辑 |
| `evpcs_monitor/backend/network_data/` | 充电站网络数据快照 |
| `docs/screenshots/` | 主要页面截图 |

## 页面预览

[首页](docs/screenshots/intro.png) · [信息维护](docs/screenshots/info-maintenance.png) · [数据大屏](docs/screenshots/data-panel.png) · [网络分析](docs/screenshots/network-analysis.png) · [分析报告](docs/screenshots/analysis-report.png) · [商务合作](docs/screenshots/business.png) · [社区](docs/screenshots/community.png)
