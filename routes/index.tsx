import APChart from "../islands/ap_chart.tsx";
import {
  AirPollutionEntry,
  DATA_KEY,
  LAST_MESSAGE_DELIVERY_KEY,
  LAST_UPDATED_KEY,
  NEXT_UPDATE_KEY,
  ONE_HOUR_IN_MS,
} from "../types.ts";

const kv = await Deno.openKv();
const data: AirPollutionEntry[] = [];
let lastUpdated = 0;

export default async function Home() {
  if (data.length === 0 || lastUpdated < Date.now() - ONE_HOUR_IN_MS) {
    const kvEntry = await kv.get(DATA_KEY);

    if (kvEntry.value) {
      data.push(...kvEntry.value as AirPollutionEntry[]);
    }
    lastUpdated = Date.now();
  }

  const dataLastUpdated = await kv.get(LAST_UPDATED_KEY);
  const lastDelivery = await kv.get(LAST_MESSAGE_DELIVERY_KEY);
  const nextDelivery = await kv.get(NEXT_UPDATE_KEY);

  const lastUpdatedString = dataLastUpdated.value
    ? new Date(dataLastUpdated.value as number).toLocaleString()
    : "-";
  const lastDeliveryResult = lastDelivery.value as string || "-";
  const nextScheduledDelivery = nextDelivery.value
    ? new Date(nextDelivery.value as number).toLocaleString()
    : "-";

  return (
    <div class="px-4 py-8 mx-auto">
      <div class="p-4 mx-auto max-w-screen-lg">
        <APChart
          data={data}
          lastUpdated={lastUpdatedString}
          lastDeliveryResult={lastDeliveryResult}
          nextScheduledDelivery={nextScheduledDelivery}
        />
      </div>
    </div>
  );
}
