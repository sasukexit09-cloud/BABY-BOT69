const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const moment = require("moment-timezone");

/* ================= UTILS ================= */
function format(num) {
  return (num || 0).toLocaleString();
}

function generateTRX() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/* ================= MODULE ================= */
module.exports = {
  config: {
    name: "bal",
    aliases: ["balance", "transfer", "pay"],
    version: "6.5",
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴",
    role: 0,
    category: "economy"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, messageReply, mentions, threadID, type } = event;
    const ownerID = "61584308632995"; // Your UID

    /* ================= 💸 TRANSFER SYSTEM (WITH 5% FEE) ================= */
    if (args[0] === "transfer") {
      let targetID, amount;

      if (type === "message_reply") {
        targetID = messageReply.senderID;
        amount = parseInt(args[1]);
      } 
      else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        amount = parseInt(args[args.length - 1]);
      }

      if (!targetID || isNaN(amount) || amount <= 0) {
        return api.sendMessage("⚠️ Sothik bhabe likhun!\n\n1. Reply: !bal transfer 500\n2. Tag: !bal transfer @name 500", threadID);
      }

      if (targetID == senderID) {
        return api.sendMessage("❌ Nijer account e taka transfer kora sombhob noy!", threadID);
      }

      try {
        const senderData = await usersData.get(senderID);
        const receiverData = await usersData.get(targetID);
        const ownerData = await usersData.get(ownerID);

        // Fee Calculation (5%)
        const fee = Math.floor(amount * 0.05);
        const totalDeduct = amount + fee;

        if (senderData.money < totalDeduct) {
          return api.sendMessage(`🚫 Apnar kache jothesto taka nei!\nAmount: $${format(amount)}\nFee (5%): $${format(fee)}\nMot Proyojon: $${format(totalDeduct)}`, threadID);
        }

        const trxID = generateTRX();
        const time = moment.tz("Asia/Dhaka").format("DD/MM/YYYY | hh:mm:ss A");

        // Transaction Process
        await usersData.set(senderID, { money: senderData.money - totalDeduct });
        await usersData.set(targetID, { money: (receiverData.money || 0) + amount });
        await usersData.set(ownerID, { money: (ownerData.money || 0) + fee });

        return api.sendMessage(
          `✅ 𝚃𝚁𝙰𝙽𝚂𝙵𝙴𝚁 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻\n━━━━━━━━━━━━━━━━━━\n` +
          `👤 𝙵𝚁𝙾𝙼: ${senderData.name}\n` +
          `🎯 𝚃𝙾: ${receiverData.name}\n` +
          `💰 𝙰𝙼𝙾𝚄𝙽𝚃: $${format(amount)}\n` +
          `💸 𝙵𝙴𝙴 (𝟻%): $${format(fee)}\n` +
          `🆔 𝚃𝚁𝚇 𝙸𝙳: #TRX-${trxID}\n` +
          `📅 𝙳𝙰𝚃𝙴: ${time}\n` +
          `✨ 𝚂𝚃𝙰𝚃𝚄𝚂: Completed`, 
          threadID
        );
      } catch (err) {
        return api.sendMessage("❌ Transfer korte somossa hoyeche!", threadID);
      }
    }

    /* ================= 💳 BALANCE CARD (CANVAS) ================= */
    let targetID = senderID;
    if (messageReply) targetID = messageReply.senderID;
    else if (Object.keys(mentions).length) targetID = Object.keys(mentions)[0];

    try {
      const userData = await usersData.get(targetID);
      const name = userData.name || "User";
      const money = userData.money || 0;

      let avatar;
      try {
        const url = `https://graph.facebook.com/${targetID}/picture?height=512&width=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        avatar = await loadImage(res.data);
      } catch {
        avatar = null;
      }

      const canvas = createCanvas(900, 500);
      const ctx = canvas.getContext("2d");

      // Background
      const grad = ctx.createLinearGradient(0, 0, 900, 500);
      grad.addColorStop(0, "#050b1f");
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 900, 500);

      // Avatar Design
      const cx = 150, cy = 250, r = 75;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
      ctx.strokeStyle = money < 1000000 ? "rgba(255,0,0,0.4)" : "rgba(0,255,100,0.4)";
      ctx.lineWidth = 12;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      if (avatar) ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();

      // Card Texts
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px monospace";
      ctx.fillText("USER BALANCE CARD", 300, 80);
      ctx.font = "22px monospace";
      ctx.fillText(`NAME    : ${name}`, 300, 180);
      ctx.fillText(`UID     : ${targetID}`, 300, 230);
      ctx.fillText(`BALANCE : `, 300, 280);

      ctx.fillStyle = money < 1000000 ? "#ff4d4d" : "#2ecc71";
      ctx.fillText(`$${format(money)}`, 430, 280);

      const cache = path.join(__dirname, "cache");
      fs.ensureDirSync(cache);
      const imgPath = path.join(cache, `${targetID}_bal.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      api.sendMessage({
        body: `💳 𝙱𝙰𝙱𝚈 𝚈𝙾𝚄𝚁 𝙱𝙰𝙻𝙰𝙽𝙲𝙴 𝙸𝙽𝙵𝙾 💸\n👤 𝙽𝙰𝙼𝙴: ${name}\n💰 𝙱𝙰𝙻𝙰𝙽𝙲𝙴: $${format(money)}`,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => fs.unlinkSync(imgPath));

    } catch (e) {
      api.sendMessage("Error: Data load korte somossa hoyeche!", threadID);
    }
  }
};