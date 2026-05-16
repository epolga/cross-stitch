import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { pinterestGet } from "../src/services/pinterestClient";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GA4_PROPERTY_ID, PINTEREST_AD_ACCOUNT_ID } =
  process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !GA4_PROPERTY_ID) {
  console.error("Missing required Google environment variables in .env");
  process.exit(1);
}

if (!PINTEREST_AD_ACCOUNT_ID) {
  console.error("Missing PINTEREST_AD_ACCOUNT_ID in .env");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

const analyticsData = google.analyticsdata({ version: "v1beta", auth: oauth2Client });
const adsense = google.adsense({ version: "v2", auth: oauth2Client });

// ── Types ──

interface PinterestAdMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  outboundClicks: number;
}

interface GA4PinterestSessions {
  paidSocial: number;
  organic: number;
  referral: number;
  total: number;
}

interface BusinessReport {
  date: string;
  pinterestAds: PinterestAdMetrics;
  ga4PinterestSessions: GA4PinterestSessions;
  adsense: { estimatedEarnings: number };
  derived: {
    revenuePerHundredPinterestSessions: number | null;
    roughProfitEstimate: number;
  };
}

// ── Helpers ──

function yesterdayDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Pinterest Ads ──

interface AdAnalyticsRow {
  SPEND_IN_MICRO_DOLLAR: string;
  IMPRESSION_1: string;
  CLICKTHROUGH_1: string;
  CTR: string;
  ECPC_IN_MICRO_DOLLAR: string;
  OUTBOUND_CLICK_1: string;
}

async function getPinterestAdMetrics(dateStr: string): Promise<PinterestAdMetrics> {
  const columns = [
    "SPEND_IN_MICRO_DOLLAR",
    "IMPRESSION_1",
    "CLICKTHROUGH_1",
    "CTR",
    "ECPC_IN_MICRO_DOLLAR",
    "OUTBOUND_CLICK_1",
  ].join(",");

  const rows = await pinterestGet<AdAnalyticsRow[]>(
    `/ad_accounts/${encodeURIComponent(PINTEREST_AD_ACCOUNT_ID!)}/analytics?start_date=${dateStr}&end_date=${dateStr}&columns=${columns}&granularity=DAY`
  );

  if (!rows.length) {
    return { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, outboundClicks: 0 };
  }

  const row = rows[0];
  return {
    spend: parseInt(row.SPEND_IN_MICRO_DOLLAR || "0", 10) / 1_000_000,
    impressions: parseInt(row.IMPRESSION_1 || "0", 10),
    clicks: parseInt(row.CLICKTHROUGH_1 || "0", 10),
    ctr: parseFloat(row.CTR || "0"),
    cpc: parseInt(row.ECPC_IN_MICRO_DOLLAR || "0", 10) / 1_000_000,
    outboundClicks: parseInt(row.OUTBOUND_CLICK_1 || "0", 10),
  };
}

// ── GA4 Pinterest Sessions ──

async function getGA4PinterestSessions(): Promise<GA4PinterestSessions> {
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

    if (medium === "paidsocial") paidSocial += sessions;
    else if (medium === "organic") organic += sessions;
    else if (medium === "referral") referral += sessions;
  }

  return { paidSocial, organic, referral, total: paidSocial + organic + referral };
}

// ── AdSense ──

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

// ── Main ──

async function main() {
  const dateStr = formatDate(yesterdayDate());

  const [pinterestAds, ga4Sessions, adsenseEarnings] = await Promise.all([
    getPinterestAdMetrics(dateStr),
    getGA4PinterestSessions(),
    getAdSenseEarnings(),
  ]);

  const revPer100 =
    ga4Sessions.total > 0
      ? Math.round(((adsenseEarnings / ga4Sessions.total) * 100) * 100) / 100
      : null;

  const roughProfit = Math.round((adsenseEarnings - pinterestAds.spend) * 100) / 100;

  const report: BusinessReport = {
    date: dateStr,
    pinterestAds,
    ga4PinterestSessions: ga4Sessions,
    adsense: { estimatedEarnings: adsenseEarnings },
    derived: {
      revenuePerHundredPinterestSessions: revPer100,
      roughProfitEstimate: roughProfit,
    },
  };

  // Print report
  console.log(`\n=== Daily Business Report (${dateStr}) ===\n`);
  console.log(`  Pinterest spend:              $${pinterestAds.spend.toFixed(2)}`);
  console.log(`  Pinterest clicks:             ${pinterestAds.clicks}`);
  console.log(`  Pinterest outbound clicks:    ${pinterestAds.outboundClicks}`);
  console.log(`  GA4 Pinterest sessions:       ${ga4Sessions.total} (paid: ${ga4Sessions.paidSocial}, organic: ${ga4Sessions.organic}, referral: ${ga4Sessions.referral})`);
  console.log(`  AdSense estimated earnings:   $${adsenseEarnings.toFixed(2)}`);
  console.log(`  Est. revenue / 100 sessions:  ${revPer100 !== null ? `$${revPer100.toFixed(2)}` : "N/A"}`);
  console.log(`  Rough profit estimate:        $${roughProfit.toFixed(2)}`);
  console.log();

  // Save JSON report
  const reportsDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, `${dateStr}-business-report.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`  Saved → ${reportPath}\n`);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
