/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import {
  LAST_MESSAGE_DELIVERY_KEY,
  NEXT_UPDATE_KEY,
} from "./types.ts";
import { fetchData } from "./utils/dataFetcher.ts";
import { timeWithMs } from "./utils/dateFormat.ts";

console.log("Starting main...");

const kv = await Deno.openKv();

Deno.cron("Fetch data", "0 * * * *", async () => {
  const expectedTime = new Date();
  expectedTime.setMinutes(0, 0, 0);
  
  console.log(
    `Cron trigger: time diff of ${Date.now() - expectedTime.getTime()}ms`,
  );

  await kv.set(
    LAST_MESSAGE_DELIVERY_KEY,
    `Cron delivery time of ${timeWithMs(expectedTime.getTime())}, message received at ${
      timeWithMs(Date.now())
    }, diff of ${Date.now() - expectedTime.getTime()}ms`,
  );

  await fetchData();

  expectedTime.setHours(expectedTime.getHours() + 1);
  await kv.atomic()
  .set(NEXT_UPDATE_KEY, expectedTime.getTime()) // set next update time (for UI display purposes only)
  .commit();
});

await start(manifest, config);
