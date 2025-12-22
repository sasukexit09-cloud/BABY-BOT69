const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const deltaNext = 5;

// ===== EXP SYSTEM =====
function expToLevel(exp) {
  return Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
}

function levelToExp(level) {
  return Math.floor(((level ** 2 - level) * deltaNext) / 2);
}

// ===== COLORS =====
function getRandomColor() {
  const colors = ["#FF6F61", "#6B5B95", "#88B04B", "#F7CAC9", "#92A8D1", "#955251"];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ===== CHECK FUNCTIONS =====
function isVIP(userID, vipList) {
  return vipList.includes(userID);
}

function isOwner(userID, ownerList) {
  return ownerList.includes(userID);
}

// ===== IMAGES =====
const crowns = {
  1: "https://files.catbox.moe/52kvd0.jpg",
  2: "https://files.catbox.moe/sshlh8.jpg",
  3: "https://files.catbox.moe/4t89md.jpg"
};

const vipBadgeUrl = "https://files.catbox.moe/46spgx.jpeg";
const ownerBadgeUrl = "https://files.catbox.moe/2fts8y.jpg"; // set your owner badge

// ===== RANK CARD MODULE =====
module.exports = {
  config: {
    name: "rankchat",
    version: "4.0",
    author: "Chitron Bhattacharjee + Maya",
    role: 0,
    category: "ranking",
    shortDescription: { en: "Rank card with VIP, Owner, crowns & fixed background" }
  },

  onChat: async function ({ message, event, usersData }) {
    const text = event.body?.toLowerCase() || "";
    if (!text.includes("rank") && !text.includes("level")) return;

    const userID = event.senderID;
    const userData = await usersData.get(userID) || {};
    const exp = userData.exp || 0;
    const name = userData.name || "User";

    const allUsers = await usersData.getAll();
    const sorted = allUsers.sort((a, b) => (b.exp || 0) - (a.exp || 0));
    const rank = sorted.findIndex(u => u.userID === userID) + 1;

    const level = expToLevel(exp);
    const minExp = levelToExp(level);
    const nextExp = levelToExp(level + 1);
    const currentExp = exp - minExp;
    const neededExp = nextExp - minExp;

    // ===== AVATAR =====
    let avatar;
    try {
      const avatarUrl = await usersData.getAvatarUrl(userID);
      avatar = await Canvas.loadImage(avatarUrl);
    } catch {
      avatar = await Canvas.loadImage("https://i.imgur.com/6VBx3io.png");
    }

    // ===== FIXED BACKGROUND =====
    let background;
    try {
      background = await Canvas.loadImage("https://files.catbox.moe/mrcepc.jpg"); // fixed background
    } catch {
      background = await Canvas.loadImage("https://i.imgur.com/3fJ1P48.png"); // fallback
    }

    const canvas = Canvas.createCanvas(600, 180);
    const ctx = canvas.getContext("2d");

    // Draw background
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // ===== AVATAR CIRCLE =====
    const cx = 90, cy = 90, radius = 55;
    const strokeColor = getRandomColor();

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();

    // ===== CROWN FOR TOP 3 =====
    if (rank <= 3) {
      try {
        const crown = await Canvas.loadImage(crowns[rank]);
        ctx.drawImage(crown, cx - 30, cy - radius - 30, 60, 60);
      } catch {}
    }

    // ===== BADGES (OWNER > VIP) =====
    const vipList = await usersData.getVIPList?.() || [];
    const ownerList = await usersData.getOwnerList?.() || [];

    let badgeUrl = null;
    if (isOwner(userID, ownerList)) badgeUrl = ownerBadgeUrl;
    else if (isVIP(userID, vipList)) badgeUrl = vipBadgeUrl;

    if (badgeUrl) {
      try {
        const badge = await Canvas.loadImage(badgeUrl);
        ctx.drawImage(badge, canvas.width - 70, 10, 60, 60);
      } catch {}
    }

    // ===== TEXT =====
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px Arial";
    ctx.fillText(name, 170, 50);
    ctx.font = "18px Arial";
    ctx.fillText(`Level: ${level}`, 170, 80);
    ctx.fillText(`Rank: #${rank}/${sorted.length}`, 170, 110);

    // ===== EXP BAR =====
    const barX = 170, barY = 130, barWidth = 330, barHeight = 18;
    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const filled = Math.min(barWidth, (currentExp / neededExp) * barWidth);
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(barX, barY, filled, barHeight);

    ctx.font = "14px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`EXP: ${currentExp}/${neededExp}`, barX, barY + 35);

    // ===== SAVE IMAGE =====
    const imgPath = path.join(__dirname, "cache", `rank_${userID}.png`);
    await fs.ensureDir(path.dirname(imgPath));
    await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

    return message.reply({
      body: "📊 Here's your Rank Card",
      attachment: fs.createReadStream(imgPath)
    });
  },

  onStart: async () => {}
};
