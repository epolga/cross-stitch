import { pinterestGet } from "../src/services/pinterestClient";

interface AdAnalyticsRow {
  DATE: string;
  SPEND_IN_MICRO_DOLLAR: string;
  IMPRESSION_1: string;
  CLICKTHROUGH_1: string;
  CTR: string;
  ECPC_IN_MICRO_DOLLAR: string;
  OUTBOUND_CLICK_1: string;
}

function yesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function main() {
  const adAccountId = process.env.PINTEREST_AD_ACCOUNT_ID;
  if (!adAccountId) {
    throw new Error("Missing PINTEREST_AD_ACCOUNT_ID");
  }

  const date = yesterdayDate();
  const columns = [
    "SPEND_IN_MICRO_DOLLAR",
    "IMPRESSION_1",
    "CLICKTHROUGH_1",
    "CTR",
    "ECPC_IN_MICRO_DOLLAR",
    "OUTBOUND_CLICK_1",
  ].join(",");

  const rows = await pinterestGet<AdAnalyticsRow[]>(
    `/ad_accounts/${encodeURIComponent(adAccountId)}/analytics?start_date=${date}&end_date=${date}&columns=${columns}&granularity=DAY`
  );

  if (!rows.length) {
    console.log(`No ad data for ${date}`);
    return;
  }

  const row = rows[0];
  const spend = parseInt(row.SPEND_IN_MICRO_DOLLAR || "0", 10) / 1_000_000;
  const impressions = parseInt(row.IMPRESSION_1 || "0", 10);
  const clicks = parseInt(row.CLICKTHROUGH_1 || "0", 10);
  const ctr = parseFloat(row.CTR || "0");
  const cpc = parseInt(row.ECPC_IN_MICRO_DOLLAR || "0", 10) / 1_000_000;
  const outboundClicks = parseInt(row.OUTBOUND_CLICK_1 || "0", 10);

  console.log(`\n=== Pinterest Ad Report (${date}) ===\n`);
  console.log(`  Spend:           $${spend.toFixed(2)}`);
  console.log(`  Impressions:     ${impressions}`);
  console.log(`  Clicks:          ${clicks}`);
  console.log(`  CTR:             ${(ctr * 100).toFixed(2)}%`);
  console.log(`  CPC:             $${cpc.toFixed(2)}`);
  console.log(`  Outbound clicks: ${outboundClicks}`);
  console.log();
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
