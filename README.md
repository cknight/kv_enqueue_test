# KV Enqueue Example

This project is in support of a
[request for feedback](https://discord.com/channels/684898665143206084/1149351471851257986/1149355026158977048)
on the new Deno KV queue APIs.

Associated web application: https://kv-enqueue-example.deno.dev/

## Overview

This project is a [Fresh](https://fresh.deno.dev/) application. On server startup it
sets up an enqueued message to fetch the last hour's particulate air pollution
levels (pm2.5 and pm10) in London. This data is added to previously retrieved
data and the last 7 days worth is retained. Once the last hour's data is
retrieved, it schedules another job for an hour later to do the same again,
creating an hourly recurring job.  As per the API, an isolate will be spun up on Deploy
if none are running to handle the job execution.

All logic around the new queue APIs can be found in the [main.ts](https://github.com/cknight/kv_enqueue_test/blob/main/main.ts) file.

## Data

Data is retrieved from the [Open Weather Map](https://openweathermap.org) APIs.
While the air pollution API supports retrieving the last 7 days data, this
project arbitrarily just gets the last hour's values for demonstration purposes.

## View data

In addition to collecting the data, it is also charted on Deploy along with
stats around the accuracy of the last message delivered and when the next
message is due to be delivered. You can see this by visiting: https://kv-enqueue-example.deno.dev/

## KV Queue Feedback

This was an interesting exercise to work with the new queue API. Here are some
thoughts:

- **No ability to see what's queued** - During development I often accidentally
  queued multiple repeating jobs when I only ever want a single one, but it's
  hard to know when I've done this.
- **No queue management** - I can't clear the queue or delete individual queued
  items from it. A 'shadow' queue could be used by keeping track of items on KV
  and handling management through that (e.g. ignoring messages delivered in
  `listenQueue` if they are missing from the 'shadow' queue), but this seems
  clunky (and prone to mistake) when KV must already have this info.
- **Recurring queue setup is fiddly and potentially brittle** - For example, if
  the external API I'm calling within `listenQueue` is down, and KV exhausts
  retry attempts to deliver the message, the job will not be rescheduled as my
  code schedules the next one only after successful processing of a message. A
  recurring job API would be nice and abstract the complexity away from the
  user.
- **Docs need significant improvements** - While the basic functionality is well
  described, there's a lot of nuance missing. Documentation on basic usage
  patterns would be good too as would a thorough description of message
  delivery, how and when retries happen, max number of retries, retries backoff
  (if that exists), etc.
- **Concerns around server downtime** - If your server isn't running when a
  message is due to be delivered, the message is delivered the next time it is
  up and running with your `listenQueue` registered. I can imagine a scenario
  where you have many missed messages and they flood the `listenQueue`
  implementation all at once. If Deploy were down for a period, this could
  impact bringing Deploy back up and online for example, or flood services in
  use by the message deliveries.
- **Strong primitives** - Despite some challenges and concerns detailed above,
  on the positive side I'm really impressed with the primitives I have to work
  with. Combining queue's with KV atomic operations gives a strong foundation
  for a serverless environment. Atomic operations really open up a lot of
  possibilities for safe execution of code.
- **Simple API** - Though the recurring job was challenging to setup in a robust
  manner, the `enqueue` and `listenQueue` APIs were simple and straightforward.
  So far they seem to do what is advertised on the tin.
