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
  if (true) {
    console.log("Temporarily disabling enqueueing of messages");
    return;
  }
  const result = await kv.atomic()
    .check({ key: LOCK_KEY, versionstamp: null }) //check no enqueue lock is present
    .enqueue(msg, {
      delay: delay,
      keysIfUndelivered: [DELIVERY_FAILED_KEY],
    }) // enqueue next recurring update
    .set(NEXT_UPDATE_KEY, msg) // set next update time (for UI display purposes only)
    .set(LOCK_KEY, true) // set lock to prevent multiple enqueues of this topic
    .commit();

  if (result.ok) {
    console.log(`Enqueued message for ${new Date(msg).toUTCString()} (UTC)`);
  } else {
    const nextDelivery = (await kv.get(NEXT_UPDATE_KEY)).value as number;
    console.log(
      `Lock present, a message is already enqueued, ignoring this one. Next delivery at ${
        new Date(nextDelivery).toUTCString()
      } (UTC)`,
    );
  }
}

/**
 * msg is the unix timestamp of the expected delivery date/time of the message
 */
kv.listenQueue(async (msg: unknown) => {
  console.log(`Received message: ${msg} (${new Date(msg as number).toUTCString()})`);

  await kv.delete(LOCK_KEY); // release lock

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

/**
 * This line covers two use cases:
 *
 * 1. First ever run with need to kick start the recurring job
 * 2. Re-start the job after failures have exhausted the retries
 *
 * If there is already an enqueued message, then this will be a no-op
 */
await enqueue(Date.now(), 0);

console.log("Listening for messages...");

await start(manifest, config);
