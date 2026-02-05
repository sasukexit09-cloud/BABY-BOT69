const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "autodl",
    version: "2.0.0",
    author: "rX x Rahat",
    countDown: 2, // Cooldown komiye deya hoyeche
    role: 0,
    description: { en: "Ultra-fast auto video downloader" },
    category: "media",
    guide: { en: "Paste link and wait for magic" }
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("⚡ Auto-downloader is active!", event.threadID, event.messageID);
  },

  onChat: async function ({ api, event }) {
    const { body, threadID, messageID } = event;
    if (!body || !body.startsWith("https://")) return;

    // Fast Regex Check
    const isMedia = /youtu\.be|youtube\.com|tiktok\.com|instagram\.com|facebook\.com|fb\.watch/.test(body);
    if (!isMedia) return;

    const { alldown } = require("rx-dawonload");

    try {
      // Non-blocking reaction
      api.setMessageReaction("⚡", messageID, () => {}, true);

      // Fast fetching
      const res = await alldown(body.trim());
      if (!res || !res.url) return api.setMessageReaction("❌", messageID, () => {}, true);

      // Create stream instead of writing full file first
      const cachePath = path.join(__dirname, "cache", `fast_${Date.now()}.mp4`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));

      // Use Axios stream for high speed
      const response = await axios({
        method: 'get',
        url: res.url,
        responseType: 'stream',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const writer = fs.createWriteStream(cachePath);
      response.data.pipe(writer);

      writer.on('finish', () => {
        api.sendMessage({
          body: `✅ 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲\n🚀 𝗦𝗽𝗲𝗲𝗱: 𝚄𝙻𝚃𝚁𝙰 𝙵𝙰𝚂𝚃\n📍 𝗣𝗹𝗮𝘁𝗳𝗼𝗿𝗺: ${res.title || 'Media'}`,
          attachment: fs.createReadStream(cachePath)
        }, threadID, (err) => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
          if (!err) api.setMessageReaction("✅", messageID, () => {}, true);
        }, messageID);
      });

      writer.on('error', (err) => {
        throw err;
      });

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};