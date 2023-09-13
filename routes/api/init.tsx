import { Handlers } from "$fresh/server.ts";
import { DATA_KEY, LAST_UPDATED_KEY } from "../../types.ts";
import { fetchData } from "../../utils/dataFetcher.ts";

/**
 * This is an API end point to cheat and pre-populate 7 days data.
 */
export const handler: Handlers = {
  async GET(_req) {
    console.log("Initialising data");

    const kv = await Deno.openKv();
    await kv.delete(DATA_KEY);
    await kv.delete(LAST_UPDATED_KEY);

    // Pre-populate with data from 7 days ago
    const sevenDaysAgo = Math.floor(
      (Date.now() - (7 * 24 * 60 * 60 * 1000)) / 1000,
    );
    await fetchData(sevenDaysAgo);

    return new Response("Update job registered and data pre-populated.");
  },
};
