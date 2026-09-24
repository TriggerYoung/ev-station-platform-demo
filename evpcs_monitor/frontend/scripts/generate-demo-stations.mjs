import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const networkDataDirectory = resolve(
  scriptDirectory,
  "../../backend/network_data"
);
const outputPath = resolve(
  scriptDirectory,
  "../src/demo/demoStations.generated.json"
);

const sourceFiles = (await readdir(networkDataDirectory))
  .filter((fileName) => fileName.endsWith("_community.json"))
  .sort();

const stationsById = new Map();

for (const fileName of sourceFiles) {
  const contents = await readFile(resolve(networkDataDirectory, fileName), "utf8");
  const communities = JSON.parse(contents);

  for (const community of Object.values(communities)) {
    for (const station of community.stations || []) {
      const stationId = String(station.station_id);
      if (!stationId || stationsById.has(stationId)) continue;

      stationsById.set(stationId, {
        station_id: stationId,
        latitude: Number(station.latitude),
        longitude: Number(station.longitude),
        address: station.address,
        adcode: String(station.adcode),
        pile_count: Number(station.pile_count) || 0,
      });
    }
  }
}

const stations = [...stationsById.values()].sort(
  (left, right) =>
    left.adcode.localeCompare(right.adcode) ||
    left.station_id.localeCompare(right.station_id, "zh-CN", { numeric: true })
);
const pileCount = stations.reduce(
  (total, station) => total + station.pile_count,
  0
);

await writeFile(outputPath, `${JSON.stringify(stations, null, 2)}\n`, "utf8");

console.log(
  `Generated ${stations.length} demo stations (${pileCount} piles) from ${sourceFiles.length} network snapshots.`
);
