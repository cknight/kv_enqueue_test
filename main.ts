/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import {
  DELIVERY_FAILED_KEY,
  LAST_MESSAGE_DELIVERY_KEY,
  LOCK_KEY,
  NEXT_UPDATE_KEY,
  ONE_HOUR_IN_MS,
} from "./types.ts";
import { fetchData } from "./utils/dataFetcher.ts";
import { timeWithMs } from "./utils/dateFormat.ts";

console.log("Starting main...");

const kv = await Deno.openKv();

async function enqueue(msg: number, delay: number): Promise<void> {
  const result = await kv.atomic()
    .enqueue(msg, {
      delay: delay,
      keysIfUndelivered: [DELIVERY_FAILED_KEY],
    }) // enqueue next recurring update
    .set(NEXT_UPDATE_KEY, msg) // set next update time (for UI display purposes only)
    .commit();

  if (result.ok) {
    console.log(
      `------- Enqueued message for: ${msg} (${
        new Date(msg).toUTCString()
      } (UTC))`,
    );
  } else {
    const nextDelivery = (await kv.get(NEXT_UPDATE_KEY)).value as number;
    console.log(
      `Failed to queue message for ${msg} (${new Date(msg).toUTCString()} (UTC)), next delivery time is ${nextDelivery} (${new Date(nextDelivery).toUTCString()} (UTC))`,
    );
  }
}

/**
 * msg is the unix timestamp of the expected delivery date/time of the message
 */
kv.listenQueue(async (msg: unknown) => {
  console.log(
    `Received message: ${msg} (${new Date(msg as number).toUTCString()})`,
  );

  const now = Date.now();
  const msgTime = Number(msg);

  // Set stats of delivery accuracy for UI display purposes
  await kv.set(
    LAST_MESSAGE_DELIVERY_KEY,
    `Enqueued delivery time of ${timeWithMs(msgTime)}, message received at ${
      timeWithMs(now)
    }, diff of ${now - msgTime}ms`,
  );

  // if this fails, then message may be redelivered
  await fetchData();

  // getting this far means the message was successfully delivered,
  // ready for enqueue of next message
  const oneHourFromNow = Date.now() + ONE_HOUR_IN_MS;
  await enqueue(oneHourFromNow, ONE_HOUR_IN_MS);
});

// Start recurring job if no other isolate has already started it before
const startRecurring = await kv.atomic().check({
  key: LOCK_KEY,
  versionstamp: null,
}).set(LOCK_KEY, true).commit();
if (startRecurring.ok) {
  console.log("Starting recurring job");
  await enqueue(Date.now(), 0);
}

// If there was a failed delivery, restart the recurring job
const failedKey = await kv.get(DELIVERY_FAILED_KEY);
if (failedKey.value) {
  const shouldRestart = await kv.atomic().check({
    key: DELIVERY_FAILED_KEY,
    versionstamp: failedKey.versionstamp,
  }).delete(DELIVERY_FAILED_KEY).commit();
  if (shouldRestart.ok) {
    console.log("Restarting recurring job after failed delivery");
    await enqueue(Date.now(), 0);
  }
}

console.log("Listening for messages...");

await start(manifest, config);
