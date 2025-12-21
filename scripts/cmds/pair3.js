const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair3",
    author: "xemon",
    role: 0,
    shortDescription: "VIP-only love match command",
    longDescription: "",
    category: "love",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData, threadsData }) {
    try {
      const senderData = await usersData.get(event.senderID);

      // VIP check
      if (!senderData.vip) {
        return api.sendMessage(
          "❌ This command is only available for VIP users.",
          event.threadID,
          event.messageID
        );
      }

      const id1 = event.senderID;
      const name1 = await usersData.getName(id1);

      const threadInfo = await api.getThreadInfo(event.threadID);
      const allUsers = threadInfo.userInfo;
      const botID = api.getCurrentUserID();

      // Get sender gender
      const me = allUsers.find(u => u.id === id1);
      const gender1 = me?.gender || "UNKNOWN";

      // Find matching users
      let candidates = [];
      if (gender1 === "FEMALE") {
        candidates = allUsers.filter(u => u.gender === "MALE" && u.id !== id1 && u.id !== botID);
      } else if (gender1 === "MALE") {
        candidates = allUsers.filter(u => u.gender === "FEMALE" && u.id !== id1 && u.id !== botID);
      } else {
        candidates = allUsers.filter(u => u.id !== id1 && u.id !== botID);
      }

      if (candidates.length === 0) {
        return api.sendMessage(
          "❌ No suitable match found in this group.",
          event.threadID,
          event.messageID
        );
      }

      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      const id2 = selected.id;
      const name2 = await usersData.getName(id2);

      // Love percentage
      const rd1 = Math.floor(Math.random() * 100) + 1;
      const cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
      const rd2 = cc[Math.floor(Math.random() * cc.length)];
      const tileArr = [rd1, rd1, rd1, rd1, rd1, rd2, rd1, rd1, rd1, rd1];
      const tile = tileArr[Math.floor(Math.random() * tileArr.length)];

      // Paths
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
      const pathImg = path.join(tmpDir, `background_${Date.now()}.png`);
      const pathAvt1 = path.join(tmpDir, `Avt1_${Date.now()}.png`);
      const pathAvt2 = path.join(tmpDir, `Avt2_${Date.now()}.png`);

      // Download images
      const backgroundURL = "https://i.postimg.cc/5tXRQ46D/background3.png";

      const getBuffer = async (url) => {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return Buffer.from(res.data, "utf-8");
      };

      fs.writeFileSync(pathAvt1, await getBuffer(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`));
      fs.writeFileSync(pathAvt2, await getBuffer(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`));
      fs.writeFileSync(pathImg, await getBuffer(backgroundURL));

      // Canvas
      const baseImage = await loadImage(pathImg);
      const baseAvt1 = await loadImage(pathAvt1);
      const baseAvt2 = await loadImage(pathAvt2);
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      // Circular avatars
      function drawCircleImage(ctx, img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawCircleImage(ctx, baseAvt1, 100, 150, 300);
      drawCircleImage(ctx, baseAvt2, 900, 150, 300);

      fs.writeFileSync(pathImg, canvas.toBuffer());
      fs.removeSync(pathAvt1);
      fs.removeSync(pathAvt2);

      // Send message
      return api.sendMessage(
        {
          body: `『💗』Congratulations ${name1}『💗』\n『❤️』Looks like your destiny brought you together with ${name2}『❤️』\n『🔗』Your link percentage is ${tile}%『🔗』`,
          mentions: [{ tag: name2, id: id2 }],
          attachment: fs.createReadStream(pathImg),
        },
        event.threadID,
        () => fs.unlinkSync(pathImg),
        event.messageID
      );

    } catch (error) {
      console.error(error);
      return api.sendMessage(
        "❌ Something went wrong. Please try again later.",
        event.threadID,
        event.messageID
      );
    }
  },
};
