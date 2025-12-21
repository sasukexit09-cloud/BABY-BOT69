const fs = require("fs-extra");
const axios = require("axios");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "kiss",
    aliases: ["kiss"],
    version: "2.2",
    author: "AYAN💋",
    countDown: 5,
    role: 0,
    shortDescription: "Kiss with custom image",
    longDescription: "Generate a kiss image with the mentioned user using a custom background.",
    category: "funny",
    guide: "{pn} @mention"
  },

  onStart: async function ({ api, message, event, usersData }) {
    try {
      // VIP check (optional, enable if needed)
      /*
      const senderData = await usersData.get(event.senderID);
      if (!senderData.vip) {
        return message.reply("❌ This command is only available for VIP users.");
      }
      */

      const mentionIDs = Object.keys(event.mentions);
      if (mentionIDs.length === 0) return message.reply("Please mention someone to kiss.");

      const senderID = event.senderID;
      const mentionedID = mentionIDs[0];

      // Fetch avatar URLs
      const avatarURLs = await Promise.all([
        usersData.getAvatarUrl(mentionedID), // mentioned user
        usersData.getAvatarUrl(senderID)     // sender
      ]);

      const [avatarImg1, avatarImg2] = await Promise.all([
        Canvas.loadImage(avatarURLs[0]),
        Canvas.loadImage(avatarURLs[1])
      ]);

      // Load background
      const bgUrl = "https://bit.ly/44bRRQG";
      const bgRes = await axios.get(bgUrl, { responseType: "arraybuffer" });
      const bg = await Canvas.loadImage(bgRes.data);

      const canvasWidth = 900;
      const canvasHeight = 600;
      const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);

      const avatarSize = 230;
      const y = canvasHeight / 2 - avatarSize - 90;

      // Draw left avatar (mentioned user)
      ctx.save();
      ctx.beginPath();
      ctx.arc(150 + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg1, 150, y, avatarSize, avatarSize);
      ctx.restore();

      // Draw right avatar (sender)
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvasWidth - 150 - avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg2, canvasWidth - 150 - avatarSize, y, avatarSize, avatarSize);
      ctx.restore();

      // Save image with unique filename
      const imgPath = path.join(__dirname, "tmp", `kiss_${Date.now()}_${senderID}_${mentionedID}.png`);
      await fs.ensureDir(path.dirname(imgPath));
      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      // Send image
      message.reply({
        body: "💋 Kisssssss!",
        attachment: fs.createReadStream(imgPath)
      }, () => fs.unlinkSync(imgPath));

    } catch (err) {
      console.error("Error in kiss command:", err);
      message.reply("❌ There was an error creating the kiss image.");
    }
  }
};
