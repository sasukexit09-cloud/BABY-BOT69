const axios = require("axios");
const fs = require("fs");
const path = require("path");

const cooldown = new Map();
const COOLDOWN_TIME = 30 * 1000;

module.exports.config = {
  name: "tiktok",
  version: "2.1",
  author: "AYAN BBE",
  countDown: 5,
  role: 0,
  description: { en: "Search & download TikTok videos" },
  category: "MEDIA",
  guide: { en: "{pn} <search> - <limit>" },
};

module.exports.onStart = async function ({ api, args, event }) {
  const { threadID, messageID, senderID } = event;

  // 1. Cache Folder Check (Fix: Error handle kore)
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  // 2. Cooldown Check
  if (cooldown.has(senderID)) {
    const expire = cooldown.get(senderID);
    if (Date.now() < expire) {
      return api.sendMessage(`⏳ Slow down! Try again in ${Math.ceil((expire - Date.now()) / 1000)}s`, threadID, messageID);
    }
  }
  cooldown.set(senderID, Date.now() + COOLDOWN_TIME);

  let search = args.join(" ");
  if (!search) return api.sendMessage("❌ Please provide a search keyword.", threadID, messageID);

  let searchLimit = 30;
  const match = search.match(/^(.+)\s*-\s*(\d+)$/);
  if (match) {
    search = match[1].trim();
    searchLimit = parseInt(match[2]);
  }

  try {
    api.sendMessage("🔍 Searching TikTok...🍓", threadID, messageID);

    const apiUrl = `https://www.noobs-api.top/dipto/tiktoksearch?search=${encodeURIComponent(search)}&limit=${searchLimit}`;
    const res = await axios.get(apiUrl);
    const data = res.data?.data;

    if (!data || data.length === 0) return api.sendMessage("❌ No videos found.😿", threadID);

    // Random video pick
    const videoData = data[Math.floor(Math.random() * data.length)];
    const videoUrl = videoData.video || videoData.nowatermark; // Backup key check

    if (!videoUrl) return api.sendMessage("⚠️ Video URL not found in API.🍓", threadID);

    const filePath = path.join(cacheDir, `${Date.now()}.mp4`);

    // 3. Download Video
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      api.sendMessage({
        body: `🎬 TikTok: ${videoData.title || "No Title"}\n👤 Author: ${videoData.author || "Unknown"}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);
    });

    writer.on('error', () => api.sendMessage("❌ Download failed.", threadID));

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Connection Error or API Down.", threadID);
  }
};