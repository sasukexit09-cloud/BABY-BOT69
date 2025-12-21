const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "fakechat",
    aliases: ["fc"],
    version: "FINAL-ONLINE",
    author: "🥵AYAN BBE🥵💋",
    category: "fun",
    guide: "Reply → {p}fc Hi | How are you?"
  },

  onStart: async function ({ event, message, api, args }) {
    if (event.type !== "message_reply")
      return message.reply("❌ Reply করে fc command দাও");

    const uid = event.messageReply.senderID;
    const texts = args.join(" ").split("|").map(t => t.trim());

    try {
      /* ===== USER INFO ===== */
      const userInfo = await getUserInfo(api, uid);

      /* ===== REAL FB AVATAR ===== */
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
      let avatarImg;
      try {
        avatarImg = await loadImage(avatarUrl);
      } catch {
        avatarImg = await loadImage("https://i.imgur.com/6VBx3io.png");
      }

      /* ===== FONT ===== */
      const fontPath = path.join(__dirname, "MessengerFont.ttf");
      if (!fs.existsSync(fontPath)) {
        await downloadFile(
          "https://drive.google.com/uc?export=download&id=1MYZkDHgHtGgyVEf2bFrOc0A-tlFvzYqL",
          fontPath
        );
      }
      registerFont(fontPath, { family: "Messenger" });

      /* ===== CANVAS SETUP ===== */
      const canvasWidth = 820;
      const lineHeight = 28;
      const bubblePadX = 18;
      const bubblePadY = 14;
      const gapY = 22;
      let y = 90;

      const tempCtx = createCanvas(1, 1).getContext("2d");
      tempCtx.font = "24px Messenger";

      const maxBubbleWidth = canvasWidth - 240;
      const bubbles = [];

      for (const text of texts) {
        const lines = wrapText(tempCtx, text, maxBubbleWidth - bubblePadX * 2);
        const textWidth = Math.max(...lines.map(l => tempCtx.measureText(l).width));
        bubbles.push({
          lines,
          width: textWidth + bubblePadX * 2,
          height: lines.length * lineHeight + bubblePadY * 2
        });
      }

      const canvasHeight =
        bubbles.reduce((s, b) => s + b.height + gapY, 0) + 140;

      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      /* ===== DARK MESSENGER BG ===== */
      ctx.fillStyle = "#0f1115";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const bubble of bubbles) {
        /* name */
        ctx.fillStyle = "#b0b3b8";
        ctx.font = "16px Messenger";
        ctx.fillText(userInfo.name.split(" ")[0], 92, y - 8);

        /* bubble */
        ctx.fillStyle = "#2a2d31";
        roundRect(ctx, 92, y, bubble.width, bubble.height, 22);

        /* text (perfect center) */
        ctx.fillStyle = "#e4e6eb";
        ctx.font = "24px Messenger";
        ctx.textBaseline = "middle";

        const totalTextHeight = bubble.lines.length * lineHeight;
        let ty = y + bubble.height / 2 - totalTextHeight / 2 + lineHeight / 2;

        for (const line of bubble.lines) {
          ctx.fillText(line, 92 + bubblePadX, ty);
          ty += lineHeight;
        }

        /* avatar */
        const avatarCenterY = y + bubble.height / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(55, avatarCenterY, 22, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, 33, avatarCenterY - 22, 44, 44);
        ctx.restore();

        /* active dot */
        ctx.beginPath();
        ctx.arc(68, avatarCenterY + 14, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#31a24c";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(68, avatarCenterY + 14, 7.5, 0, Math.PI * 2);
        ctx.strokeStyle = "#0f1115";
        ctx.lineWidth = 3;
        ctx.stroke();

        y += bubble.height + gapY;
      }

      /* ===== SEND ===== */
      const file = path.join(__dirname, `fc_${Date.now()}.png`);
      fs.writeFileSync(file, canvas.toBuffer());

      message.reply(
        { attachment: fs.createReadStream(file) },
        () => fs.unlinkSync(file)
      );

    } catch (e) {
      console.error(e);
      message.reply("❌ Fake Messenger generate failed");
    }
  }
};

/* ===== HELPERS ===== */

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
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
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(p, res.data);
}

function getUserInfo(api, uid) {
  return new Promise((res, rej) => {
    api.getUserInfo(uid, (e, d) => {
      if (e) return rej(e);
      res(d[uid]);
    });
  });
}