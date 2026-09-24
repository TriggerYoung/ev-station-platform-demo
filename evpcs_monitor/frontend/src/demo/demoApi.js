import axios from "axios";
import {
  cloneDemoSeed,
  demoNews,
  districtCatalog,
} from "./demoData";
import { isDemoMode } from "./demoMode";

const state = {
  ...cloneDemoSeed(),
  piles: [],
};

const makeInitialPiles = () =>
  state.stations.flatMap((station, stationIndex) =>
    Array.from({ length: Number(station.pile_count) || 0 }, (_, pileIndex) => ({
      pile_id: `${station.station_id}-${String(pileIndex + 1).padStart(3, "0")}`,
      station_id: station.station_id,
      charging_type: pileIndex % 3 === 0 ? "0" : "1",
      charging_power: pileIndex % 3 === 0 ? 7 : pileIndex % 2 === 0 ? 60 : 120,
      connector_type: "国标 2015",
      location_desc: `${(pileIndex % 4) + 1}号停车区`,
      maintenance_needed: (stationIndex + pileIndex) % 17 === 0 ? 1 : 0,
      created_at: "2024-01-01T08:00:00Z",
      updated_at: "2025-06-01T08:00:00Z",
    }))
  );

state.piles = makeInitialPiles();

let interceptorId;

const parseBody = (data) => {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  if (typeof FormData !== "undefined" && data instanceof FormData) return {};
  return data;
};

const getRequestContext = (config) => {
  const rawUrl = config.url || "/";
  const url = new URL(rawUrl, window.location.origin);
  const params = new URLSearchParams(url.search);

  Object.entries(config.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.set(key, String(value));
  });

  const path = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
  return {
    path,
    params,
    method: (config.method || "get").toLowerCase(),
    body: parseBody(config.data),
  };
};

const paginate = (items, params) => {
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.max(1, Number(params.get("pageSize") || params.get("page_size")) || 10);
  const offset = (page - 1) * pageSize;
  return items.slice(offset, offset + pageSize);
};

const sortAndSearch = (items, params, searchFields) => {
  const search = (params.get("search") || "").trim().toLowerCase();
  const sortField = params.get("sortField") || "created_at";
  const sortOrder = (params.get("sortOrder") || "DESC").toUpperCase();
  const filtered = search
    ? items.filter((item) =>
        searchFields.some((field) =>
          String(item[field] ?? "").toLowerCase().includes(search)
        )
      )
    : [...items];

  filtered.sort((a, b) => {
    const left = a[sortField] ?? "";
    const right = b[sortField] ?? "";
    const comparison =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), "zh-CN", { numeric: true });
    return sortOrder === "ASC" ? comparison : -comparison;
  });

  return filtered;
};

const getDistrictSummaries = () =>
  districtCatalog.map((district) => {
    const stations = state.stations.filter(
      (station) => String(station.adcode) === String(district.adcode)
    );
    const pileCount = stations.reduce(
      (sum, station) => sum + Number(station.pile_count || 0),
      0
    );
    return {
      ...district,
      station_count: stations.length,
      pile_count: pileCount,
      total_piles: pileCount,
    };
  });

const round = (value, digits = 3) => Number(value.toFixed(digits));

const getStartDate = (params) => {
  const parsed = new Date(params.get("start") || "2022-09-01T00:00:00Z");
  return Number.isNaN(parsed.getTime())
    ? new Date("2022-09-01T00:00:00Z")
    : parsed;
};

const makeHourlySeries = (params, mapper, length = 24) => {
  const start = getStartDate(params);
  return Array.from({ length }, (_, index) => {
    const time = new Date(start.getTime() + index * 60 * 60 * 1000);
    return { time: time.toISOString(), ...mapper(index, time) };
  });
};

const getRealtimeVolume = (params) =>
  makeHourlySeries(params, (index) => ({
    value: Math.round(
      42000 + 14500 * Math.sin(((index - 6) / 24) * Math.PI * 2) + index * 420
    ),
  }));

const getRealtimeOccupancy = (params) => {
  const totalPiles = state.stations.reduce(
    (sum, station) => sum + Number(station.pile_count || 0),
    0
  );
  return makeHourlySeries(params, (index) => ({
    value: Math.round(
      totalPiles * (0.42 + 0.18 * Math.sin(((index - 7) / 24) * Math.PI * 2))
    ),
  }));
};

