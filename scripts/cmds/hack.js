const { loadImage, createCanvas } = require("canvas");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "hack",
    author: "Team Calyx // Eren",
    countDown: 0,
    role: 0,
    shortDescription: {
      en: "Generates a 'hacking' image with the user's profile picture. (VIP only)",
    },
    category: "𝗙𝗨𝗡",
  },

  // 🔐 VIP CHECK
  isVIP: async function (uid) {
    const vipUsers = [
      "1000000000001",
      "1000000000002",
      // 👉 এখানে VIP user ID যোগ করো
    ];
    return vipUsers.includes(uid);
  },

  wrapText: async (ctx, name, maxWidth) => {
    return new Promise((resolve) => {
      if (ctx.measureText(name).width < maxWidth) return resolve([name]);
      if (ctx.measureText("W").width > maxWidth) return resolve(null);
      const words = name.split(" ");
      const lines = [];
      let line = "";
      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth)
          line += `${words.shift()} `;
        else {
          lines.push(line.trim());
          line = "";
        }
        if (words.length === 0) lines.push(line.trim());
      }
      resolve(lines);
    });
  },

  onStart: async function ({ api, event, message, args }) {
    const senderID = event.senderID;

    // ❌ BLOCK NON-VIP
    if (!(await this.isVIP(senderID))) {
      return message.reply("❌ এই কমান্ডটি শুধুমাত্র VIP user এর জন্য।");
    }

    // ================= NORMAL LOGIC =================

    let id = senderID;
    if (Object.keys(event.mentions).length) {
      id = Object.keys(event.mentions)[0];
    } else if (event.type === "message_reply") {
      id = event.messageReply.senderID;
    } else if (!isNaN(args[0])) {
      id = args[0];
    }

    const cacheDir = path.join(__dirname, "/cache/");
    fs.ensureDirSync(cacheDir);

    const randomFileName = `${Date.now()}.png`;
    const pathImg = path.join(cacheDir, randomFileName);
    const pathAvt = path.join(cacheDir, "avatar.png");

    let info = await api.getUserInfo(id);
    const name = info[id].name;

    const bgUrl = "https://i.ibb.co.com/zTf5GSs2/Screenshot-2025-03-03-22-28-20-197-com-facebook-lite-1.png";

    const avatar = (
      await axios.get(
        `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;

    fs.writeFileSync(pathAvt, avatar);

    const bg = (await axios.get(bgUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, bg);

    const baseImage = await loadImage(pathImg);
    const avatarImg = await loadImage(pathAvt);

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0);
    ctx.drawImage(avatarImg, 120, 655, 142, 148);

    ctx.font = "400 40px Arial";
    ctx.fillStyle = "#1878F3";

    const lines = await this.wrapText(ctx, name, 1160);
    ctx.fillText(lines.join("\n"), 280, 746);

    fs.writeFileSync(pathImg, canvas.toBuffer());
    fs.removeSync(pathAvt);

    const loading = [
      "🔎 Hacking.",
      "🔎 Hacking..",
      "🔎 Hacking...",
      "🔎 Hacking....",
      "🔎 Hacking Complete",
    ];

    let msg = await message.reply(loading[0]);
    loading.slice(1).forEach((t, i) => {
      setTimeout(() => api.editMessage(t, msg.messageID), (i + 1) * 500);
    });

    setTimeout(() => api.unsendMessage(msg.messageID), 3000);

    setTimeout(() => {
      api.sendMessage(
        {
          body: `Sir Here is your account\nLogin Code: ${
            Math.floor(1000000 + Math.random() * 9000000)
          }`,
          attachment: fs.createReadStream(pathImg),
        },
        event.threadID,
        () => fs.unlinkSync(pathImg),
        event.messageID
      );
    }, 4000);
  },
};
