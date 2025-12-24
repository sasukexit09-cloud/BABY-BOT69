const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "spy2",
    version: "3.6",
    author: "AYAN",
    countDown: 5,
    role: 0,
    shortDescription: "See detailed user info",
    longDescription: "Fetch full profile info including name, UID, gender, balance, and more.",
    category: "image",
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    const uid1 = event.senderID;
    const uid2 = Object.keys(event.mentions || {})[0];
    let uid;

    if (args[0]) {
      if (/^\d+$/.test(args[0])) uid = args[0];
      else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) uid = match[1];
      }
    }
    if (!uid) uid = event.type === "message_reply" ? event.messageReply.senderID : uid2 || uid1;

    try {
      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo(uid, (err, result) => (err ? reject(err) : resolve(result)));
      });
      const data = await usersData.get(uid);

      const name = userInfo[uid].name || "Unknown";
      const gender = userInfo[uid].gender === 1 ? "Female" : userInfo[uid].gender === 2 ? "Male" : "Unknown";
      const isFriend = userInfo[uid].isFriend ? "Yes" : "No";
      const isBirthday = userInfo[uid].isBirthday ? "Yes" : "Private";

      const balance = data.money || 0;
      const exp = data.exp || 0;
      const level = Math.floor(0.1 * Math.sqrt(exp));

      const threadNickname = event.threadID && uid ? (await api.getThreadInfo(event.threadID)).nicknames?.[uid] : null;
      const nickname = data.nickname || threadNickname || "Not set in group";

      const allUsers = await usersData.getAll();
      const rank = getRank(allUsers, uid, "money");

      // --- Canvas ---
      const WIDTH = 800;
      const HEIGHT = 600;
      const canvas = createCanvas(WIDTH, HEIGHT);
      const ctx = canvas.getContext("2d");

      // Gradient Background
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      gradient.addColorStop(0, "#2c2c2c");
      gradient.addColorStop(1, "#1a1a1a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Avatar
      const avatarUrl = await usersData.getAvatarUrl(uid);
      const avatar = await safeLoadAvatar(avatarUrl);
      const centerX = WIDTH / 2;
      const centerY = 130;
      const radius = 75;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
      ctx.restore();

      // Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${name}'s Profile`, centerX, 260);

      // Info columns
      const leftX = 80, rightX = 430, startY = 310, lineH = 35;
      const leftData = [
        `UID: ${uid}`,
        `Nickname: ${nickname}`,
        `Balance: $${balance}`,
        `EXP: ${exp}`,
        `Level: ${level}`
      ];
      const rightData = [
        `Rank: ${rank}`,
        `Gender: ${gender}`,
        `Birthday: ${isBirthday}`,
        `Friend Status: ${isFriend}`
      ];
      ctx.font = "20px Arial";
      ctx.textAlign = "left";
      leftData.forEach((txt, i) => ctx.fillText(txt, leftX, startY + i * lineH));
      rightData.forEach((txt, i) => ctx.fillText(txt, rightX, startY + i * lineH));

      // Save
      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);
      const outputPath = path.join(tmpDir, `profile_${uid}.png`);
      fs.writeFileSync(outputPath, canvas.toBuffer());

      message.reply({ body: `Here's ${name}'s profile 👤`, attachment: fs.createReadStream(outputPath) }, () => {
        try { fs.unlinkSync(outputPath); } catch {}
      });

    } catch (e) {
      console.error(e);
      message.reply("⚠️ Could not fetch user data.");
    }
  }
};

// --- Helpers ---
async function safeLoadAvatar(url) {
  try { return await loadImage(url); }
  catch {
    const c = createCanvas(150, 150);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#444";
    ctx.fillRect(0, 0, 150, 150);
    return c;
  }
}

function getRank(users, uid, key) {
  const sorted = users.filter(u => typeof u[key] === "number").sort((a,b)=>b[key]-a[key]);
  const idx = sorted.findIndex(u=>u.userID===uid);
  return idx !== -1 ? `#${idx+1}` : "Unranked";
}
