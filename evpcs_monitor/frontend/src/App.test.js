jest.mock("axios", () => ({
  __esModule: true,
  default: {
    interceptors: {
      request: {
        use: jest.fn(() => 0),
      },
    },
  },
}));

import { demoStations } from "./demo/demoData";
import { requestDemoForTests } from "./demo/demoApi";

test("demo fixture keeps the repository snapshot totals", () => {
  expect(demoStations).toHaveLength(1543);
  expect(
    demoStations.reduce((total, station) => total + station.pile_count, 0)
  ).toBe(20945);
});

test("demo adapter serves the core data-panel endpoints", () => {
  const stations = requestDemoForTests({
    url: "/api/datapanel/stations",
    method: "get",
  });
  const districts = requestDemoForTests({
    url: "/api/datapanel/districts",
    method: "get",
  });
  const volume = requestDemoForTests({
    url: "/api/datapanel/realtime/volume",
    method: "get",
  });

  expect(stations).toHaveLength(1543);
  expect(districts).toHaveLength(9);
  expect(volume).toHaveLength(24);
});

test("demo adapter returns a deterministic analysis report", () => {
  const response = requestDemoForTests({ url: "/api/analysis", method: "post" });
  expect(response.analysis_result.forecast.yhat).toHaveLength(48);
  expect(response.analysis_result.report).toContain("演示分析报告");
});
