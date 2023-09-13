import {
  AirPollutionEntry,
  AirPollutionResponse,
  DATA_KEY,
  LAST_UPDATED_KEY,
  LONDON_LAT,
  LONDON_LON,
  ONE_HOUR_IN_MS,
} from "../types.ts";

const HOURS_IN_7_DAYS = 168;

export async function fetchData(begin?: number) {
  const kv = await Deno.openKv();
  const oneHourAgo = Math.floor((Date.now() - ONE_HOUR_IN_MS) / 1000);
  const start = begin || oneHourAgo;
  const end = Math.floor((Date.now()) / 1000);
  const apiKey = Deno.env.get("OPEN_WEATHER_API_KEY");
  const url =
    `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${LONDON_LAT}&lon=${LONDON_LON}&start=${start}&end=${end}&appid=${apiKey}`;

  const resp = await fetch(url);

  if (resp.status !== 200) {
    console.log(`Failed to fetch data with status ${resp.status}`);
    throw new Error(`Failed to fetch data with status ${resp.status}`);
  }

  const airPollutionResponse = await resp.json() as AirPollutionResponse;
  const responseData: AirPollutionEntry[] = airPollutionResponse.list;

  const origData = await kv.get(DATA_KEY);

  if (origData.value) {
    const origDataArr = origData.value as AirPollutionEntry[];
    const existingDataTimestamps = new Set(origDataArr.map((d) => d.dt));
    const newData = responseData.filter((d) =>
      !existingDataTimestamps.has(d.dt)
    );

    // combine the new data with the existing data, and only keep the last 7 days
    const combinedData = origDataArr.concat(newData).slice(-HOURS_IN_7_DAYS);
    await kv.set(DATA_KEY, combinedData);
  } else {
    await kv.set(DATA_KEY, responseData);
  }
  await kv.set(LAST_UPDATED_KEY, Date.now());
}
