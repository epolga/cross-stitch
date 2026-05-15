import dotenv from "dotenv";
import path from "path";
import { google } from "googleapis";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.error("Missing required environment variables in .env");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

const adsense = google.adsense({ version: "v2", auth: oauth2Client });

async function getYesterdayAdSenseRevenue() {
  // First, list accounts to get the account ID
  const accountsResponse = await adsense.accounts.list();
  const accounts = accountsResponse.data.accounts || [];

  if (accounts.length === 0) {
    console.error("No AdSense accounts found.");
    process.exit(1);
  }

  const accountName = accounts[0].name!;
  console.log(`AdSense account: ${accountName}\n`);

  // Generate a report for yesterday
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const dateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const report = await adsense.accounts.reports.generate({
    account: accountName,
    "startDate.year": yesterday.getFullYear(),
    "startDate.month": yesterday.getMonth() + 1,
    "startDate.day": yesterday.getDate(),
    "endDate.year": yesterday.getFullYear(),
    "endDate.month": yesterday.getMonth() + 1,
    "endDate.day": yesterday.getDate(),
    metrics: [
      "ESTIMATED_EARNINGS",
      "PAGE_VIEWS",
      "IMPRESSIONS",
      "CLICKS",
    ],
    reportingTimeZone: "ACCOUNT_TIME_ZONE",
  });

  const rows = report.data.rows || [];
  const totals = report.data.totals;

  console.log(`AdSense report for ${dateStr(yesterday)}:\n`);

  if (totals?.cells) {
    const earnings = totals.cells[0]?.value ?? "N/A";
    const pageViews = totals.cells[1]?.value ?? "N/A";
    const impressions = totals.cells[2]?.value ?? "N/A";
    const clicks = totals.cells[3]?.value ?? "N/A";

    console.log(`  Estimated Earnings: $${earnings}`);
    console.log(`  Page Views:         ${pageViews}`);
    console.log(`  Impressions:        ${impressions}`);
    console.log(`  Clicks:             ${clicks}`);
  } else {
    console.log("  No data available for yesterday.");
  }
}

getYesterdayAdSenseRevenue().catch((err) => {
  console.error("Error fetching AdSense data:", err.message || err);
  process.exit(1);
});
