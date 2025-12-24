const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "pair3",
    author: "xemon (fixed by Maya)",
    role: 0,
    shortDescription: "VIP-only love match command",
    category: "love",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData }) {
    const tmpDir = path.join(__dirname, "tmp");
    fs.ensureDirSync(tmpDir);

    let bgPath, avt1Path, avt2Path;

    try {
      // ===== VIP CHECK =====
      const senderData = await usersData.get(event.senderID);
      if (!senderData?.vip) {
        return api.sendMessage(
          "❌ This command is only available for VIP users.",
          event.threadID,
          event.messageID
        );
      }

      const id1 = event.senderID;
      const name1 = await usersData.getName(id1) || "Unknown";

      // ===== THREAD USERS =====
      const threadInfo = await api.getThreadInfo(event.threadID);
      const botID = api.getCurrentUserID();
      const users = threadInfo.userInfo || [];

      const me = users.find(u => u.id === id1);
      const gender1 = me?.gender || "UNKNOWN";

      let candidates;
      if (gender1 === "MALE") {
        candidates = users.filter(u => u.gender === "FEMALE" && u.id !== id1 && u.id !== botID);
      } else if (gender1 === "FEMALE") {
        candidates = users.filter(u => u.gender === "MALE" && u.id !== id1 && u.id !== botID);
      } else {
        candidates = users.filter(u => u.id !== id1 && u.id !== botID);
      }

      if (!candidates.length) {
        return api.sendMessage(
          "❌ No suitable match found in this group.",
          event.threadID,
          event.messageID
        );
      }

      const match = candidates[Math.floor(Math.random() * candidates.length)];
      const id2 = match.id;
      const name2 = await usersData.getName(id2) || "Mystery Love";

      // ===== LOVE PERCENT =====
      const base = Math.floor(Math.random() * 100) + 1;
      const weird = ["0", "-1", "99.99", "-99", "-100", "101", "0.01"];
      const tile = Math.random() < 0.15 ? weird[Math.floor(Math.random() * weird.length)] : base;

      // ===== FILE PATHS =====
      const stamp = Date.now();
      bgPath = path.join(tmpDir, `bg_${stamp}.png`);
      avt1Path = path.join(tmpDir, `avt1_${stamp}.jpg`);
      avt2Path = path.join(tmpDir, `avt2_${stamp}.jpg`);

      const backgroundURL = "https://i.postimg.cc/5tXRQ46D/background3.png";
      const avatar = uid =>
        `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=${FB_TOKEN}`;

      // ===== DOWNLOAD IMAGES SAFELY =====
      const download = async (url, file) => {
        const res = await axios.get(url, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        fs.writeFileSync(file, res.data);
      };

      await Promise.all([
        download(backgroundURL, bgPath),
        download(avatar(id1), avt1Path),
        download(avatar(id2), avt2Path)
      ]);

      // ===== CANVAS =====
      const bg = await loadImage(bgPath);
      const img1 = await loadImage(avt1Path);
      const img2 = await loadImage(avt2Path);

      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      const drawCircle = (img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      };

      drawCircle(img1, 100, 150, 300);
      drawCircle(img2, 900, 150, 300);

      fs.writeFileSync(bgPath, canvas.toBuffer("image/png"));

      // ===== SEND MESSAGE =====
      api.sendMessage(
        {
          body:
`『💗』 Congratulations ${name1}
『❤️』 Destiny paired you with ${name2}
『🔗』 Love Percentage: ${tile}%`,
          mentions: [{ tag: name2, id: id2 }],
          attachment: fs.createReadStream(bgPath)
        },
        event.threadID,
        () => {
          fs.removeSync(bgPath);
          fs.removeSync(avt1Path);
          fs.removeSync(avt2Path);
        },
        event.messageID
      );

    } catch (err) {
      console.error("PAIR3 ERROR:", err);
      if (bgPath) fs.removeSync(bgPath);
      if (avt1Path) fs.removeSync(avt1Path);
      if (avt2Path) fs.removeSync(avt2Path);

      api.sendMessage(
        "❌ Something went wrong. Please try again later.",
        event.threadID,
        event.messageID
      );
    }
  },
};
