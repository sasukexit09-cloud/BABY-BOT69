const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

/* ===== SETTINGS ===== */
const PRICE = 200000;
const OWNER_UID = ["61584308632995"]; 

module.exports = {
  config: {
    name: "fakechat",
    aliases: ["fc"],
    version: "3.0",
    author: "AYAN BBE & Gemini",
    category: "fun",
    guide: "Reply → {p}fc Hi | How are you?"
  },

  onStart: async function ({ api, event, message, args, usersData }) {
    if (!event.messageReply)
      return message.reply("❌ Reply করে fakechat command দাও");

    const senderID = event.senderID;
    const isOwner = OWNER_UID.includes(senderID);
    
    try {
      const userData = await usersData.get(senderID) || {};
      if (!isOwner && userData.isVIP !== true) {
        const money = userData.money || 0;
        if (money < PRICE) return message.reply(`❌ 200,000 balance লাগবে`);
        await usersData.set(senderID, { money: money - PRICE });
      }
    } catch (err) { console.log("Balance system error") }

    try {
      const uid = event.messageReply.senderID;
      const texts = args.join(" ").split("|").map(t => t.trim()).filter(Boolean);
      if (!texts.length) return message.reply("❌ Message দাও");

      let name = "Messenger User";
      try {
        const info = await api.getUserInfo(uid);
        if (info[uid]) name = info[uid].name;
      } catch (e) {}

      const avatarImg = await getAvatar(uid);
      const fontPath = path.join(__dirname, "Messenger.ttf");
      if (fs.existsSync(fontPath) && !global.__fcFontLoaded) {
        registerFont(fontPath, { family: "Messenger" });
        global.__fcFontLoaded = true;
      }
      const activeFont = global.__fcFontLoaded ? "Messenger" : "sans-serif";

      /* ===== CANVAS DESIGN ===== */
      const W = 800;
      const padX = 20;
      const padY = 15;
      const lineH = 32;
      const gap = 30;
      let y = 80;

      const temp = createCanvas(1, 1).getContext("2d");
      temp.font = `26px ${activeFont}`;
      const maxW = W - 220;

      const bubbles = texts.map(text => {
        const lines = wrapText(temp, text, maxW - (padX * 2));
        const w = Math.max(...lines.map(l => temp.measureText(l).width));
        return {
          lines,
          w: w + (padX * 2),
          h: (lines.length * lineH) + (padY * 2)
        };
      });

      const H = bubbles.reduce((s, b) => s + b.h + gap, 0) + 120;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      // Dark Mode Background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);

      for (const b of bubbles) {
        // Name above the first bubble
        ctx.fillStyle = "#8a8d91";
        ctx.font = `18px ${activeFont}`;
        ctx.fillText(name, 105, y - 10);

        // Messenger Bubble (#242526 or #3E4042)
        ctx.fillStyle = "#3e4042";
        drawMessengerBubble(ctx, 105, y, b.w, b.h, 25);

        // Text
        ctx.fillStyle = "#ffffff";
        ctx.font = `26px ${activeFont}`;
        ctx.textBaseline = "top";

        let ty = y + padY;
        for (const l of b.lines) {
          ctx.fillText(l, 105 + padX, ty);
          ty += lineH;
        }

        // Circular Avatar
        const avatarSize = 50;
        const ay = y + b.h - avatarSize; // Bottom-aligned like Messenger
        ctx.save();
        ctx.beginPath();
        ctx.arc(60, ay + (avatarSize/2), avatarSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, 60 - (avatarSize/2), ay, avatarSize, avatarSize);
        ctx.restore();

        // Active Status Dot
        ctx.beginPath();
        ctx.arc(80, ay + 42, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#31a24c";
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.stroke();

        y += b.h + gap;
      }

      const outPath = path.join(__dirname, `messenger_fake_${Date.now()}.png`);
      fs.writeFileSync(outPath, canvas.toBuffer());

      await message.reply({ attachment: fs.createReadStream(outPath) });
      fs.unlinkSync(outPath);

    } catch (e) {
      console.error(e);
      message.reply("❌ Fakechat error: " + e.message);
    }
  }
};

/* ===== HELPER FUNCTIONS ===== */

async function getAvatar(uid) {
  try {
    const res = await axios.get(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });
    return await loadImage(res.data);
  } catch {
    return await loadImage("https://i.imgur.com/vMc6asY.png");
  }
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

function drawMessengerBubble(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}