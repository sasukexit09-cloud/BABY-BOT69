const fs = require("fs");
const path = require("path");
const https = require("https");

const imageUrl = "https://files.catbox.moe/69zkea.jpg";
const imagePath = path.join(__dirname, "ping_image.jpg");

// ===== DOWNLOAD IMAGE =====
function downloadImageOnce() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(imagePath)) return resolve();

    const file = fs.createWriteStream(imagePath);
    https.get(imageUrl, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error("Failed to download image"));
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }).on("error", (err) => {
      fs.existsSync(imagePath) && fs.unlinkSync(imagePath);
      reject(err);
    });
  });
}

module.exports = {
  config: {
    name: "ping",
    version: "1.2",
    author: "𝙰𝚈𝙰𝙽 | optimized by Maya",
    countDown: 5,
    role: 0,
    shortDescription: "Check bot speed",
    longDescription: "Check bot response time & uptime",
    category: "Utility"
  },

  // ===== RUN ON BOT START =====
  onStart: async () => {
    try {
      await downloadImageOnce();
      console.log("[PING] Image cached successfully");
    } catch (e) {
      console.log("[PING] Image download failed:", e.message);
    }
  },

  // ===== CHAT LISTENER =====
  onChat: async function ({ event, api }) {
    if (!event.body || event.body.toLowerCase() !== "ping") return;

    const start = Date.now();

    const body = `
╭━━━⌈ 💌 𝙿𝙸𝙽𝙶 💌 ⌋━━━╮

⚡ Ping: ${Date.now() - start} ms
⏱ Uptime: ${formatTime(process.uptime())}

◦•●♡ 𝙱𝙰𝙱𝚈 𝚂𝙴𝙴 𝙼𝚈 𝙿𝙸𝙽𝙶 ♡●•◦

╰━━━━━━━━━━━━━━━━━╯
`.trim();

    return api.sendMessage(
      {
        body,
        attachment: fs.existsSync(imagePath)
          ? fs.createReadStream(imagePath)
          : null
      },
      event.threadID,
      event.messageID
    );
  }
};

// ===== UPTIME FORMAT =====
function formatTime(seconds) {
  const d = Math.floor(seconds / 86400);
  seconds %= 86400;
  const h = Math.floor(seconds / 3600);
  seconds %= 3600;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds);

  return `${d}d ${h}h ${m}m ${s}s`;
}