const getRealtimePrice = (params) =>
  makeHourlySeries(params, (index) => ({
    service_price: round(0.38 + 0.04 * Math.cos((index / 24) * Math.PI * 2)),
    electric_price: round(index >= 8 && index <= 21 ? 0.86 : 0.49),
  }));

const getOccupancyRanking = (params) => {
  const hour = getStartDate(params).getUTCHours();
  const occupancy = state.stations
    .map((station, index) => ({
      station_id: station.station_id,
      occupancy_rate: round(0.3 + ((index * 17 + hour * 7) % 62) / 100, 2),
    }))
    .sort((a, b) => b.occupancy_rate - a.occupancy_rate)
    .slice(0, 50);
  return { occupancy };
};

const buildCommunity = (adcode) => {
  const stations = state.stations.filter(
    (station) => String(station.adcode) === String(adcode)
  ).slice(0, 40);
  if (stations.length === 0) return {};

  const edges = [];
  stations.forEach((station, index) => {
    if (index < stations.length - 1) {
      edges.push({
        source: station.station_id,
        target: stations[index + 1].station_id,
        weight: round(0.5 + index * 0.31),
      });
    }
    if (index < stations.length - 2 && index % 2 === 0) {
      edges.push({
        source: station.station_id,
        target: stations[index + 2].station_id,
        weight: round(1.1 + index * 0.22),
      });
    }
  });

  const degree = Object.fromEntries(stations.map((station) => [station.station_id, 0]));
  edges.forEach(({ source, target }) => {
    degree[source] += 1;
    degree[target] += 1;
  });
  const divisor = Math.max(1, stations.length - 1);
  const degreeCentrality = Object.fromEntries(
    Object.entries(degree).map(([key, value]) => [key, value / divisor])
  );

  return {
    [`${adcode}_demo`]: {
      stations,
      edges,
      metrics: {
        total_nodes: stations.length,
        total_edges: edges.length,
        network_density:
          stations.length > 1
            ? (2 * edges.length) / (stations.length * (stations.length - 1))
            : 0,
        clustering_coefficient: stations.length > 2 ? 0.4667 : 0,
        diameter: stations.length > 2 ? 3 : Math.max(0, stations.length - 1),
        degree,
        degree_centrality: degreeCentrality,
      },
    },
  };
};

const getChargingTimeData = (params) => {
  const start = getStartDate(params);
  const fields = (params.get("fields") || "volume").split(",").filter(Boolean);
  const stationSeed = Number(params.get("station_id")) || 1001;
  return Array.from({ length: 48 }, (_, index) => {
    const hour = index % 24;
    const wave = Math.sin(((hour - 6) / 24) * Math.PI * 2);
    const row = {
      time: new Date(start.getTime() + index * 60 * 60 * 1000).toISOString(),
      station_id: String(params.get("station_id") || "1001"),
    };
    fields.forEach((field) => {
      const values = {
        volume: round(95 + wave * 38 + (stationSeed % 13)),
        occupancy: Math.max(0, Math.round(8 + wave * 5 + (stationSeed % 4))),
        duration: round(1.2 + (hour % 6) * 0.18),
        e_price: round(hour >= 8 && hour <= 21 ? 0.86 : 0.49),
        s_price: round(0.36 + (hour % 4) * 0.02),
      };
      row[field] = values[field] ?? 0;
    });
    return row;
  });
};

