const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ===== BASE API =====
const baseApiUrl = async () => {
  return "https://www.noobs-api.top/dipto";
};

// ===== COOLDOWN SYSTEM =====
const cooldown = new Map();
const COOLDOWN_TIME = 30 * 1000; // 30 seconds per user

module.exports.config = {
  name: "tiktok",
  version: "2.0",
  author: "AYAN BBE💋 (ALL USERS by Maya)",
  countDown: 5,
  role: 0,
  description: {
    en: "Search & download TikTok videos (All users)",
  },
  category: "MEDIA",
  guide: {
    en:
      "{pn} <search> - <optional: number>\n" +
      "Example:\n{pn} caredit - 20",
  },
};

module.exports.onStart = async function ({ api, args, event }) {
  const userId = event.senderID;
  const now = Date.now();

  // ===== COOLDOWN CHECK =====
  if (cooldown.has(userId)) {
    const expire = cooldown.get(userId);
    if (now < expire) {
      const wait = Math.ceil((expire - now) / 1000);
      return api.sendMessage(
        `⏳ Slow down 😅\nTry again after ${wait}s`,
        event.threadID,
        event.messageID
      );
    }
  }
  cooldown.set(userId, now + COOLDOWN_TIME);

  // ===== PARSE SEARCH =====
  let search = args.join(" ");
  let searchLimit = 30;

  const match = search.match(/^(.+)\s*-\s*(\d+)$/);
  if (match) {
    search = match[1].trim();
    const parsed = parseInt(match[2], 10);
    if (!isNaN(parsed)) searchLimit = parsed;
  }

  if (!search) {
    return api.sendMessage(
      "❌ Please provide a search keyword.\nExample: tiktok caredit",
      event.threadID
    );
  }

  const apiUrl = `${await baseApiUrl()}/tiktoksearch?search=${encodeURIComponent(
    search
  )}&limit=${searchLimit}`;

  try {
    const response = await axios.get(apiUrl, { timeout: 15000 });
    const data = response.data?.data;

    if (!Array.isArray(data) || !data.length) {
      return api.sendMessage(
        "❌ No videos found for your search.",
        event.threadID
      );
    }

    const videoData = data[Math.floor(Math.random() * data.length)];
    if (!videoData.video) {
      return api.sendMessage(
        "⚠️ Invalid video source.",
        event.threadID
      );
    }

    // ===== HQ DOWNLOAD =====
    const filePath = path.join(
      __dirname,
      "cache",
      `${Date.now()}.mp4`
    );

    const videoStream = await axios({
      method: "GET",
      url: videoData.video,
      responseType: "stream",
      timeout: 45000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.tiktok.com/",
        Accept: "*/*",
      },
    });

    const writer = fs.createWriteStream(filePath);
    videoStream.data.pipe(writer);

    writer.on("finish", () => {
      const info =
        `🎬 TikTok Video\n\n` +
        `📌 Title: ${videoData.title || "N/A"}\n` +
        `👤 Author: ${videoData.author || "N/A"}`;

      api.sendMessage(
        {
          body: info,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );
    });

    writer.on("error", (err) => {
      console.error(err);
      api.sendMessage(
        "❌ Failed to download the TikTok video.",
        event.threadID
      );
    });
  } catch (error) {
    console.error(error);
    api.sendMessage(
      "❌ An error occurred while fetching the TikTok video.",
      event.threadID
    );
  }
};
