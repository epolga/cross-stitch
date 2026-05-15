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

async function getYesterdayPinterestSessions() {
  const response = await analyticsData.properties.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
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

  const rows = response.data.rows || [];

  if (rows.length === 0) {
    console.log("No Pinterest sessions found yesterday.");
    return;
  }

  console.log("Yesterday's Pinterest sessions:\n");
  for (const row of rows) {
    const source = row.dimensionValues?.[0]?.value;
    const medium = row.dimensionValues?.[1]?.value;
    const sessions = row.metricValues?.[0]?.value;
    const users = row.metricValues?.[1]?.value;
    console.log(`  Source: ${source} / ${medium}  →  Sessions: ${sessions}, Users: ${users}`);
  }
}

getYesterdayPinterestSessions().catch((err) => {
  console.error("Error fetching GA4 data:", err.message || err);
  process.exit(1);
});
