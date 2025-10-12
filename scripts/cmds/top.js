const { createCanvas, loadImage } = require("canvas");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

module.exports = {
  config: {
    name: "top",
    aliases: ["tp"],
    version: "3.6",
    author: "Tarek x Asif",
    role: 0,
    shortDescription: {
      en: "Top 15 Rich Users (Glowing Card)"
    },
    longDescription: {
      en: "Displays Top 15 Richest Users with glowing effects and premium design."
    },
    category: "group",
    guide: {
      en: "{pn}"
    }
  },

  envConfig: {
    ACCESS_TOKEN: "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"
  },

  onStart: async function ({ api, message, event, usersData }) {

    const numFormatter = (num) => {
      const units = ["", "K", "M", "B", "T", "Q", "S", "O", "N", "D"];
      let i = 0;
      while (num >= 1000 && i < units.length - 1) {
        num /= 1000;
        i++;
      }
      if (units[i] === "D") {
        const shortNum = Math.floor(num).toString().slice(0, 4);
        return shortNum + "..D";
      }
      return num.toFixed(1).replace(/\.0$/, "") + units[i];
    };
    const formatMoney = (amount) => `${numFormatter(amount || 0)} $`;

    const allUsers = await usersData.getAll();
    const topUsers = allUsers.sort((a, b) => b.money - a.money).slice(0, 15);

    const width = 800, height = 1300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🌌 Background Gradient + Glow
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#0f0f1a");
    bgGradient.addColorStop(1, "#1e1e2e");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Outer border glow
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 30;
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.shadowBlur = 0;

    // 🏆 Title Glow
    ctx.font = "bold 45px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 25;
    ctx.fillText("👑 TOP 15 RICHEST USERS 👑", width / 2, 90);
    ctx.shadowBlur = 0;

    // Line separator
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 110);
    ctx.lineTo(width - 60, 110);
    ctx.stroke();

    // 🥇 Colors
    const GOLD = "#FFD700", SILVER = "#C0C0C0", BRONZE = "#CD7F32";
    const TEXT = "#ffffff", SUB = "#a0a0a0";

    // Top 3
    const positions = [1, 2, 0];
    const cardW = (width - 100) / 3 - 20;
    const profileSize = 130;
    const topY = 150;

    async function drawTopUser(user, idx, rank) {
      if (!user) return;
      const x = 60 + (cardW + 30) * positions[idx];
      const color = [GOLD, SILVER, BRONZE][rank - 1] || "#888";

      // Card
      const grad = ctx.createLinearGradient(x, topY, x + cardW, topY + 320);
      grad.addColorStop(0, "#2a2a3e");
      grad.addColorStop(1, "#1c1c28");
      ctx.fillStyle = grad;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fillRect(x, topY, cardW, 320);
      ctx.shadowBlur = 0;

      // Profile image
      let img;
      try {
        const res = await axios.get(
          `https://graph.facebook.com/${user.userID}/picture?width=200&height=200&access_token=${module.exports.envConfig.ACCESS_TOKEN}`,
          { responseType: "arraybuffer" }
        );
        img = await loadImage(Buffer.from(res.data, "binary"));
      } catch {
        const placeholder = createCanvas(profileSize, profileSize);
        const pctx = placeholder.getContext("2d");
        pctx.fillStyle = "#444";
        pctx.fillRect(0, 0, profileSize, profileSize);
        pctx.fillStyle = "#fff";
        pctx.textAlign = "center";
        pctx.font = "bold 26px sans-serif";
        pctx.fillText("No Pic", profileSize / 2, profileSize / 2 + 8);
        img = await loadImage(placeholder.toBuffer());
      }

      // Circle avatar with glow
      const imgX = x + cardW / 2 - profileSize / 2;
      const imgY = topY + 20;
      ctx.save();
      ctx.beginPath();
      ctx.arc(imgX + profileSize / 2, imgY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, imgX, imgY, profileSize, profileSize);
      ctx.restore();

      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(imgX + profileSize / 2, imgY + profileSize / 2, profileSize / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Rank text with glow
      ctx.fillStyle = color;
      ctx.font = "bold 30px sans-serif";
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillText(`#${rank}`, x + cardW / 2, imgY + profileSize + 40);
      ctx.shadowBlur = 0;

      ctx.fillStyle = TEXT;
      ctx.font = "22px sans-serif";
      const displayName = user.name.length > 15 ? user.name.slice(0, 12) + "..." : user.name;
      ctx.fillText(displayName, x + cardW / 2, imgY + profileSize + 75);

      ctx.fillStyle = color;
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(formatMoney(user.money), x + cardW / 2, imgY + profileSize + 105);
    }

    await Promise.all([
      drawTopUser(topUsers[0], 0, 1),
      drawTopUser(topUsers[1], 1, 2),
      drawTopUser(topUsers[2], 2, 3)
    ]);

    // 🔹 List for next users (#4–#15) with profile icons
    let y = 550;
    const listX = 70, listW = width - 140;
    for (let i = 3; i < topUsers.length; i++) {
      const u = topUsers[i];
      const posY = y - 25;
      const rowH = 40;
      const avatarSize = 40;
      const avatarX = listX + 40;
      const avatarY = posY + (rowH / 2) - (avatarSize / 2);

      // Row background
      ctx.fillStyle = "rgba(47,47,68,0.8)";
      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 10;
      ctx.fillRect(listX, posY, listW, rowH);
      ctx.shadowBlur = 0;

      // Profile picture (small circle)
      try {
        const res = await axios.get(
          `https://graph.facebook.com/${u.userID}/picture?width=100&height=100&access_token=${module.exports.envConfig.ACCESS_TOKEN}`,
          { responseType: "arraybuffer" }
        );
        const img = await loadImage(Buffer.from(res.data, "binary"));
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } catch {
        ctx.fillStyle = "#555";
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ccc";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("?", avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 4);
        ctx.textAlign = "left";
      }

      // Rank number
      ctx.fillStyle = "#00ffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(`#${i + 1}`, listX + 10, y);

      // Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px sans-serif";
      ctx.fillText(u.name.substring(0, 25), avatarX + avatarSize + 15, y);

      // Money
      ctx.fillStyle = "#FFD700";
      ctx.textAlign = "right";
      ctx.fillText(formatMoney(u.money), listX + listW - 10, y);
      ctx.textAlign = "left";

      y += 50;
    }

    // Footer glow text
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#00ffff";
    ctx.textAlign = "center";
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 15;
    ctx.fillText(`✨ Generated by Tarek's Bot • Total Users: ${allUsers.length} ✨`, width / 2, height - 40);
    ctx.shadowBlur = 0;

    // Export
    const buffer = canvas.toBuffer("image/png");
    const imgPath = path.join(__dirname, `top_${Date.now()}.png`);
    fs.writeFileSync(imgPath, buffer);

    await api.sendMessage(
      { attachment: fs.createReadStream(imgPath) },
      event.threadID,
      event.messageID
    );

    fs.unlinkSync(imgPath);
  }
};
