const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

// ✅ Global index memory
let currentIndex = 0;

module.exports = {
  config: {
    name: "cdp",
    aliases: ["cdp"],
    version: "3.5",
    author: "AyanHost & kivv",
    countDown: 3,
    role: 0,
    shortDescription: "Send 2 sequential PNG images with fancy countdown delete",
    category: "cover dp",
    guide: ".cdp"
  },

  onStart: async function ({ api, event }) {
    const { threadID } = event;
    const __root = path.resolve(__dirname, "cache", "cdp");
    if (!fs.existsSync(__root)) fs.mkdirSync(__root, { recursive: true });

    const pngLinks = [
      "https://files.catbox.moe/8yjesm.jpg",
      "https://files.catbox.moe/fg2u63.jpg",
      "https://files.catbox.moe/53ksws.jpg",
      "https://files.catbox.moe/6f6bp5.jpg",
      "https://files.catbox.moe/ozd15r.jpg",
      "https://files.catbox.moe/ctnp2s.jpg",
      "https://files.catbox.moe/jad2dg.jpg",
      "https://files.catbox.moe/1o4d8d.jpg",
      "https://files.catbox.moe/jm8s6h.jpg",
      "https://files.catbox.moe/jxmj90.jpg",
      "https://files.catbox.moe/kykjq3.jpg",
      "https://files.catbox.moe/4am05d.jpg",
      "https://files.catbox.moe/js5q6u.jpg",
      "https://files.catbox.moe/ii4lnm.jpg",
      "https://files.catbox.moe/vl6orf.jpg",
      "https://files.catbox.moe/rfr81q.jpg"
    ];

    // 🌈 Fancy message পাঠানো
    const fancyMessage = "✨ Your stylish Cover DPs are loading... ✨";
    const sentMsg = await api.sendMessage(fancyMessage, threadID);

    try {
      const attachments = [];

      // ✅ প্রতি বার ২টা ছবি পাঠাবে অর্ডার অনুযায়ী
      for (let i = 0; i < 2; i++) {
        if (currentIndex >= pngLinks.length) currentIndex = 0; // Reset if finished all
        const url = pngLinks[currentIndex++];
        const fileExt = path.extname(url) || ".jpg";
        const filePath = path.join(__root, `cdp_${i}${fileExt}`);

        const response = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, Buffer.from(response.data));

        attachments.push(fs.createReadStream(filePath));
      }

      // 📤 ছবি পাঠানো
      await api.sendMessage({ body: "", attachment: attachments }, threadID);

      // 🕒 Countdown animation (auto delete fancy message)
      setTimeout(async () => {
        const countdownMsg = await api.sendMessage("🔥 Deleting in 3...", threadID);
        setTimeout(() => api.editMessage("⚡ Deleting in 2...", countdownMsg.messageID), 1000);
        setTimeout(() => api.editMessage("💫 Deleting in 1...", countdownMsg.messageID), 2000);
        setTimeout(() => {
          api.unsendMessage(sentMsg.messageID);
          api.unsendMessage(countdownMsg.messageID);
        }, 3000);
      }, 2000);

    } catch (err) {
      console.error("Error sending images:", err.message);
      await api.sendMessage("⚠️ Failed to send images!", threadID);
    }

    // 🧹 Cache clear
    try {
      const files = await fs.readdir(__root);
      for (const file of files) fs.unlinkSync(path.join(__root, file));
    } catch (err) {
      console.error("Cache clear error:", err.message);
    }
  }
};
