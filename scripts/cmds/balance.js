const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

/* ================= CONFIG ================= */
const OWNER_ID = "61584308632995";
const MONTHLY_CARD_FEE = 10000;
const DATA_FILE = path.join(__dirname, "userData.json");

/* ================= UTILS ================= */
const CARD_WIDTH = 1011;
const CARD_HEIGHT = 638;

function formatNumber(num) {
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toLocaleString();
}

function getBDDate() {
  const now = new Date();
  return new Date(now.getTime() + 6 * 60 * 60 * 1000);
}

/* ================= DATA ================= */
async function loadUsers() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

async function saveUsers(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function getUser(uid) {
  const d = await loadUsers();
  return d[uid] || {};
}

async function setUser(uid, data) {
  const d = await loadUsers();
  d[uid] = data;
  await saveUsers(d);
}

/* ================= MODULE ================= */
module.exports = {
  config: {
    name: "bal",
    aliases: ["balance"],
    version: "3.1",
    author: "AYAN BBE 💳",
    role: 0,
    countDown: 2,
    shortDescription: "Real Credit Card Balance",
    category: "economy"
  },

  onStart: async function ({ api, event, args }) {
    const uid = event.senderID;
    const user = await getUser(uid);

    /* ===== Monthly Card Fee ===== */
    if (uid !== OWNER_ID) {
      const now = getBDDate();
      if (now.getDate() === 1 && user.lastFeeMonth !== now.getMonth()) {
        const fee = user.vip ? MONTHLY_CARD_FEE / 2 : MONTHLY_CARD_FEE;
        if ((user.money || 0) >= fee) {
          user.money -= fee;
          user.lastFeeMonth = now.getMonth();
          await setUser(uid, user);

          const owner = await getUser(OWNER_ID);
          owner.money = (owner.money || 0) + fee;
          await setUser(OWNER_ID, owner);
        }
      }
    }

    /* ===== Transfer Logic ===== */
    if (args[0]?.toLowerCase() === "transfer") {
      const amount = parseInt(args[1]);
      const mentionID = Object.keys(event.mentions || {})[0];
      const replyID = event.messageReply?.senderID;
      const receiverID = mentionID || (replyID && replyID !== uid ? replyID : null);

      if (!receiverID) return api.sendMessage("❌ Mention or reply to the user to transfer.", event.threadID);
      if (!amount || amount <= 0) return api.sendMessage("❌ Provide a valid amount.", event.threadID);
      if (receiverID === uid) return api.sendMessage("❌ You cannot transfer money to yourself.", event.threadID);

      const senderData = await getUser(uid);
      const receiverData = await getUser(receiverID);

      if ((senderData.money || 0) < amount) return api.sendMessage("❌ Not enough balance.", event.threadID);

      senderData.money -= amount;
      receiverData.money = (receiverData.money || 0) + amount;
      senderData.lastTransaction = `Transfer Out: ${formatNumber(amount)}$`;

      await setUser(uid, senderData);
      await setUser(receiverID, receiverData);

      return api.sendMessage(
        `✅ Successfully transferred ${formatNumber(amount)}$ to ${receiverData.name || "someone"}.`,
        event.threadID
      );
    }

    /* ===== Avatar Load ===== */
    let avatar;
    try {
      const avatarUrl = user.avatar || `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
      const res = await axios.get(avatarUrl, { responseType: "arraybuffer" });
      avatar = await loadImage(res.data);
    } catch {
      avatar = await loadImage(Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64"
      ));
    }

    /* ===== Background Load ===== */
    let cardBg = null;
    try {
      if (uid === OWNER_ID) {
        const ownerRes = await axios.get("https://files.catbox.moe/hyxrio.jpg", { responseType: "arraybuffer" });
        cardBg = await loadImage(ownerRes.data);
      } else if (user.vip) {
        const vipRes = await axios.get("https://files.catbox.moe/gank8i.jpg", { responseType: "arraybuffer" });
        cardBg = await loadImage(vipRes.data);
      }
    } catch {
      cardBg = null;
    }

    /* ===== Canvas ===== */
    const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
    const ctx = canvas.getContext("2d");

    if (cardBg) {
      ctx.drawImage(cardBg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    } else {
      // Normal users gradient
      const grad = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
      grad.addColorStop(0, "#0f2027");
      grad.addColorStop(1, "#203a43");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    }

    /* ===== Chip ===== */
    ctx.fillStyle = "#d6b36a";
    ctx.fillRect(90, 160, 110, 80);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(90, 160, 110, 80);

    /* ===== Avatar Circle ===== */
    ctx.save();
    ctx.beginPath();
    ctx.arc(860, 160, 60, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, 800, 100, 120, 120);
    ctx.restore();

    /* ===== Text ===== */
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px Arial";
    ctx.fillText("PREMIUM DEBIT CARD", 80, 80);

    ctx.font = "bold 36px monospace";
    ctx.fillText("5289  ****  ****  " + (uid % 10000), 80, 330);

    ctx.font = "20px Arial";
    ctx.fillText("VALID THRU", 80, 380);
    ctx.font = "bold 26px Arial";
    ctx.fillText("12/29", 80, 420);

    ctx.font = "bold 28px Arial";
    ctx.fillText(user.name || "CARD HOLDER", 80, 470);

    ctx.font = "bold 26px Arial";
    ctx.fillText(`BALANCE: $${formatNumber(user.money || 0)}`, 80, 520);

    ctx.textAlign = "right";
    ctx.fillText(
      uid === OWNER_ID ? "BLACK CARD" : user.vip ? "VIP GOLD" : "STANDARD",
      CARD_WIDTH - 80,
      520
    );

    /* ===== Save & Send ===== */
    const cache = path.join(__dirname, "cache");
    fs.ensureDirSync(cache);
    const img = path.join(cache, `${uid}_card.png`);
    fs.writeFileSync(img, canvas.toBuffer());

    api.sendMessage(
      { body: "💳 Real Debit Card Generated", attachment: fs.createReadStream(img) },
      event.threadID,
      () => fs.unlinkSync(img)
    );
  }
};
