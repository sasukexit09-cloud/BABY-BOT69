const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pair2",
    author: "Nyx x @Ariyan",
    category: "love",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      // Get sender data
      const senderData = await usersData.get(event.senderID);

      // VIP check
      if (!senderData.vip) {
        return api.sendMessage(
          "❌ This command is only available for VIP users.",
          event.threadID,
          event.messageID
        );
      }

      const senderName = senderData.name;

      // Get thread info
      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find(user => user.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage(
          "⚠ Could not determine your gender.",
          event.threadID,
          event.messageID
        );
      }

      const myGender = myData.gender;
      const targetGender = myGender === "MALE" ? "FEMALE" : "MALE";

      const matchCandidates = users.filter(
        user => user.gender === targetGender && user.id !== event.senderID
      );

      if (matchCandidates.length === 0) {
        return api.sendMessage(
          "❌ No suitable match found in the group.",
          event.threadID,
          event.messageID
        );
      }

      const selectedMatch =
        matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      const matchName = selectedMatch.name;

      // Canvas setup
      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const background = await loadImage(
        "https://i.postimg.cc/tRFY2HBm/0602f6fd6933805cf417774fdfab157e.jpg"
      );

      const sIdImage = await loadImage(
        `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );

      const pairPersonImage = await loadImage(
        `https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );

      // Function to draw circular profile images
      function drawCircleImage(ctx, img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      ctx.drawImage(background, 0, 0, width, height);
      drawCircleImage(ctx, sIdImage, 385, 40, 170);
      drawCircleImage(ctx, pairPersonImage, width - 213, 190, 180);

      // Unique output file
      const outputPath = path.join(__dirname, `pair_${Date.now()}.png`);
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        const lovePercent = Math.floor(Math.random() * 31) + 70;
        api.sendMessage(
          {
            body: `🥰𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹 𝗣𝗮𝗶𝗿𝗶𝗻𝗴\n・${senderName} 🎀\n・${matchName} 🎀\n💌𝗪𝗶𝘀𝗵 𝘆𝗼𝘂 𝘁𝘄𝗼 𝗵𝘂𝗻𝗱𝗿𝗲𝗱 𝘆𝗲𝗮𝗿𝘀 𝗼𝗳 𝗵𝗮𝗽𝗽𝗶𝗻𝗲𝘀𝘀 ❤❤\n\n💙𝗟𝗼𝘃𝗲 𝗣𝗲𝗿𝗰𝗲𝗻𝘁𝗮𝗴𝗲: ${lovePercent}%`,
            attachment: fs.createReadStream(outputPath),
          },
          event.threadID,
          () => fs.unlinkSync(outputPath),
          event.messageID
        );
      });
    } catch (error) {
      console.error(error);
      api.sendMessage(
        "❌ An error occurred while trying to find a match. Please try again later.",
        event.threadID,
        event.messageID
      );
    }
  },
};
