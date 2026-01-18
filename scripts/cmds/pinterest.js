const axios = require("axios");
const path = require("path");
const fs = require("fs");

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin"],
    version: "1.3",
    author: "ArYAN | Maya (VIP removed)",
    role: 0,
    countDown: 20,
    longDescription: {
      en: "Search Pinterest images (FREE for everyone)"
    },
    category: "media",
    guide: {
      en: "{pn} <search query> - <number>\nExample: {pn} cat - 10"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const keySearch = args.join(" ");
      if (!keySearch.includes("-")) {
        return api.sendMessage(
          `❌ Usage error\nExample:\n{pn} cat - 10`,
          event.threadID,
          event.messageID
        );
      }

      const query = keySearch.substring(0, keySearch.indexOf("-")).trim();
      let count = parseInt(keySearch.split("-").pop()) || 6;
      if (count > 20) count = 20;

      const apiUrl = `https://aryan-error-api.onrender.com/pinterest?search=${encodeURIComponent(
        query
      )}&count=${count}`;

      const res = await axios.get(apiUrl);
      const images = res.data?.data;

      if (!images || !images.length) {
        return api.sendMessage(
          "❌ No images found 🥺",
          event.threadID,
          event.messageID
        );
      }

      const cacheDir = path.join(__dirname, "cache_pin");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const attachments = [];

      for (let i = 0; i < Math.min(count, images.length); i++) {
        try {
          const imgRes = await axios.get(images[i], {
            responseType: "arraybuffer",
            headers: { "User-Agent": "Mozilla/5.0" }
          });

          const imgPath = path.join(cacheDir, `${i + 1}.jpg`);
          await fs.promises.writeFile(imgPath, imgRes.data);
          attachments.push(fs.createReadStream(imgPath));
        } catch (err) {
          console.error("Image download failed:", err.message);
        }
      }

      await api.sendMessage(
        {
          body: `✨ Pinterest Images\n🔎 Search: ${query}`,
          attachment: attachments
        },
        event.threadID,
        event.messageID
      );

      // ===== CLEAN CACHE =====
      if (fs.existsSync(cacheDir)) {
        await fs.promises.rm(cacheDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(error);
      return api.sendMessage(
        `❌ Error: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
};
