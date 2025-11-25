// safe_downloader.js
// Generic safe URL downloader with onStart export for bot frameworks

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

// Blocked domains (explicit adult/DRM sites)
const BLOCKED_DOMAINS = [
  "xhamster.com",
  "www.xhamster.com",
  "xvideos.com",
  "www.xvideos.com",
  "pornhub.com",
  "www.pornhub.com"
];

function isBlocked(urlString) {
  try {
    const u = new URL(urlString);
    const hostname = u.hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(blocked => hostname === blocked || hostname.endsWith("." + blocked));
  } catch {
    return false;
  }
}

async function downloadFile(url, outputName) {
  if (!url) return { error: "No URL provided" };
  if (isBlocked(url)) return { error: "Domain blocked by safety policy" };

  let fileName = outputName;
  try { fileName = fileName || path.basename(new URL(url).pathname) || "download.file"; }
  catch { fileName = "download.file"; }

  try {
    const response = await axios({ method: "GET", url, responseType: "stream", timeout: 30000, maxRedirects: 5 });
    const type = response.headers["content-type"] || "";
    if (type.includes("text/html")) return { error: "URL is not a direct file (HTML page detected)" };

    return new Promise(resolve => {
      const writer = fs.createWriteStream(fileName);
      response.data.pipe(writer);
      writer.on("finish", () => resolve({ success: true, file: fileName }));
      writer.on("error", err => resolve({ error: err.message }));
    });
  } catch (err) {
    return { error: err.message };
  }
}

// OnStart for bot systems
module.exports.onStart = ({ message, args }) => {
  const url = args[0];
  const name = args[1];

  if (!url) return message.reply("Usage: /download <url> [filename]");
  if (isBlocked(url)) return message.reply("Blocked domain: cannot download from this source.");

  message.reply("⏳ Downloading...");

  downloadFile(url, name).then(result => {
    if (result.error) return message.reply("❌ " + result.error);
    message.reply(`✅ File downloaded: ${result.file}`);
  });
};
