const fs = require("fs-extra");
const axios = require("axios");

module.exports = {
  config: {
    name: "ping",
    version: "1.5",
    author: "Maya",
    countDown: 5,
    role: 0,
    category: "Utility",
    shortDescription: "Check bot speed",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    const timeStart = Date.now();
    
    // Uptime Calculation
    const totalSeconds = process.uptime();
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const imageUrl = "https://files.catbox.moe/47fth8.jpg";
    const pathImg = __dirname + "/cache/ping_img.jpg";

    try {
      // Create cache folder if not exists
      if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");

      // Image download (Simplified)
      if (!fs.existsSync(pathImg)) {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(pathImg, Buffer.from(response.data, 'binary'));
      }

      return api.sendMessage({
        body: `╭━━━⌈ 💌 𝙿𝙸𝙽𝙶 💌 ⌋━━━╮\n\n⚡ Ping: ${Date.now() - timeStart}ms\n⏱ Uptime: ${uptimeStr}\n\n◦•●♡ 𝙱𝙰𝙱𝚈 𝚂𝙴𝙴 𝙼𝚈 𝙿𝙸𝙽𝙶 ♡●•◦\n\n╰━━━━━━━━━━━━━━━━━╯`,
        attachment: fs.createReadStream(pathImg)
      }, event.threadID, event.messageID);

    } catch (err) {
      // Jodi image-e somossya hoy, shudhu text pathabe
      return api.sendMessage(`⚡ Ping: ${Date.now() - timeStart}ms\n⏱ Uptime: ${uptimeStr}`, event.threadID, event.messageID);
    }
  }
};