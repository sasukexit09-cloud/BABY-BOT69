const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const deltaNext = 5;

// ===== EXP SYSTEM =====
function expToLevel(exp) {
  return Math.floor((1 + Math.sqrt(1 + (8 * exp) / deltaNext)) / 2);
}
function levelToExp(level) {
  return Math.floor(((level * level - level) * deltaNext) / 2);
}

// ===== COLORS =====
function getRandomColor() {
  const c = ["#ff004c", "#00ffff", "#9d00ff", "#ffae00"];
  return c[Math.floor(Math.random() * c.length)];
}

// ===== CHECKS =====
const isVIP = (id, list) => list.includes(id);
const isOwner = (id, list) => list.includes(id);

// ===== ASSETS =====
const crowns = {
  1: "https://files.catbox.moe/52kvd0.jpg",
  2: "https://files.catbox.moe/sshlh8.jpg",
  3: "https://files.catbox.moe/4t89md.jpg"
};

const vipBadgeUrl = "https://files.catbox.moe/46spgx.jpeg";
const ownerBadgeUrl = "https://files.catbox.moe/2fts8y.jpg";
const fallbackAvatar = "https://i.imgur.com/6VBx3io.png";

const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

// ===== HELPER =====
async function getAvatar(uid) {
  try {
    const url = `https://graph.facebook.com/${uid}/picture?width=1500&height=1500&access_token=${FB_TOKEN}`;
    return await Canvas.loadImage(url);
  } catch {
    return await Canvas.loadImage(fallbackAvatar);
  }
}

// ===== RANK COMMAND =====
module.exports = {
  config: {
    name: "rank",
    aliases: ["rank", "level"],
    version: "5.1",
    author: "Chitron Bhattacharjee + Maya",
    role: 0,
    category: "ranking",
    shortDescription: { en: "Neon Dark Rank Card" }
  },

  onChat: async function ({ message, event, usersData }) {
    const body = (event.body || "").toLowerCase().trim();
    if (!["rank", "level"].includes(body)) return;

    const userID = event.senderID;
    const userData = (await usersData.get(userID)) || {};
    const exp = Number(userData.exp || 0);
    const name = userData.name || "User";

    // ===== ALL USERS =====
    const all = await usersData.getAll();
    const list = Array.isArray(all)
      ? all
      : Object.keys(all).map(id => ({ userID: id, ...all[id] }));

    list.sort((a, b) => (b.exp || 0) - (a.exp || 0));
    const rank = list.findIndex(u => u.userID == userID) + 1 || list.length;

    const level = expToLevel(exp);
    const minExp = levelToExp(level);
    const maxExp = levelToExp(level + 1);
    const currentExp = exp - minExp;
    const neededExp = Math.max(1, maxExp - minExp);

    // ===== AVATAR =====
    const avatar = await getAvatar(userID);

    // ===== CANVAS =====
    const canvas = Canvas.createCanvas(600, 180);
    const ctx = canvas.getContext("2d");

    // ===== NEON DARK BACKGROUND =====
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#050014");
    bg.addColorStop(0.5, "#0a0028");
    bg.addColorStop(1, "#000000");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ===== NEON BORDER =====
    ctx.save();
    ctx.shadowColor = "#ff004c";
    ctx.shadowBlur = 25;
    ctx.strokeStyle = "#9d00ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.restore();

    // ===== AVATAR CIRCLE =====
    const cx = 90, cy = 90, r = 55;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = getRandomColor();
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    // ===== CROWN =====
    if (rank <= 3 && crowns[rank]) {
      try {
        const crown = await Canvas.loadImage(crowns[rank]);
        ctx.drawImage(crown, cx - 30, cy - r - 32, 60, 60);
      } catch {}
    }

    // ===== BADGE =====
    const vipList = (await usersData.getVIPList?.()) || [];
    const ownerList = (await usersData.getOwnerList?.()) || [];

    const badgeUrl = isOwner(userID, ownerList)
      ? ownerBadgeUrl
      : isVIP(userID, vipList)
      ? vipBadgeUrl
      : null;

    if (badgeUrl) {
      try {
        const badge = await Canvas.loadImage(badgeUrl);
        ctx.drawImage(badge, 520, 10, 60, 60);
      } catch {}
    }

    // ===== TEXT =====
    ctx.save();
    ctx.shadowColor = "#ff00ff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial";
    ctx.fillText(name, 170, 45);
    ctx.restore();

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Level: ${level}`, 170, 78);
    ctx.fillText(`Rank: #${rank}/${list.length}`, 170, 105);

    // ===== EXP BAR =====
    const barX = 170, barY = 125, barW = 330, barH = 18;
    ctx.fillStyle = "#222";
    ctx.fillRect(barX, barY, barW, barH);

    const filled = Math.min(barW, (currentExp / neededExp) * barW);
    ctx.save();
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(barX, barY, filled, barH);
    ctx.restore();

    ctx.font = "14px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`EXP: ${currentExp}/${neededExp}`, barX, barY + 35);

    // ===== SAVE IMAGE =====
    const imgPath = path.join(__dirname, "cache", `rank_${userID}.png`);
    await fs.ensureDir(path.dirname(imgPath));
    await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

    return message.reply({
      body: "🔥 Neon Rank Card",
      attachment: fs.createReadStream(imgPath)
    });
  }
};
