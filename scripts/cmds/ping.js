const fs = require("fs");
const path = require("path");
const https = require("https");

const imageUrl = "https://files.catbox.moe/69zkea.jpg";
const imagePath = path.join(__dirname, "ping_image.jpg");

// ===== DOWNLOAD IMAGE ONCE =====
function downloadImageOnce() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(imagePath)) return resolve();

    const file = fs.createWriteStream(imagePath);
    https
      .get(imageUrl, (res) => {
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(imagePath, () => {});
        reject(err);
      });
  });
}

module.exports = {
  config: {
    name: "ping",
    version: "1.1",
    author: "xos Eren | fixed by Maya",
    countDown: 5,
    role: 0,
    shortDescription: "Check bot speed",
    longDescription: "Check bot response time & uptime",
    category: "Utility"
  },

  onStart: async () => {
    // optional init
  },

  onChat: async function ({ event, api }) {
    if ((event.body || "").toLowerCase() !== "ping") return;

    const start = Date.now();
    await downloadImageOnce();

    const ping = Date.now() - start;
    const uptime = formatTime(process.uptime());

    const body = `
╭━━━⌈ ✨ 𝙿𝙸𝙽𝙶 ✨ ⌋━━━╮

⚡ Ping: ${ping} ms
⏱ Uptime: ${uptime}

◦•●♡ your bby ♡●•◦

╰━━━━━━━━━━━━━━━━╯
`.trim();

    return api.sendMessage(
      {
        body,
        attachment: fs.createReadStream(imagePath)
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
