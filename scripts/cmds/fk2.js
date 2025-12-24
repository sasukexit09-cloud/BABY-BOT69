const fs = require("fs-extra");
const axios = require("axios");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "fuck2",
    aliases: ["fk2"],
    version: "1.1",
    author: "Efat + Maya Fix",
    countDown: 5,
    role: 2,
    shortDescription: "FK with custom image",
    longDescription: "Generate a fk image with the mentioned user using a custom background. Male on right, female on left.",
    category: "funny",
    guide: "{pn} @mention"
  },

  fetchAvatar: async function(uid) {
    try {
      const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(url, { responseType: "arraybuffer" });
      return await Canvas.loadImage(res.data);
    } catch {
      const img = new Canvas.Canvas(512, 512);
      const ctx = img.getContext("2d");
      ctx.fillStyle = "#cccccc";
      ctx.fillRect(0, 0, 512, 512);
      return img;
    }
  },

  onStart: async function ({ api, message, event, usersData }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) return message.reply("Please mention someone to FK.");

    const senderID = event.senderID;
    const mentionedID = mention[0];

    try {
      const senderData = await usersData.get(senderID);
      const mentionedData = await usersData.get(mentionedID);

      const senderGender = senderData.gender || "male";
      const mentionedGender = mentionedData.gender || "female";

      let maleID = senderGender === "male" ? senderID : mentionedID;
      let femaleID = senderGender === "female" ? senderID : mentionedID;

      const [avatarMale, avatarFemale] = await Promise.all([
        this.fetchAvatar(maleID),
        this.fetchAvatar(femaleID)
      ]);

      // Background image
      const bgUrl = "https://i.imgur.com/PlVBaM1.jpg"; // static image link
      const bgRes = await axios.get(bgUrl, { responseType: "arraybuffer" });
      const bg = await Canvas.loadImage(bgRes.data);

      // Canvas
      const canvasWidth = 900;
      const canvasHeight = 600;
      const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);

      // Avatar positions
      const avatarSize = 230;
      const yPos = canvasHeight / 2 - avatarSize / 2;

      // Female avatar (left)
      ctx.save();
      const femaleX = 150;
      ctx.beginPath();
      ctx.arc(femaleX + avatarSize / 2, yPos + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarFemale, femaleX, yPos, avatarSize, avatarSize);
      ctx.restore();

      // Male avatar (right)
      ctx.save();
      const maleX = canvasWidth - 150 - avatarSize;
      ctx.beginPath();
      ctx.arc(maleX + avatarSize / 2, yPos + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarMale, maleX, yPos, avatarSize, avatarSize);
      ctx.restore();

      // Save & send
      const imgPath = path.join(__dirname, "tmp", `${maleID}_${femaleID}_fk.png`);
      await fs.ensureDir(path.dirname(imgPath));
      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      message.reply({
        body: "Fuck 🤭💦",
        attachment: fs.createReadStream(imgPath)
      }, () => fs.unlinkSync(imgPath));

    } catch (err) {
      console.error("Error in fk command:", err);
      message.reply("There was an error creating the FK image.");
    }
  }
};
