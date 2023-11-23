# KV Enqueue Example

This project is in support of a
[request for feedback](https://discord.com/channels/684898665143206084/1174052112536195102/1174056992470474803)
on the new Deno cron API.  It has been reworked from a previous RFC for KV queues

Associated web application: https://kv-enqueue-example.deno.dev/

## Overview

This project is a [Fresh](https://fresh.deno.dev/) application. On server startup it
registers an hourly cron job to fetch the last hour's particulate air pollution
levels (pm2.5 and pm10) in London. This data is added to previously retrieved
data and the last 7 days worth is retained. 

All logic around the new queue APIs can be found in the [main.ts](https://github.com/cknight/kv_enqueue_test/blob/main/main.ts) file.

## Data

Data is retrieved from the [Open Weather Map](https://openweathermap.org) APIs.
While the air pollution API supports retrieving the last 7 days data, this
project arbitrarily just gets the last hour's values for demonstration purposes.

## View data

In addition to collecting the data, it is also charted on Deploy along with
stats around the accuracy of the last message delivered and when the next
message is due to be delivered. You can see this by visiting: https://kv-enqueue-example.deno.dev/

