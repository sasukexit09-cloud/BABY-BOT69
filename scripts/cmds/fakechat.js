const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

/* ===== SETTINGS ===== */
const PRICE = 200000;
const OWNER_UID = ["61584308632995"]; // 👈 নিজের UID

module.exports = {
  config: {
    name: "fakechat",
    aliases: ["fc"],
    version: "2.0",
    author: "🥵AYAN BBE🥵💋",
    category: "fun",
    guide: "Reply → {p}fc Hi | How are you?"
  },

  isVIP: async function (uid, usersData) {
    const data = await usersData.get(uid);
    return data?.isVIP === true;
  },

  onStart: async function ({ api, event, message, args, usersData }) {
    if (!event.messageReply)
      return message.reply("❌ Reply করে fakechat command দাও");

    const senderID = event.senderID;
    const isOwner = OWNER_UID.includes(senderID);
    const isVip = await this.isVIP(senderID, usersData);

    /* ===== BALANCE ===== */
    if (!isOwner && !isVip) {
      const userData = await usersData.get(senderID);
      const money = userData?.money || 0;

      if (money < PRICE)
        return message.reply(`❌ 200,000 balance লাগবে\n💰 তোমার balance: ${money}`);

      await usersData.set(senderID, { money: money - PRICE });
    }

    try {
      const uid = event.messageReply.senderID;
      const texts = args.join(" ").split("|").map(t => t.trim()).filter(Boolean);
      if (!texts.length) return message.reply("❌ Message দাও");

      const userInfo = await getUserInfo(api, uid);

      /* ===== AVATAR (REAL FB PROFILE PIC) ===== */
      const avatarImg = await getAvatar(uid);

      /* ===== FONT ===== */
      const fontPath = path.join(__dirname, "Messenger.ttf");
      if (!fs.existsSync(fontPath)) {
        await downloadFile(
          "https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans-Regular.ttf",
          fontPath
        );
      }

      if (!global.__fcFontLoaded) {
        registerFont(fontPath, { family: "Messenger" });
        global.__fcFontLoaded = true;
      }

      /* ===== CANVAS CALC ===== */
      const W = 820;
      const padX = 18;
      const padY = 14;
      const lineH = 28;
      const gap = 22;
      let y = 90;

      const temp = createCanvas(1, 1).getContext("2d");
      temp.font = "24px Messenger";
      const maxW = W - 240;

      const bubbles = texts.map(text => {
        const lines = wrap(temp, text, maxW - padX * 2);
        const w = Math.max(...lines.map(l => temp.measureText(l).width));
        return {
          lines,
          w: w + padX * 2,
          h: lines.length * lineH + padY * 2
        };
      });

      const H = bubbles.reduce((s, b) => s + b.h + gap, 0) + 140;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      /* ===== BG ===== */
      ctx.fillStyle = "#0f1115";
      ctx.fillRect(0, 0, W, H);

      const name =
        userInfo.name.length > 18
          ? userInfo.name.slice(0, 18) + "…"
          : userInfo.name;

      for (const b of bubbles) {
        ctx.fillStyle = "#b0b3b8";
        ctx.font = "16px Messenger";
        ctx.fillText(name, 92, y - 8);

        ctx.fillStyle = "#2a2d31";
        round(ctx, 92, y, b.w, b.h, 22);

        ctx.fillStyle = "#e4e6eb";
        ctx.font = "24px Messenger";
        ctx.textBaseline = "middle";

        let ty = y + b.h / 2 - (b.lines.length * lineH) / 2 + lineH / 2;
        for (const l of b.lines) {
          ctx.fillText(l, 92 + padX, ty);
          ty += lineH;
        }

        const ay = y + b.h / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(55, ay, 22, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, 33, ay - 22, 44, 44);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(68, ay + 14, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#31a24c";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(68, ay + 14, 7.5, 0, Math.PI * 2);
        ctx.strokeStyle = "#0f1115";
        ctx.lineWidth = 3;
        ctx.stroke();

        y += b.h + gap;
      }

      const out = path.join(__dirname, `fakechat_${Date.now()}.png`);
      fs.writeFileSync(out, canvas.toBuffer());

      await message.reply({ attachment: fs.createReadStream(out) });
      fs.unlinkSync(out);

    } catch (e) {
      console.error(e);
      message.reply("❌ Fakechat generate failed");
    }
  }
};

/* ===== HELPERS ===== */

async function getAvatar(uid) {
  try {
    const res = await axios.get(
      `https://graph.facebook.com/${uid}/picture?width=512&height=512&redirect=true`,
      { responseType: "arraybuffer" }
    );
    return await loadImage(res.data);
  } catch {
    return await loadImage("https://cdn-icons-png.flaticon.com/512/149/149071.png");
  }
}

function wrap(ctx, text, max) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > max) {
      if (line) lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function round(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

async function downloadFile(url, p) {
  const r = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(p, r.data);
}

function getUserInfo(api, uid) {
  return new Promise((res, rej) => {
    api.getUserInfo(uid, (e, d) => {
      if (e) return rej(e);
      res(d[uid]);
    });
  });
}
