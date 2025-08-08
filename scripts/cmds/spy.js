const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "spy",
    version: "3.5",
    author: "TAREK",
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
      if (/^\d+$/.test(args[0])) {
        uid = args[0];
      } else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) uid = match[1];
      }
    }

    if (!uid) {
      uid = event.type === "message_reply"
        ? event.messageReply.senderID
        : uid2 || uid1;
    }

    try {
      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo(uid, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      const avatarUrl = await usersData.getAvatarUrl(uid);
      const data = await usersData.get(uid);

      const name = userInfo[uid].name || "Unknown";
      const gender = userInfo[uid].gender === 1 ? "Female" : userInfo[uid].gender === 2 ? "Male" : "Unknown";
      const isFriend = userInfo[uid].isFriend ? "Yes" : "No";
      const isBirthday = userInfo[uid].isBirthday ? "Yes" : "Private";

      const balance = data.money || 0;
      const exp = data.exp || 0;
      const level = Math.floor(0.1 * Math.sqrt(exp));

      const threadNickname = event.threadID && uid ? (await api.getThreadInfo(event.threadID)).nicknames?.[uid] : null;
      const nickname = threadNickname || "Not set in group";

      const allUsers = await usersData.getAll();
      const sortedUsers = allUsers
        .filter(user => typeof user.money === 'number')
        .sort((a, b) => b.money - a.money);
      const userRankIndex = sortedUsers.findIndex(user => user.userID === uid);
      const rankPosition = userRankIndex !== -1 ? `Rank ${userRankIndex + 1}` : "Unranked";

      // Create Canvas
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext("2d");

      // Light Black / Dark Gray Background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#2c2c2c");  // Dark Gray top
      gradient.addColorStop(1, "#1a1a1a");  // Darker Gray bottom
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load and Draw Circular Avatar with White Border
      const avatar = await loadImage(avatarUrl);
      const centerX = canvas.width / 2;
      const centerY = 130;
      const radius = 75;

      // White border circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2, true);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Avatar circle (clipped)
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
      ctx.restore();

      // Text Style
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${name}'s Profile`, centerX, 260);

      ctx.font = "20px Arial";
      ctx.textAlign = "left";

      // Left Column Info
      const leftStartX = 80;
      const leftStartY = 310;
      const lineHeight = 35;

      ctx.fillText(`UID: ${uid}`, leftStartX, leftStartY);
      ctx.fillText(`Nickname: ${nickname}`, leftStartX, leftStartY + lineHeight);
      ctx.fillText(`Balance: $${balance}`, leftStartX, leftStartY + lineHeight * 2);
      ctx.fillText(`EXP: ${exp}`, leftStartX, leftStartY + lineHeight * 3);
      ctx.fillText(`Level: ${level}`, leftStartX, leftStartY + lineHeight * 4);

      // Right Column Info
      const rightStartX = 430;
      ctx.fillText(`Rank: ${rankPosition}`, rightStartX, leftStartY);
      ctx.fillText(`Gender: ${gender}`, rightStartX, leftStartY + lineHeight);
      ctx.fillText(`Birthday: ${isBirthday}`, rightStartX, leftStartY + lineHeight * 2);
      ctx.fillText(`Friend Status: ${isFriend}`, rightStartX, leftStartY + lineHeight * 3);

      // Save Image
      const outputPath = path.join(__dirname, "tmp", `profile_${uid}.png`);
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      out.on("finish", () => {
        message.reply({
          body: `Here's ${name}'s profile 👤`,
          attachment: fs.createReadStream(outputPath),
        });
      });
    } catch (e) {
      console.error(e);
      return message.reply("⚠️ Could not fetch user data.");
    }
  },
};
