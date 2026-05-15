import dotenv from "dotenv";
import path from "path";
import { google } from "googleapis";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GA4_PROPERTY_ID } =
  process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !GA4_PROPERTY_ID) {
  console.error("Missing required environment variables in .env");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

const analyticsData = google.analyticsdata({ version: "v1beta", auth: oauth2Client });
const adsense = google.adsense({ version: "v2", auth: oauth2Client });

async function getYesterdayPinterestSessions(): Promise<number> {
  const response = await analyticsData.properties.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: {
        filter: {
          fieldName: "sessionSource",
          stringFilter: {
            matchType: "CONTAINS",
            value: "pinterest",
            caseSensitive: false,
          },
        },
      },
    },
  });

  let total = 0;
  for (const row of response.data.rows || []) {
    total += parseInt(row.metricValues?.[0]?.value || "0", 10);
  }
  return total;
}

async function getYesterdayAdSenseEarnings(): Promise<number> {
  const accountsResponse = await adsense.accounts.list();
  const accounts = accountsResponse.data.accounts || [];
  if (accounts.length === 0) {
    throw new Error("No AdSense accounts found.");
  }

  const accountName = accounts[0].name!;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const report = await adsense.accounts.reports.generate({
    account: accountName,
    "startDate.year": yesterday.getFullYear(),
    "startDate.month": yesterday.getMonth() + 1,
    "startDate.day": yesterday.getDate(),
    "endDate.year": yesterday.getFullYear(),
    "endDate.month": yesterday.getMonth() + 1,
    "endDate.day": yesterday.getDate(),
    metrics: ["ESTIMATED_EARNINGS"],
    reportingTimeZone: "ACCOUNT_TIME_ZONE",
  });

  const earnings = parseFloat(report.data.totals?.cells?.[0]?.value || "0");
  return earnings;
}

async function main() {
  const [pinterestSessions, adSenseEarnings] = await Promise.all([
    getYesterdayPinterestSessions(),
    getYesterdayAdSenseEarnings(),
  ]);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);

  console.log(`\n=== Pinterest ↔ AdSense Report (${dateStr}) ===\n`);
  console.log(`  Pinterest sessions:          ${pinterestSessions}`);
  console.log(`  AdSense estimated earnings:  $${adSenseEarnings.toFixed(2)}`);

  if (pinterestSessions > 0) {
    const revPer100 = (adSenseEarnings / pinterestSessions) * 100;
    console.log(`  Est. revenue per 100 sessions: $${revPer100.toFixed(2)}`);
  } else {
    console.log(`  Est. revenue per 100 sessions: N/A (no Pinterest sessions)`);
  }

  console.log();
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
