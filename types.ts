export interface AirPollutionEntry {
  dt: number;
  main: {
    aqi: number;
  };
  components: {
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
  };
}

export interface AirPollutionResponse {
  coord: number[];
  list: AirPollutionEntry[];
}

export const LONDON_LAT = 51.52551620;
export const LONDON_LON = 0.03521630;
const TOPIC = "airPollutionTopic";
export const DATA_KEY = [TOPIC, "airPollutionData"];
export const LAST_UPDATED_KEY = [TOPIC, "lastUpdated"];
export const NEXT_UPDATE_KEY = [TOPIC, "nextUpdate"];
export const LAST_MESSAGE_DELIVERY_KEY = [TOPIC, "lastMessageDelivery"];
export const DELIVERY_FAILED_KEY = [TOPIC, "deliveryFailed"];
export const LOCK_KEY = [TOPIC, "lock"];
export const ONE_HOUR_IN_MS = 60 * 60 * 1000;
