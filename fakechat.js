const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// 👑 ONLY OWNER UID (তোমার UID বসাও)
const OWNER_UID = ["61584308632995"];

module.exports = {
  config: {
    name: "fakechat",
    aliases: ["fc"],
    version: "12.0",
    author: "Owner Locked Edition",
    category: "fun",
    guide: "Reply → {p}fc Hi 😈 | How are you? ❤️"
  },

  onStart: async function ({ api, event, message, args }) {

    const senderID = event.senderID;

    // 🔒 OWNER ONLY PERMISSION
    if (!OWNER_UID.includes(senderID)) {
      return message.reply("⛔ This command is locked. Only Bot Owner can use it.");
    }

    if (!event.messageReply)
      return message.reply("❌ Reply করে fakechat command দাও");

    const uid = event.messageReply.senderID;
    const texts = args.join(" ").split("|").map(t => t.trim()).filter(Boolean);

    if (!texts.length)
      return message.reply("❌ Message দাও");

    if (texts.length > 10)
      return message.reply("❌ Maximum 10 messages allowed");

    try {

      const info = await api.getUserInfo(uid);
      const name = info[uid]?.name || "Messenger User";
      const avatarImg = await getAvatar(uid);

      const W = 850;
      const padX = 26, padY = 22, lineH = 42, gap = 18;
      let y = 110;

      const temp = createCanvas(1, 1).getContext("2d");
      temp.font = '28px sans-serif';

      const maxW = W - 250;

      const bubbles = texts.map(text => {
        const lines = wrapText(temp, text, maxW - (padX * 2));
        const w = Math.max(...lines.map(l => temp.measureText(l).width));
        return {
          lines,
          w: Math.max(w + (padX * 2), 120),
          h: (lines.length * lineH) + (padY * 2)
        };
      });

      const H = bubbles.reduce((s, b) => s + b.h + gap, 0) + 200;

      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      // 🖤 Background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];

        // Name
        ctx.fillStyle = "#8E8E93";
        ctx.font = '20px sans-serif';
        ctx.fillText(name, 120, y - 18);

        // 🌈 Premium Gradient Bubble
        const gradient = ctx.createLinearGradient(120, y, 120 + b.w, y + b.h);
        gradient.addColorStop(0, "#2c2c2e");
        gradient.addColorStop(1, "#1c1c1e");

        ctx.fillStyle = gradient;
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;

        drawiOSBubble(ctx, 120, y, b.w, b.h, 30);

        ctx.shadowColor = "transparent";

        // Text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = '28px sans-serif';
        ctx.textBaseline = "top";

        let ty = y + padY;
        for (const l of b.lines) {
          ctx.fillText(l, 120 + padX, ty);
          ty += lineH;
        }

        // Avatar only on last bubble
        if (i === bubbles.length - 1) {
          const avatarSize = 58;
          const ay = y + b.h - avatarSize + 2;

          ctx.save();
          ctx.beginPath();
          ctx.arc(68, ay + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatarImg, 39, ay, avatarSize, avatarSize);
          ctx.restore();
        }

        y += b.h + gap;
      }

      // 👁 Seen Status (Dynamic Time)
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      ctx.fillStyle = "#8E8E93";
      ctx.font = '18px sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(`Seen ${time}`, W - 40, y - 10);
      ctx.textAlign = "left";

      const outPath = path.join(__dirname, `fc_owner_${Date.now()}.png`);
      fs.writeFileSync(outPath, canvas.toBuffer());
      await message.reply({ attachment: fs.createReadStream(outPath) });
      fs.unlinkSync(outPath);

    } catch (e) {
      console.error(e);
      message.reply("❌ Error: " + e.message);
    }
  }
};

/* ===== Helpers ===== */

async function getAvatar(uid) {
  try {
    const res = await axios.get(
      `https://graph.facebook.com/${uid}/picture?width=512&height=512`,
      { responseType: "arraybuffer" }
    );
    return await loadImage(res.data);
  } catch {
    return await loadImage("https://i.imgur.com/vMc6asY.png");
  }
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (let word of words) {
    let testLine = currentLine ? currentLine + " " + word : word;

    if (ctx.measureText(testLine).width > maxWidth) {
      if (!currentLine) {
        let chars = word.split("");
        let temp = "";
        for (let ch of chars) {
          if (ctx.measureText(temp + ch).width > maxWidth) {
            lines.push(temp);
            temp = ch;
          } else {
            temp += ch;
          }
        }
        currentLine = temp;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawiOSBubble(ctx, x, y, w, h, r) {
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