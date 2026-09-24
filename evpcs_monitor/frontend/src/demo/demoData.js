import stationSnapshot from "./demoStations.generated.json";

// 站点坐标、地址和桩数由 scripts/generate-demo-stations.mjs 从
// backend/network_data/*_community.json 去重生成。其他展示字段与时序指标
// 使用固定规则补充，不代表线上实时数据。
export const DEMO_DATA_SOURCE_NOTE =
  "1543 个站点来自仓库 network_data 快照；运行指标与补充字段为确定性模拟数据";

export const districtCatalog = [
  { adcode: "440303", district_name: "罗湖区", longitude: 114.123, latitude: 22.555, population: 114.38, area: 78.75 },
  { adcode: "440304", district_name: "福田区", longitude: 114.055, latitude: 22.522, population: 155.32, area: 78.66 },
  { adcode: "440305", district_name: "南山区", longitude: 113.93, latitude: 22.533, population: 179.58, area: 187.53 },
  { adcode: "440306", district_name: "宝安区", longitude: 113.884, latitude: 22.555, population: 447.66, area: 397.0 },
  { adcode: "440307", district_name: "龙岗区", longitude: 114.247, latitude: 22.72, population: 397.9, area: 388.21 },
  { adcode: "440308", district_name: "盐田区", longitude: 114.236, latitude: 22.557, population: 21.54, area: 74.91 },
  { adcode: "440309", district_name: "龙华区", longitude: 114.04, latitude: 22.696, population: 252.89, area: 175.58 },
  { adcode: "440310", district_name: "坪山区", longitude: 114.35, latitude: 22.69, population: 56.65, area: 166.31 },
  { adcode: "440311", district_name: "光明区", longitude: 113.935, latitude: 22.748, population: 109.53, area: 155.44 },
];

export const demoStations = stationSnapshot.map((station, index) => {
  const pile_count = Number(station.pile_count) || 0;
  const ac_piles_count = pile_count > 0 ? Math.max(1, Math.round(pile_count * 0.4)) : 0;
  return {
    ...station,
    station_id: String(station.station_id),
    adcode: String(station.adcode),
    pile_count,
    ac_piles_count,
    dc_piles_count: Math.max(0, pile_count - ac_piles_count),
    has_parking_fee: index % 3 === 0 ? 1 : 0,
    status: 1,
    created_at: `2024-${String((index % 9) + 1).padStart(2, "0")}-01T08:00:00Z`,
    updated_at: `2025-${String((index % 9) + 1).padStart(2, "0")}-15T10:30:00Z`,
  };
});

export const demoUsers = [
  { user_id: 9001, username: "demo@chargemind.local", role: "admin", created_at: "2024-01-08T08:00:00Z", updated_at: "2025-06-01T09:00:00Z" },
  { user_id: 9002, username: "operator@chargemind.local", role: "operator", created_at: "2024-03-12T08:00:00Z", updated_at: "2025-05-18T09:00:00Z" },
  { user_id: 9003, username: "viewer@chargemind.local", role: "viewer", created_at: "2024-05-20T08:00:00Z", updated_at: "2025-04-06T09:00:00Z" },
];

export const demoBusinessItems = [
  {
    id: 1,
    contact_name: "陈先生",
    contact_info: "demo-contact@example.com",
    company: "鹏城绿色出行示例公司",
    position: "运营负责人",
    company_size: "100-499人",
    industry: "新能源服务",
    cooperation_type: "技术合作",
    region: "深圳",
    website: "https://example.com",
    needs: "希望评估重点商圈公共充电站的利用率，并探索站点运营监测合作。",
    is_read: false,
    created_at: "2025-06-18T09:20:00Z",
  },
  {
    id: 2,
    contact_name: "林女士",
    contact_info: "demo-invest@example.com",
    company: "湾区能源示例基金",
    position: "投资经理",
    company_size: "20-99人",
    industry: "产业投资",
    cooperation_type: "投资入驻",
    region: "广州",
    website: "",
    needs: "关注充电基础设施的区域供需与长期运营效率，希望进一步交流数据指标体系。",
    is_read: true,
    created_at: "2025-05-26T14:10:00Z",
  },
];

export const demoNews = {
  infrastructure: [
    { title: "演示：公共充电基础设施运营监测指标持续完善", source: "ChargeMind Demo", publish_time: "2025-06-18", url: "https://example.com" },
    { title: "演示：城市级充电网络布局进入精细化分析阶段", source: "ChargeMind Demo", publish_time: "2025-06-12", url: "https://example.com" },
  ],
  ev_trends: [{ title: "演示：新能源汽车补能体验成为运营关注重点", source: "ChargeMind Demo", publish_time: "2025-06-09", url: "https://example.com" }],
  battery_tech: [{ title: "演示：高功率充电设施的运维要求进一步提升", source: "ChargeMind Demo", publish_time: "2025-06-03", url: "https://example.com" }],
  clean_energy: [{ title: "演示：光储充协同应用持续拓展", source: "ChargeMind Demo", publish_time: "2025-05-28", url: "https://example.com" }],
  policies: [{ title: "演示：公共充电设施服务能力评价受到关注", source: "ChargeMind Demo", publish_time: "2025-05-20", url: "https://example.com" }],
};

export const demoComments = [
  { comment_id: 1, user_id: 9002, username: "运营示例用户", content: "希望后续增加站点故障率和峰谷利用率的联动分析。", likes: 12, liked: false, reply_count: 0, created_at: "2025-06-20T10:10:00Z", parent_id: null },
  { comment_id: 2, user_id: 9003, username: "访客示例用户", content: "行政区和站点两级筛选很直观，适合快速定位重点区域。", likes: 8, liked: false, reply_count: 0, created_at: "2025-06-19T16:35:00Z", parent_id: null },
];

export const cloneDemoSeed = () => ({
  stations: demoStations.map((item) => ({ ...item })),
  users: demoUsers.map((item) => ({ ...item })),
  businessItems: demoBusinessItems.map((item) => ({ ...item })),
  comments: demoComments.map((item) => ({ ...item })),
});
