import "dotenv/config";
import fs from "fs";
import path from "path";
import { formatDate, yesterdayDate } from "../src/services/dateUtils";
import { getPinAnalytics, type PinMetrics } from "../src/services/pinterestPinAnalytics";

interface DesignPinRecord {
  designId: number;
  albumId: number;
  albumCaption: string;
  pinId: string;
  designCaption: string;
  designUrl: string;
}

interface DesignPerformanceRecord extends DesignPinRecord, PinMetrics {
  error?: string;
}

const ZERO_METRICS: PinMetrics = {
  impressions: 0,
  clicks: 0,
  outboundClicks: 0,
  ctr: 0,
  saves: 0,
};

const WINDOW_DAYS = 30;
const CONCURRENCY = 3;

function daysBefore(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d;
}

async function processInBatches<T, U>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<U>
): Promise<U[]> {
  const out: U[] = new Array(items.length);
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(fn));
    for (let j = 0; j < results.length; j++) out[i + j] = results[j];
  }
  return out;
}

async function main() {
  const reportsDir = path.join(process.cwd(), "reports");
  const inputPath = path.join(reportsDir, "design-pin-map.json");

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    console.error(`Run "npm run pinmap" first.`);
    process.exit(1);
  }

  const designs: DesignPinRecord[] = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  console.log(`Loaded ${designs.length} design-pin records`);

  const endDate = yesterdayDate();
  const startDate = daysBefore(endDate, WINDOW_DAYS - 1);
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  console.log(`Fetching Pinterest metrics for window ${startStr} to ${endStr} (${WINDOW_DAYS}d)`);

  let done = 0;
  const enriched = await processInBatches(designs, CONCURRENCY, async (d) => {
    try {
      const metrics = await getPinAnalytics(d.pinId, startStr, endStr);
      done++;
      process.stdout.write(`  ${done}/${designs.length} fetched\r`);
      return { ...d, ...metrics } as DesignPerformanceRecord;
    } catch (err) {
      done++;
      process.stdout.write(`  ${done}/${designs.length} fetched\r`);
      return {
        ...d,
        ...ZERO_METRICS,
        error: err instanceof Error ? err.message : String(err),
      } as DesignPerformanceRecord;
    }
  });
  process.stdout.write("\n");

  const successCount = enriched.filter((r) => !r.error).length;
  const errorCount = enriched.length - successCount;
  console.log(`  ${successCount} succeeded, ${errorCount} failed`);

  const output = {
    generatedAt: new Date().toISOString(),
    window: { label: `${WINDOW_DAYS}d`, startDate: startStr, endDate: endStr },
    totalPins: designs.length,
    successCount,
    errorCount,
    designs: enriched,
  };

  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const outPath = path.join(reportsDir, "design-performance.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
  console.log(`Saved → ${outPath}`);
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
