import { AirPollutionEntry } from "../types.ts";
import { IS_BROWSER } from "$fresh/runtime.ts";
import Chart from "https://esm.sh/chart.js@4.2.1/auto";

interface ChartProps {
  data: AirPollutionEntry[];
  lastUpdated: string;
  lastDeliveryResult: string;
  nextScheduledDelivery: string;
}

export default function APChart(props: ChartProps) {
  if (IS_BROWSER) {
    const pm25dataSet: number[] = [];
    const pm10dataSet: number[] = [];
    const labels: string[] = [];

    for (const entry of props.data) {
      pm25dataSet.push(entry.components.pm2_5);
      pm10dataSet.push(entry.components.pm10);
      labels.push(new Date(entry.dt * 1000).toLocaleString());
    }

    const ctx = document.getElementById("myChart") as HTMLCanvasElement;
    // @ts-ignore
    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "pm-2.5",
          data: pm25dataSet,
          borderWidth: 1,
        }, {
          label: "pm-10",
          data: pm10dataSet,
          borderWidth: 1,
        }],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "Particulate Matter (PM) 2.5 and 10 in London",
          },
        },
        scales: {
          x: {
            ticks: {
              callback: function (val, index) {
                return index % 3 === 0 ? labels[index] : "";
              },
            },
          },
          y: {
            title: {
              display: true,
              text: "Concentration (μg/m3)",
            },
            min: 0,
          },
        },
      },
    });
  }

  return (
    <div class="">
      <canvas id="myChart"></canvas>
      <div>
        <h2 class="mt-12 text-2xl font-bold">Queue stats</h2>
        <div class="mt-5 inline-block shadow border-1 border-gray-400 rounded-lg overflow-hidden">
          <table class="table-auto">
            <tbody class="mt-3 divide-y divide-slate-800 dark:divide-[#656565]">
              <tr>
                <td class="px-5 py-4 text-sm font-medium whitespace-nowrap">
                  Data last fetched
                </td>
                <td class="px-5 py-4 text-sm whitespace-nowrap">
                  {props.lastUpdated}
                </td>
              </tr>
              <tr>
                <td class="px-5 py-4 text-sm font-medium whitespace-nowrap">
                  Last delivery result
                </td>
                <td class="px-5 py-4 text-sm whitespace-nowrap">
                  {props.lastDeliveryResult}
                </td>
              </tr>
              <tr>
                <td class="px-5 py-4 text-sm font-medium whitespace-nowrap">
                  Next scheduled delivery
                </td>
                <td class="px-5 py-4 text-sm whitespace-nowrap">
                  {props.nextScheduledDelivery}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
