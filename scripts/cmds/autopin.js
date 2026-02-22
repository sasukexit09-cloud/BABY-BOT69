const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "autopin",
    version: "3.7",
    author: "Arafat",
    role: 0,
    countDown: 0,
    category: "auto",
    shortDescription: "Pinterest Auto Downloader",
    longDescription: "Auto-detect Pinterest links → Download Photo/Video",
  },

  onStart: async ({ message }) => {
    await message.reply("✅ Autopin Activated");
  },

  onChat: async ({ event, message }) => {
    const text = event.body || "";
    if (!text) return;

    const regex = /(https?:\/\/(www\.)?(pin\.it|pinterest\.com)\/[^\s]+)/i;
    const link = text.match(regex)?.[0];
    if (!link) return;

    let tmp;
    try {
      tmp = await message.reply("⏳ Downloading Pinterest media...");

      // Get base API
      const configURL =
        "https://raw.githubusercontent.com/Arafat-Core/Arafat-Temp/refs/heads/main/download.json";
      const { data: config } = await axios.get(configURL);
      const baseAPI = config?.pinterest;
      if (!baseAPI) throw new Error("Pinterest API not found");

      // Get media info
      const apiURL = `${baseAPI}/arafat/Pinterest?url=${encodeURIComponent(link)}`;
      const { data: result } = await axios.get(apiURL);
      if (!result?.success || !result?.file) throw new Error("Unable to fetch media");

      // Ensure cache folder
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const ext = result.file.endsWith(".mp4") ? ".mp4" : ".jpg";
      const filePath = path.join(cacheDir, `pin_${Date.now()}${ext}`);

      // Download file
      const { data: fileBuffer } = await axios.get(result.file, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, fileBuffer);

      // Send media
      await message.reply({
        body: ext === ".mp4" ? "🎬 Pinterest Video" : "🖼 Pinterest Photo",
        attachment: fs.createReadStream(filePath),
      });

      // Clean up
      fs.unlinkSync(filePath);

      // Remove temporary message
      if (tmp?.messageID) await message.unsend(tmp.messageID);

    } catch (err) {
      // Safe error handling
      if (tmp?.messageID) await message.unsend(tmp.messageID);
      await message.reply(`⚠️ Error: ${err.message}`);
    }
  },
};