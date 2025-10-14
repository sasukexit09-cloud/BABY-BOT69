const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "spy",
    version: "5.3",
    author: "TAREK x ASIF",
    countDown: 5,
    role: 0,
    shortDescription: "See detailed user info",
    longDescription:
      "Fetch full profile info including name, UID, gender, balance, and more with balanced galaxy background and smooth glow.",
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
      uid =
        event.type === "message_reply"
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

      let username = "unknown_user";
      if (userInfo[uid]?.vanity) {
        username = userInfo[uid].vanity;
      } else if (userInfo[uid]?.profileUrl) {
        const match = userInfo[uid].profileUrl.match(/facebook\.com\/([^/?]+)/);
        if (match) username = match[1];
      } else {
        username = name.replace(/\s+/g, "_").toLowerCase();
      }

      const gender =
        userInfo[uid].gender === 1
          ? "Female"
          : userInfo[uid].gender === 2
          ? "Male"
          : "Unknown";

      const isFriend = userInfo[uid].isFriend ? "Yes" : "No";
      const isBirthday = userInfo[uid].isBirthday ? "Yes" : "Private";
      const balance = data.money || 0;
      const exp = data.exp || 0;

      let nickname = "N/A";
      const threadInfo = event.threadID
        ? await api.getThreadInfo(event.threadID)
        : null;
      const threadNickname = threadInfo?.nicknames?.[uid] || null;

      if (data?.nickname && data.nickname.trim() !== "") {
        nickname = data.nickname;
      } else if (threadNickname) {
        nickname = threadNickname;
      }

      const allUsers = await usersData.getAll();
      const sortedMoneyUsers = allUsers
        .filter((u) => typeof u.money === "number")
        .sort((a, b) => b.money - a.money);
      const moneyRankIndex = sortedMoneyUsers.findIndex(
        (u) => u.userID === uid
      );
      const moneyRank =
        moneyRankIndex !== -1 ? `#${moneyRankIndex + 1}` : "Unranked";

      const sortedExpUsers = allUsers
        .filter((u) => typeof u.exp === "number")
        .sort((a, b) => b.exp - a.exp);
      const expRankIndex = sortedExpUsers.findIndex((u) => u.userID === uid);
      const expRank =
        expRankIndex !== -1 ? `#${expRankIndex + 1}` : "Unranked";

      const infinityMoney = `$${formatBalance(balance)}`;

      // --- Canvas Section ---
      const WIDTH = 550;
      const HEIGHT = 850;
      const PADDING = 20;
      const BOX_HEIGHT = 45;
      const BOX_GAP = 5;
      const BOX_START_Y = 320;

      const NEON_COLOR = "#ff00ff";
      const TEXT_COLOR = "#ffffff";
      const GOLD = "#ffd700";

      const canvas = createCanvas(WIDTH, HEIGHT);
      const ctx = canvas.getContext("2d");

      // 🌌 Darker Galaxy Gradient
      const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
      gradient.addColorStop(0, "#050012"); // very dark top
      gradient.addColorStop(0.25, "#120025");
      gradient.addColorStop(0.55, "#2a003f");
      gradient.addColorStop(1, "#3b0060"); // deep purple bottom
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // ✨ More Stars (≈ 320)
      for (let i = 0; i < 320; i++) {
        const x = Math.random() * WIDTH;
        const y = Math.random() * HEIGHT;
        // avoid crowding lower-left area near avatar if desired (keeps face clear)
        if (x < 150 && y > HEIGHT * 0.7) continue;
        const radius = Math.random() * 1.4;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        const alpha = 0.15 + Math.random() * 0.85; // variety in brightness
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      // 🔲 Border (no glow)
      ctx.strokeStyle = NEON_COLOR;
      ctx.lineWidth = 5;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(4, 4, WIDTH - 8, HEIGHT - 8, 10);
      } else {
        // fallback rounded rect
        const x = 4,
          y = 4,
          w = WIDTH - 8,
          h = HEIGHT - 8,
          r = 10;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
      }
      ctx.stroke();

      // 🌈 Avatar Hexagon border (no glow)
      const drawHexagon = (ctx, x, y, size, colors) => {
        const points = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = x + size * Math.cos(angle);
          const py = y + size * Math.sin(angle);
          points.push({ x: px, y: py });
        }

        ctx.lineWidth = 5;
        for (let i = 0; i < 6; i++) {
          const start = points[i];
          const end = points[(i + 1) % 6];
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.strokeStyle = colors[i];
          ctx.stroke();
        }
      };

      const avatarSize = 90;
      const avatarCenterX = WIDTH / 2;
      const avatarCenterY = 130;
      const avatar = await loadImage(avatarUrl);

      const borderColors = [
        "#ff007f",
        "#ff6600",
        "#ffff00",
        "#00ff00",
        "#00ffff",
        "#6600ff",
      ];

      drawHexagon(ctx, avatarCenterX, avatarCenterY, avatarSize + 6, borderColors);

      // Avatar Mask (hexagon)
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = avatarCenterX + avatarSize * Math.cos(angle);
        const py = avatarCenterY + avatarSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(
        avatar,
        avatarCenterX - avatarSize,
        avatarCenterY - avatarSize,
        avatarSize * 2,
        avatarSize * 2
      );
      ctx.restore();

      // Name (no glow)
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(name, avatarCenterX, 250);

      // --- Info Box ---
      const drawInfoBox = (y, icon, label, value) => {
        const R = 5;
        const BOX_WIDTH = WIDTH - PADDING * 2;
        const x = PADDING;

        ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, BOX_WIDTH, BOX_HEIGHT, R);
        } else {
          // fallback rounded rect path
          const r = R;
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + BOX_WIDTH - r, y);
          ctx.quadraticCurveTo(x + BOX_WIDTH, y, x + BOX_WIDTH, y + r);
          ctx.lineTo(x + BOX_WIDTH, y + BOX_HEIGHT - r);
          ctx.quadraticCurveTo(x + BOX_WIDTH, y + BOX_HEIGHT, x + BOX_WIDTH - r, y + BOX_HEIGHT);
          ctx.lineTo(x + r, y + BOX_HEIGHT);
          ctx.quadraticCurveTo(x, y + BOX_HEIGHT, x, y + BOX_HEIGHT - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
        }
        ctx.fill();

        ctx.strokeStyle = NEON_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, BOX_WIDTH, BOX_HEIGHT, R);
        } else {
          // reuse fallback path
          const r = R;
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + BOX_WIDTH - r, y);
          ctx.quadraticCurveTo(x + BOX_WIDTH, y, x + BOX_WIDTH, y + r);
          ctx.lineTo(x + BOX_WIDTH, y + BOX_HEIGHT - r);
          ctx.quadraticCurveTo(x + BOX_WIDTH, y + BOX_HEIGHT, x + BOX_WIDTH - r, y + BOX_HEIGHT);
          ctx.lineTo(x + r, y + BOX_HEIGHT);
          ctx.quadraticCurveTo(x, y + BOX_HEIGHT, x, y + BOX_HEIGHT - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
        }
        ctx.stroke();

        ctx.fillStyle = GOLD;
        ctx.font = `bold 18px Arial`;
        ctx.textAlign = "left";
        ctx.fillText(`${icon} ${label} :`, x + 15, y + 28);

        ctx.fillStyle = TEXT_COLOR;
        ctx.textAlign = "right";
        ctx.font = `bold 22px Arial`;
        ctx.fillText(value, x + BOX_WIDTH - 15, y + 28);
      };

      const infoList = [
        { label: "UID", icon: "🆔", value: uid },
        { label: "Username", icon: "🌐", value: username.substring(0, 30) },
        { label: "Gender", icon: "🚻", value: gender },
        { label: "Type", icon: "👤", value: "User" },
        { label: "Birthday", icon: "🎂", value: isBirthday },
        { label: "Nickname", icon: "💬", value: nickname.substring(0, 30) },
        { label: "Bot Friend", icon: "🤖", value: isFriend },
        { label: "Money", icon: "💰", value: infinityMoney },
      ];

      infoList.forEach((info, i) =>
        drawInfoBox(
          BOX_START_Y + i * (BOX_HEIGHT + BOX_GAP),
          info.icon,
          info.label,
          info.value
        )
      );

      const RANK_START_Y =
        BOX_START_Y + infoList.length * (BOX_HEIGHT + BOX_GAP);
      drawInfoBox(RANK_START_Y, "📈", "XP Rank", expRank);
      drawInfoBox(
        RANK_START_Y + BOX_HEIGHT + BOX_GAP,
        "🏦",
        "Money Rank",
        moneyRank
      );

      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const outputPath = path.join(tmpDir, `profile_${uid}.png`);
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      out.on("finish", () => {
        message.reply(
          { body: "", attachment: fs.createReadStream(outputPath) },
          () => {
            try {
              fs.unlinkSync(outputPath);
            } catch (err) {
              // ignore unlink errors
            }
          }
        );
      });
    } catch (e) {
      console.error(e);
      message.reply("⚠️ ইউজার ডাটা ফেচ করতে সমস্যা হয়েছে!");
    }
  },
};

// --- Number Shortening Functions (..D supported, no Infinity) ---
const units = ["", "K", "M", "B", "T", "Q", "S", "O", "N", "D"];
function shortenNumber(num) {
  if (typeof num !== "number") return "0";
  if (num < 1000) return Math.floor(num).toString();
  let unitIndex = 0;
  let n = num;
  while (n >= 1000 && unitIndex < units.length - 1) {
    n /= 1000;
    unitIndex++;
  }

  if (units[unitIndex] === "D") {
    const shortNum = Math.floor(num).toString().slice(0, 4);
    return shortNum + "..D";
  }

  return n.toFixed(2).replace(/\.?0+$/, "") + units[unitIndex];
}

function formatBalance(num) {
  return shortenNumber(num);
        }
