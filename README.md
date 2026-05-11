# EV Charging Operations Console

全栈演示项目：**充电站与桩的台账管理**、**运行态时序指标可视化**、**地图与网络视图**、**上传数据的统计与预测**、**反馈与社区模块**。前后端按业务域拆分，便于阅读代码结构。

**维护者：** [@TriggerYoung](https://github.com/TriggerYoung)

---

## 逻辑说明

- **数据分层**：关系型数据承载站点、桩、用户等主数据；时序数据承载电量、占用率、价格等观测，查询与展示路径分离。  
- **接口形态**：后端按模块划分 REST 入口；前端路由与模块一一对应，页面内聚合图表与地图能力。  
- **分析链路**：对上传的时间序列做重采样与统计，在预测环节优先使用 Prophet，环境不满足时回退到轻量统计模型，保证接口形态稳定。

---

## 技术概要

前端以 React 为主，配合常用图表与地图组件；后端为 Flask，连接 MySQL 与 InfluxDB 2.x；分析侧使用 pandas、scikit-learn、statsmodels 等。

---

## 页面展示

### 落地页

项目入口与总览，串联各功能模块的导航与简要说明。

![落地页](docs/screenshots/intro.png)

### 登录

身份与权限入口，区分不同角色对后台能力的访问范围。

![登录](docs/screenshots/login.png)

### 信息维护

充电站、充电桩、用户与行政区等主数据的维护界面，支持检索、分页与批量类操作。

![信息维护](docs/screenshots/info-maintenance.png)

### 数据大屏

将电量、占用率、价格、排名等时序与聚合指标放在同一视图中，便于观察运行态势。

![数据大屏](docs/screenshots/data-panel.png)

### 网络分析

结合地图与图结构，展示站点空间分布及社群 / 网络关系类可视化。

![网络分析](docs/screenshots/network-analysis.png)

### 分析报告

上传带时间戳的用电（或同类）序列后，进行统计摘要、模式聚类与时序预测，并生成可读结论。

![分析报告](docs/screenshots/analysis-report.png)

### 商务反馈

面向业务侧的留言与处理流：提交、列表浏览与状态标记。

![商务反馈](docs/screenshots/business.png)

### 社区

讨论区能力：列表、回复、点赞与热榜，以及基于文本的词云等展示。

![社区](docs/screenshots/community.png)

---

本仓库以**代码与结构展示**为主，不包含业务数据与运行环境说明。