const getAnalysisResult = () => {
  const start = new Date("2025-06-01T00:00:00Z");
  const times = Array.from({ length: 96 }, (_, index) =>
    new Date(start.getTime() + index * 60 * 60 * 1000).toISOString()
  );
  const volumes = times.map((_, index) =>
    round(92 + 36 * Math.sin(((index % 24) - 6) / 24 * Math.PI * 2) + (index % 5) * 2.4)
  );
  const predicted = volumes.map((value, index) => round(value * (0.97 + (index % 4) * 0.01)));
  const forecastTimes = Array.from({ length: 48 }, (_, index) =>
    new Date(start.getTime() + (96 + index) * 60 * 60 * 1000).toISOString()
  );
  const yhat = forecastTimes.map((_, index) =>
    round(96 + 34 * Math.sin(((index % 24) - 6) / 24 * Math.PI * 2))
  );

  return {
    stats: { mean: 94.8, max: 133.2, min: 55.7 },
    report:
      "【演示分析报告】\n本结果由固定样例数据生成，仅用于展示交互流程。样例呈现明显的日内峰谷特征，午后至晚间用电量相对较高。实际业务判断应基于完整数据、异常值检查与模型验证。\n\n",
    raw_data: { time: times, volume: volumes },
    clusters_data: [
      { percentage: 42.5, description: "工作日通勤型（主要时间段：8:00-11:00）" },
      { percentage: 35.0, description: "午后补能型（主要时间段：13:00-17:00）" },
      { percentage: 22.5, description: "夜间驻留型（主要时间段：20:00-23:00）" },
    ],
    hourly_mean: Object.fromEntries(
      Array.from({ length: 24 }, (_, hour) => [
        hour,
        round(92 + 36 * Math.sin(((hour - 6) / 24) * Math.PI * 2)),
      ])
    ),
    forecast: {
      times: forecastTimes,
      yhat,
      yhat_lower: yhat.map((value) => round(value * 0.88)),
      yhat_upper: yhat.map((value) => round(value * 1.12)),
      changepoints: [times[24], times[48], times[72]],
    },
    metrics: {
      mae: 4.82,
      rmse: 6.17,
      test_data: {
        timestamps: times.slice(-24),
        y_true: volumes.slice(-24),
        y_pred: predicted.slice(-24),
      },
    },
  };
};

const updateStationPileCount = (stationId) => {
  const station = state.stations.find(
    (item) => String(item.station_id) === String(stationId)
  );
  if (station) {
    station.pile_count = state.piles.filter(
      (pile) => String(pile.station_id) === String(stationId)
    ).length;
  }
};

const nextNumericId = (items, field, fallback) =>
  Math.max(fallback, ...items.map((item) => Number(item[field]) || 0)) + 1;

