const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

/* ================= CONFIG ================= */
const DATA_FILE = path.join(__dirname, "balanceData.json");

/* ================= UTILS ================= */
function format(num) {
  return (num || 0).toLocaleString();
}

/* ================= DATABASE ================= */
function loadDB() {
  if (!fs.existsSync(DATA_FILE)) fs.writeJsonSync(DATA_FILE, {});
  return fs.readJsonSync(DATA_FILE);
}

function saveDB(db) {
  fs.writeJsonSync(DATA_FILE, db, { spaces: 2 });
}

/* ================= MODULE ================= */
module.exports = {
  config: {
    name: "bal",
    aliases: ["balance"],
    version: "4.0",
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴",
    role: 0,
    category: "economy"
  },

  onStart: async function ({ api, event }) {
    const db = loadDB();

    // target detect (self / reply / mention)
    let targetID = event.senderID;
    if (event.messageReply) targetID = event.messageReply.senderID;
    else if (Object.keys(event.mentions).length)
      targetID = Object.keys(event.mentions)[0];

    if (!db[targetID]) {
      db[targetID] = {
        name: "User",
        balance: 1000
      };
      saveDB(db);
    }

    const user = db[targetID];
    const name =
      event.mentions[targetID] ||
      (await api.getUserInfo(targetID))[targetID]?.name ||
      "User";

    user.name = name;
    saveDB(db);

    /* ===== PROFILE PIC ===== */
    let avatar;
    try {
      const url = `https://graph.facebook.com/${targetID}/picture?height=512&width=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(url, { responseType: "arraybuffer" });
      avatar = await loadImage(res.data);
    } catch {
      avatar = null;
    }

    /* ===== CANVAS ===== */
    const canvas = createCanvas(900, 500);
    const ctx = canvas.getContext("2d");

    // background
    const grad = ctx.createLinearGradient(0, 0, 900, 500);
    grad.addColorStop(0, "#050b1f");
    grad.addColorStop(1, "#020617");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 500);

    /* ===== NEON AVATAR CIRCLE ===== */
    const cx = 150, cy = 250, r = 75;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,120,255,0.4)";
    ctx.lineWidth = 12;
    ctx.shadowColor = "#0066ff";
    ctx.shadowBlur = 40;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    if (avatar) ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    /* ===== TEXT (TYPEWRITER STYLE) ===== */
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px monospace";
    ctx.fillText("USER BALANCE CARD", 300, 80);

    ctx.font = "22px monospace";
    ctx.fillText(`NAME    : ${name}`, 300, 180);
    ctx.fillText(`UID     : ${targetID}`, 300, 230);
    ctx.fillText(`BALANCE : $${format(user.balance)}`, 300, 280);

    /* ===== SAVE & SEND ===== */
    const cache = path.join(__dirname, "cache");
    fs.ensureDirSync(cache);
    const imgPath = path.join(cache, `${targetID}_bal.png`);
    fs.writeFileSync(imgPath, canvas.toBuffer());

    api.sendMessage(
      {
        body:
          `💳 𝙱𝙰𝙱𝚈 𝚈𝙾𝚄𝚁 𝙱𝙰𝙻𝙰𝙽𝙲𝙴 𝙸𝙽𝙵𝙾 💸\n\n` +
          `👤 𝙽𝙰𝙼𝙴: ${name}\n` +
          `🆔 𝚄𝙸𝙳: ${targetID}\n` +
          `💰 𝙱𝙰𝙻𝙰𝙽𝙲𝙴: $${format(user.balance)}`,
        attachment: fs.createReadStream(imgPath)
      },
      event.threadID,
      () => fs.unlinkSync(imgPath)
    );
  }
};
