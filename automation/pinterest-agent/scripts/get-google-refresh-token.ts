import fs from "fs";
import path from "path";
import http from "http";
import { URL } from "url";
import open from "open";
import { google } from "googleapis";

const credentialsPath = path.join(process.cwd(), "google-oauth-client.json");
const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));

const { client_id, client_secret } = credentials.installed;

const REDIRECT_URI = "http://127.0.0.1:5173";

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  REDIRECT_URI
);

const scopes = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/adsense.readonly",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: scopes,
});

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) return;

    const requestUrl = new URL(req.url, "http://127.0.0.1:5173");
    const code = requestUrl.searchParams.get("code");

    if (!code) {
      res.end("No code received.");
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);

    console.log("\nSAVE THIS REFRESH TOKEN:\n");
    console.log(tokens.refresh_token);

    res.end("Authentication successful. You may close this tab.");
    server.close();
  } catch (error) {
    console.error(error);
    res.end("Authentication failed. Check terminal.");
    server.close();
  }
});

server.listen(5173, async () => {
  console.log("Opening Google login...");
  await open(authUrl);
});
