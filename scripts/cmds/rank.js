const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const deltaNext = 5;

// ========== EXP SYSTEM ==========
function expToLevel(exp) {
  return Math.floor((1 + Math.sqrt(1 + (8 * exp) / deltaNext)) / 2);
}
function levelToExp(level) {
  return Math.floor(((level * level - level) * deltaNext) / 2);
}

// ========== COLORS ==========
const COLORS = ["#ff004c", "#00ffff", "#9d00ff", "#ffae00"];
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// ========== ASSETS ==========
const crowns = {
  1: "https://files.catbox.moe/52kvd0.jpg",
  2: "https://files.catbox.moe/sshlh8.jpg",
  3: "https://files.catbox.moe/4t89md.jpg"
};
const fallbackAvatar = "https://i.imgur.com/6VBx3io.png";

// ========== AVATAR ==========
async function getAvatar(uid) {
  try {
    const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    return await Canvas.loadImage(url);
  } catch {
    return await Canvas.loadImage(fallbackAvatar);
  }
}

// ========== COMMAND ==========
module.exports = {
  config: {
    name: "rank",
    aliases: ["level"],
    version: "FULL",
    author: "𝙰𝚈𝙰𝙽 + Maya",
    role: 0,
    category: "ranking",
    shortDescription: { en: "Rank image + text" }
  },

  onStart: async function ({ message, event, usersData }) {

    // ===== TARGET USER DETECT =====
    let targetID = event.senderID;

    if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else if (event.messageReply) {
      targetID = event.messageReply.senderID;
    }

    // ===== USER DATA =====
    const userData = (await usersData.get(targetID)) || {};
    const name = userData.name || "User";
    const exp = Number(userData.exp || 0);
    const balance =
      userData.money ??
      userData.balance ??
      userData.coins ??
      0;

    // ===== LEADERBOARD =====
    const all = await usersData.getAll();
    const list = Object.keys(all).map(id => ({
      id,
      exp: Number(all[id].exp || 0)
    }));

    list.sort((a, b) => b.exp - a.exp);

    const rank =
      list.findIndex(u => u.id == targetID) + 1 || list.length;

    const total = list.length;

    // ===== LEVEL =====
    const level = expToLevel(exp);
    const minExp = levelToExp(level);
    const maxExp = levelToExp(level + 1);
    const curExp = exp - minExp;
    const needExp = Math.max(1, maxExp - minExp);

    // ===== IMAGE =====
    const avatar = await getAvatar(targetID);
    const canvas = Canvas.createCanvas(600, 180);
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, 600, 180);
    bg.addColorStop(0, "#050014");
    bg.addColorStop(1, "#000000");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 600, 180);

    ctx.save();
    ctx.shadowColor = "#ff004c";
    ctx.shadowBlur = 25;
    ctx.strokeStyle = "#9d00ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, 584, 164);
    ctx.restore();

    const cx = 90, cy = 90, r = 55;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = randomColor();
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    if (rank <= 3 && crowns[rank]) {
      const crown = await Canvas.loadImage(crowns[rank]);
      ctx.drawImage(crown, cx - 30, cy - r - 32, 60, 60);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px monospace";
    ctx.fillText(name, 170, 45);

    ctx.font = "18px monospace";
    ctx.fillText(`Level: ${level}`, 170, 78);
    ctx.fillText(`Rank: #${rank}/${total}`, 170, 105);

    const barX = 170, barY = 125, barW = 330, barH = 18;
    ctx.fillStyle = "#222";
    ctx.fillRect(barX, barY, barW, barH);

    const fill = Math.min(barW, (curExp / needExp) * barW);
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(barX, barY, fill, barH);

    // ===== SAVE IMAGE =====
    const imgPath = path.join(__dirname, "cache", `rank_${targetID}.png`);
    await fs.ensureDir(path.dirname(imgPath));
    await fs.writeFile(imgPath, canvas.toBuffer());

    // ===== TYPEWRITER TEXT =====
    const text =
`🍓 𝙱𝙰𝙱𝚈 𝚄𝚁 𝚁𝙰𝙽𝙺 𝙸𝙽𝙵𝙾 🍓
──────────────────
𝙽𝙰𝙼𝙴  : ${name}
𝚄𝙸𝙳   : ${targetID}
𝙻𝙴𝚅𝙴𝙻 : ${level}
𝚁𝙰𝙽𝙺  : ${rank}/${total}
𝙱𝙰𝙻   : ${balance}
──────────────────`;

    return message.reply({
      body: "```" + text + "```",
      attachment: fs.createReadStream(imgPath)
    });
  }
};
