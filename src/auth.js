import { google } from "googleapis";
import { createServer } from "http";
import { writeFileSync } from "fs";
import { URL } from "url";
import { loadConfig } from "./config.js";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
];

function createOAuth2Client(cfg) {
  return new google.auth.OAuth2(
    cfg.gmail.clientId,
    cfg.gmail.clientSecret,
    cfg.gmail.redirectUri,
  );
}

async function authenticate() {
  const cfg = loadConfig();
  const oauth2Client = createOAuth2Client(cfg);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("\n📧 Gmail Authentication Required");
  console.log("================================");
  console.log("\nOpen this URL in your browser:\n");
  console.log(authUrl);
  console.log("\nWaiting for authorization...\n");

  const code = await waitForAuthCode(cfg.gmail.redirectUri);

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  writeFileSync(cfg.paths.token, JSON.stringify(tokens, null, 2));
  console.log("✅ Authentication successful! Token saved.\n");

  return oauth2Client;
}

function waitForAuthCode(redirectUri) {
  return new Promise((resolve, reject) => {
    const url = new URL(redirectUri);
    const port = url.port || 3000;

    const server = createServer((req, res) => {
      const reqUrl = new URL(req.url, `http://localhost:${port}`);
      const code = reqUrl.searchParams.get("code");
      const error = reqUrl.searchParams.get("error");

      if (error) {
        res.end("Authorization denied. You can close this tab.");
        server.close();
        reject(new Error(`Auth denied: ${error}`));
        return;
      }

      if (code) {
        res.end("✅ Authorization successful! You can close this tab and return to the terminal.");
        server.close();
        resolve(code);
      } else {
        res.end("Waiting for authorization...");
      }
    });

    server.listen(port, () => {
      console.log(`Auth callback server listening on port ${port}`);
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Authentication timed out after 5 minutes"));
    }, 300_000);
  });
}

function getAuthenticatedClient(cfg, token) {
  const oauth2Client = createOAuth2Client(cfg);
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

export { authenticate, getAuthenticatedClient, SCOPES };
