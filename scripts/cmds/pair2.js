const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "pair2",
    author: "Nyx x @Ariyan (fixed by Maya)",
    category: "love",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      // ===== GET SENDER NAME =====
      const senderData = await usersData.get(event.senderID);
      const senderName = senderData?.name || "Unknown";

      // ===== THREAD INFO =====
      const threadInfo = await api.getThreadInfo(event.threadID);
      const users = threadInfo.userInfo || [];

      const me = users.find(u => u.id === event.senderID);

      if (!me?.gender) {
        return api.sendMessage(
          "⚠ Your gender could not be detected.",
          event.threadID,
          event.messageID
        );
      }

      const targetGender = me.gender === "MALE" ? "FEMALE" : "MALE";

      const candidates = users.filter(
        u => u.gender === targetGender && u.id !== event.senderID
      );

      if (!candidates.length) {
        return api.sendMessage(
          "❌ No suitable match found in this group.",
          event.threadID,
          event.messageID
        );
      }

      const match = candidates[Math.floor(Math.random() * candidates.length)];
      const matchName = match.name || "Mystery Love";

      // ===== PATH SETUP =====
      const tmpDir = path.join(__dirname, "tmp");
      fs.ensureDirSync(tmpDir);

      const myImgPath = path.join(tmpDir, `me_${event.senderID}.jpg`);
      const pairImgPath = path.join(tmpDir, `pair_${match.id}.jpg`);

      // ===== AVATAR URL 1500x1500 =====
      const avatar = uid =>
        `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=${FB_TOKEN}`;

      // ===== DOWNLOAD DP =====
      await Promise.all([
        axios.get(avatar(event.senderID), { responseType: "arraybuffer" })
          .then(res => fs.writeFileSync(myImgPath, res.data))
          .catch(() => console.warn(`Failed to download avatar for ${event.senderID}`)),

        axios.get(avatar(match.id), { responseType: "arraybuffer" })
          .then(res => fs.writeFileSync(pairImgPath, res.data))
          .catch(() => console.warn(`Failed to download avatar for ${match.id}`))
      ]);

      // ===== CANVAS =====
      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const bg = await loadImage(
        "https://i.postimg.cc/tRFY2HBm/0602f6fd6933805cf417774fdfab157e.jpg"
      );

      const myImg = await loadImage(myImgPath);
      const pairImg = await loadImage(pairImgPath);

      ctx.drawImage(bg, 0, 0, width, height);

      const drawCircle = (img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      };

      drawCircle(myImg, 380, 40, 170);
      drawCircle(pairImg, width - 220, 190, 180);

      // ===== OUTPUT =====
      const outPath = path.join(tmpDir, `pair_${Date.now()}.png`);
      await fs.writeFile(outPath, canvas.toBuffer("image/png"));

      const lovePercent = Math.floor(Math.random() * 31) + 70;

      api.sendMessage(
        {
          body:
`🥰 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 💞

・${senderName} 🎀
・${matchName} 🎀

💌 Wish you a lifetime of happiness ❤️
💙 Love Percentage: ${lovePercent}%`,
          attachment: fs.createReadStream(outPath)
        },
        event.threadID,
        () => {
          [outPath, myImgPath, pairImgPath].forEach(f => {
            if (fs.existsSync(f)) fs.unlinkSync(f);
          });
        },
        event.messageID
      );

    } catch (err) {
      console.error("PAIR2 ERROR:", err);
      api.sendMessage(
        "❌ Pair generate করতে সমস্যা হয়েছে, পরে আবার চেষ্টা করো!",
        event.threadID,
        event.messageID
      );
    }
  }
};