const handleDemoRequest = (config) => {
  const { path, params, method, body } = getRequestContext(config);

  if (path === "/api/users/login" && method === "post") {
    return { success: true, user_id: 9001, role: "admin", demo: true };
  }

  if (path === "/api/datapanel/stations" && method === "get") {
    return state.stations.filter((station) => Number(station.status) === 1);
  }
  if (path === "/api/datapanel/districts" && method === "get") {
    return getDistrictSummaries();
  }
  if (path === "/api/datapanel/realtime/volume" && method === "get") {
    return getRealtimeVolume(params);
  }
  if (path === "/api/datapanel/realtime/occupancy" && method === "get") {
    return getRealtimeOccupancy(params);
  }
  if (path === "/api/datapanel/realtime/price" && method === "get") {
    return getRealtimePrice(params);
  }
  if (path === "/api/datapanel/realtime/occupancy_ranking" && method === "get") {
    return getOccupancyRanking(params);
  }

  if (path === "/api/locations" && method === "get") {
    return state.stations.filter((station) => Number(station.status) === 1);
  }
  if (path === "/api/locations/districts" && method === "get") {
    return getDistrictSummaries();
  }
  if (path.startsWith("/api/locations/community/") && method === "get") {
    return buildCommunity(decodeURIComponent(path.split("/").pop()));
  }

  if (path === "/api/districts" && method === "get") {
    return getDistrictSummaries();
  }

  if (path === "/api/stations" && method === "get") {
    const items = sortAndSearch(state.stations, params, ["station_id", "address"]);
    return { success: true, data: { items: paginate(items, params), total: items.length } };
  }
  if (path === "/api/stations" && method === "post") {
    const station = {
      ...body,
      station_id: String(body.station_id || nextNumericId(state.stations, "station_id", 3000)),
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      pile_count: Number(body.pile_count) || 0,
      has_parking_fee: Number(body.has_parking_fee) || 0,
      status: Number(body.status) || 1,
      created_at: "2025-06-21T08:00:00Z",
      updated_at: "2025-06-21T08:00:00Z",
    };
    state.stations.push(station);
    return { success: true, message: "Demo station added." };
  }
  if (path === "/api/stations/delete_batch" && method === "post") {
    const stationIds = (body.station_ids || []).map(String);
    state.stations = state.stations.filter(
      (station) => !stationIds.includes(String(station.station_id))
    );
    state.piles = state.piles.filter(
      (pile) => !stationIds.includes(String(pile.station_id))
    );
    return { success: true, message: "Demo stations deleted." };
  }
  if (path === "/api/stations/upload" && method === "post") {
    return { success: true, message: "演示模式不持久化上传文件。" };
  }
  if (path === "/api/stations/download" && method === "post") {
    return typeof Blob === "undefined"
      ? "station_id,address\n"
      : new Blob(["station_id,address\n"], { type: "text/csv;charset=utf-8" });
  }
  const stationMatch = path.match(/^\/api\/stations\/([^/]+)$/);
  if (stationMatch && method === "put") {
    const station = state.stations.find(
      (item) => String(item.station_id) === decodeURIComponent(stationMatch[1])
    );
    if (station) Object.assign(station, body, { updated_at: "2025-06-21T08:00:00Z" });
    return { success: Boolean(station), message: station ? "Demo station updated." : "Station not found." };
  }
  if (stationMatch && method === "delete") {
    const stationId = decodeURIComponent(stationMatch[1]);
    state.stations = state.stations.filter(
      (station) => String(station.station_id) !== stationId
    );
    state.piles = state.piles.filter((pile) => String(pile.station_id) !== stationId);
    return { success: true, message: "Demo station deleted." };
  }

  if (path === "/api/piles/districts" && method === "get") {
    return {
      success: true,
      data: getDistrictSummaries().map(({ adcode, district_name }) => ({ adcode, district_name })),
    };
  }
  if (path === "/api/piles/stations" && method === "get") {
    const adcode = params.get("adcode");
    return {
      success: true,
      data: state.stations
        .filter((station) => String(station.adcode) === String(adcode))
        .map(({ station_id, address, pile_count }) => ({ station_id, address, pile_count })),
    };
  }
  if (path === "/api/piles/piles" && method === "get") {
    const stationId = params.get("station_id");
    return {
      success: true,
      data: state.piles.filter((pile) => String(pile.station_id) === String(stationId)),
    };
  }

  if ((path === "/api/charging_piles/add" || path === "/api/piles/add") && method === "post") {
    const pile = {
      ...body,
      pile_id: String(body.pile_id || `DEMO-${state.piles.length + 1}`),
      station_id: String(body.station_id),
      maintenance_needed: Number(body.maintenance_needed) || 0,
      created_at: "2025-06-21T08:00:00Z",
      updated_at: "2025-06-21T08:00:00Z",
    };
    state.piles.push(pile);
    updateStationPileCount(pile.station_id);
    return { success: true, message: "Demo pile added." };
  }
  const pileUpdateMatch = path.match(/^\/api\/(?:charging_piles|piles)\/update\/([^/]+)$/);
  if (pileUpdateMatch && method === "put") {
    const pileId = decodeURIComponent(pileUpdateMatch[1]);
    const pile = state.piles.find((item) => String(item.pile_id) === pileId);
    if (pile) Object.assign(pile, body, { updated_at: "2025-06-21T08:00:00Z" });
    return { success: Boolean(pile), message: pile ? "Demo pile updated." : "Pile not found." };
  }
  if (
    (path === "/api/charging_piles/delete_batch" || path === "/api/piles/delete_batch") &&
    method === "post"
  ) {
    const pileIds = (body.pile_ids || []).map(String);
    state.piles = state.piles.filter((pile) => !pileIds.includes(String(pile.pile_id)));
    updateStationPileCount(body.station_id);
    return { success: true, message: "Demo piles deleted." };
  }

  if (path === "/api/users" && method === "get") {
    const items = sortAndSearch(state.users, params, ["user_id", "username"]);
    return { success: true, data: { items: paginate(items, params), total: items.length } };
  }
  if (path === "/api/users" && method === "post") {
    state.users.push({
      user_id: nextNumericId(state.users, "user_id", 9000),
      username: body.username,
      role: body.role || "viewer",
      created_at: "2025-06-21T08:00:00Z",
      updated_at: "2025-06-21T08:00:00Z",
    });
    return { success: true, message: "Demo user added." };
  }
  const userMatch = path.match(/^\/api\/users\/(\d+)$/);
  if (userMatch && method === "put") {
    const user = state.users.find((item) => Number(item.user_id) === Number(userMatch[1]));
    if (user) Object.assign(user, { username: body.username, role: body.role, updated_at: "2025-06-21T08:00:00Z" });
    return { success: Boolean(user), message: user ? "Demo user updated." : "User not found." };
  }
  if (userMatch && method === "delete") {
    state.users = state.users.filter((item) => Number(item.user_id) !== Number(userMatch[1]));
    return { success: true, message: "Demo user deleted." };
  }

  if (path === "/api/ctdata" && method === "get") {
    return { success: true, data: getChargingTimeData(params) };
  }

  if (path === "/api/analysis" && method === "post") {
    return { analysis_result: getAnalysisResult() };
  }

  if (path === "/api/business/list" && method === "get") {
    return { data: state.businessItems.map((item) => ({ ...item })) };
  }
  const businessDeleteMatch = path.match(/^\/api\/business\/delete\/(\d+)$/);
  if (businessDeleteMatch && method === "delete") {
    state.businessItems = state.businessItems.filter(
      (item) => Number(item.id) !== Number(businessDeleteMatch[1])
    );
    return { message: "演示记录已删除" };
  }
  const businessReadMatch = path.match(/^\/api\/business\/mark_read\/(\d+)$/);
  if (businessReadMatch && method === "post") {
    const item = state.businessItems.find(
      (entry) => Number(entry.id) === Number(businessReadMatch[1])
    );
    if (item) item.is_read = true;
    return { message: "演示记录已设为已读" };
  }
  if (path === "/api/business/submit" && method === "post") {
    return { message: "演示提交成功（未写入服务器）" };
  }

  if (path === "/api/community/news" && method === "get") {
    return { success: true, data: demoNews };
  }
  if (path === "/api/community/comments" && method === "get") {
    const comments = state.comments.filter((comment) => comment.parent_id == null);
    return { success: true, data: paginate(comments, params) };
  }
  if (path === "/api/community/comments" && method === "post") {
    state.comments.unshift({
      comment_id: nextNumericId(state.comments, "comment_id", 0),
      user_id: Number(body.user_id) || 9001,
      username: "演示访客",
      content: body.content,
      likes: 0,
      liked: false,
      reply_count: 0,
      parent_id: body.parent_id || null,
      created_at: "2025-06-21T08:00:00Z",
    });
    return { success: true };
  }
  if (path === "/api/community/comments/hot" && method === "get") {
    return { data: [...state.comments].sort((a, b) => b.likes - a.likes) };
  }
  if (path === "/api/community/comments/my" && method === "get") {
    const userId = Number(params.get("user_id"));
    return { data: state.comments.filter((comment) => Number(comment.user_id) === userId) };
  }
  if (path === "/api/community/comments/replies" && method === "get") {
    const parentId = Number(params.get("parent_id"));
    return { success: true, data: state.comments.filter((comment) => Number(comment.parent_id) === parentId) };
  }
  if (path === "/api/community/comments/wordcloud" && method === "get") {
    // 1x1 PNG，占位以避免演示环境依赖 Python 词云生成服务。
    return {
      image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL+WQAAAABJRU5ErkJggg==",
      demo: true,
    };
  }
  const commentLikeMatch = path.match(/^\/api\/community\/comments\/like\/(\d+)$/);
  if (commentLikeMatch && method === "post") {
    const comment = state.comments.find(
      (item) => Number(item.comment_id) === Number(commentLikeMatch[1])
    );
    if (comment) {
      comment.liked = !comment.liked;
      comment.likes += comment.liked ? 1 : -1;
    }
    return { success: true, data: { likes: comment?.likes || 0, liked: comment?.liked || false } };
  }
  const commentDeleteMatch = path.match(/^\/api\/community\/comments\/(\d+)$/);
  if (commentDeleteMatch && method === "delete") {
    state.comments = state.comments.filter(
      (item) => Number(item.comment_id) !== Number(commentDeleteMatch[1])
    );
    return { message: "Deleted" };
  }
  if (path.startsWith("/api/community/comments/messages/") && method === "get") {
    return { success: true, data: [] };
  }

  return {
    success: false,
    demo: true,
    message: `演示模式暂未覆盖接口：${method.toUpperCase()} ${path}`,
  };
};

const demoAdapter = async (config) => {
  await new Promise((resolve) => window.setTimeout(resolve, 80));
  return {
    data: handleDemoRequest(config),
    status: 200,
    statusText: "OK (Demo)",
    headers: { "x-ev-station-demo": "true" },
    config,
    request: { demo: true },
  };
};

export const setupDemoApi = () => {
  if (interceptorId !== undefined) return interceptorId;

  interceptorId = axios.interceptors.request.use((config) => {
    const url = config.url || "";
    if (!isDemoMode() || !(url.startsWith("/api") || url.startsWith("api/"))) return config;
    return { ...config, adapter: demoAdapter };
  });

  return interceptorId;
};

export const getDemoStateForTests = () => state;

export const requestDemoForTests = (config) => handleDemoRequest(config);
