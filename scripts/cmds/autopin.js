!cmd install autopin.js const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "autopin",
    version: "6.0",
    author: "AYAN BBE",
    role: 0,
    countDown: 0,
    category: "auto",
    shortDescription: "Pinterest Auto Downloader (HD Single)"
  },

  onStart: async ({ message }) => {
    await message.reply("😾 Autopin Activated (HD Mode)");
  },

  onChat: async ({ event, message }) => {
    const text = event.body || "";
    if (!text) return;

    const regex = /(https?:\/\/(www\.)?(pin\.it|pinterest\.com)\/[^\s]+)/i;
    const link = text.match(regex)?.[0];
    if (!link) return;

    let loading;

    try {
      loading = await message.reply("⏳ Fetching Pinterest media...");

      // 🔥 Follow redirect (fix pin.it short link)
      const redirect = await axios.get(link, {
        maxRedirects: 5,
        validateStatus: () => true
      });

      const finalURL = redirect.request.res.responseUrl;

      // 🔥 Get page HTML
      const { data: html } = await axios.get(finalURL, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      // 🔥 Extract ONLY original media
      const video = html.match(/"contentUrl":"(https:[^"]+\.mp4)"/);
      const original = html.match(/"url":"(https:[^"]+\/originals\/[^"]+\.(jpg|png))"/);

      let mediaURL;

      if (video) {
        mediaURL = video[1].replace(/\\u002F/g, "/");
      } else if (original) {
        mediaURL = original[1].replace(/\\u002F/g, "/");
      } else {
        throw new Error("Media not found");
      }

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const ext = mediaURL.includes(".mp4") ? ".mp4" : ".jpg";
      const filePath = path.join(cacheDir, `pin_${Date.now()}${ext}`);

      // 🔥 Download file
      const { data } = await axios.get(mediaURL, {
        responseType: "arraybuffer"
      });

      fs.writeFileSync(filePath, data);

      await message.reply({
        body: ext === ".mp4" ? "💟 Pinterest Video" : "😋🍨 Pinterest HD Image",
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

      if (loading?.messageID) await message.unsend(loading.messageID);

    } catch (err) {
      if (loading?.messageID) await message.unsend(loading.messageID);
      await message.reply("❌ Failed to fetch Pinterest media");
    }
  }
};