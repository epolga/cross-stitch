import dotenv from "dotenv";
import fs from "fs";
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

interface PinterestSessions {
  paidSocial: number;
  organic: number;
  referral: number;
  total: number;
}

interface DailyGoogleReport {
  date: string;
  pinterest: PinterestSessions;
  adsense: {
    estimatedEarnings: number;
  };
  derived: {
    revenuePerHundredPinterestSessions: number | null;
  };
}

function yesterdayDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function getPinterestSessions(): Promise<PinterestSessions> {
  const response = await analyticsData.properties.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
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

  let paidSocial = 0;
  let organic = 0;
  let referral = 0;

  for (const row of response.data.rows || []) {
    const medium = (row.dimensionValues?.[1]?.value || "").toLowerCase();
    const sessions = parseInt(row.metricValues?.[0]?.value || "0", 10);

    if (medium === "paidsocial") {
      paidSocial += sessions;
    } else if (medium === "organic") {
      organic += sessions;
    } else if (medium === "referral") {
      referral += sessions;
    }
  }

  return {
    paidSocial,
    organic,
    referral,
    total: paidSocial + organic + referral,
  };
}

async function getAdSenseEarnings(): Promise<number> {
  const accountsResponse = await adsense.accounts.list();
  const accounts = accountsResponse.data.accounts || [];
  if (accounts.length === 0) {
    throw new Error("No AdSense accounts found.");
  }

  const accountName = accounts[0].name!;
  const yesterday = yesterdayDate();

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

  return parseFloat(report.data.totals?.cells?.[0]?.value || "0");
}

async function main() {
  const [pinterest, earnings] = await Promise.all([
    getPinterestSessions(),
    getAdSenseEarnings(),
  ]);

  const dateStr = formatDate(yesterdayDate());

  const revPer100 =
    pinterest.total > 0
      ? Math.round(((earnings / pinterest.total) * 100) * 100) / 100
      : null;

  const report: DailyGoogleReport = {
    date: dateStr,
    pinterest,
    adsense: { estimatedEarnings: earnings },
    derived: { revenuePerHundredPinterestSessions: revPer100 },
  };

  // Print report
  console.log(`\n=== Daily Google Report (${dateStr}) ===\n`);
  console.log(`  Pinterest PaidSocial sessions:  ${pinterest.paidSocial}`);
  console.log(`  Pinterest organic sessions:     ${pinterest.organic}`);
  console.log(`  Pinterest referral sessions:    ${pinterest.referral}`);
  console.log(`  Total Pinterest sessions:       ${pinterest.total}`);
  console.log(`  AdSense estimated earnings:     $${earnings.toFixed(2)}`);
  console.log(
    `  Est. revenue / 100 sessions:   ${revPer100 !== null ? `$${revPer100.toFixed(2)}` : "N/A"}`
  );
  console.log();

  // Save JSON report
  const reportsDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, `${dateStr}-google-report.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`  Saved → ${reportPath}\n`);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
