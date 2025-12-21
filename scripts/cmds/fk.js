const fs = require("fs-extra");
const axios = require("axios");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "fk",
    aliases: ["fk", "fuck"],
    version: "1.2",
    author: "Tarek",
    countDown: 5,
    role: 0,
    shortDescription: "FK with custom image (VIP only, auto-detect)",
    longDescription: "Generate a fk image with the mentioned user using a custom background. Male on right, female on left. Only VIP users can use.",
    category: "funny",
    guide: "{pn} @mention"
  },

  // 🔐 VIP auto-detect
  isVIP: async function(userID, usersData) {
    // Example: usersData এ VIP flag থাকলে detect করা
    try {
      const data = await usersData.get(userID);
      // ধরো data.isVIP true হলে VIP
      return data.isVIP === true;
    } catch (e) {
      return false;
    }
  },

  onStart: async function ({ api, message, event, usersData }) {
    const senderID = event.senderID;

    // ❌ VIP না হলে block
    if (!(await this.isVIP(senderID, usersData))) {
      return message.reply("❌ এই কমান্ডটি শুধুমাত্র VIP user এর জন্য।");
    }

    const mention = Object.keys(event.mentions);
    if (mention.length === 0) return message.reply("Please mention someone to FK.");

    let mentionedID = mention[0];

    try {
      const senderData = await usersData.get(senderID);
      const mentionedData = await usersData.get(mentionedID);

      const senderGender = senderData.gender || "male";
      const mentionedGender = mentionedData.gender || "female";

      let maleID, femaleID;

      if (senderGender === "male") {
        maleID = senderID;
        femaleID = mentionedID;
      } else {
        maleID = mentionedID;
        femaleID = senderID;
      }

      const avatarMale = await usersData.getAvatarUrl(maleID);
      const avatarFemale = await usersData.getAvatarUrl(femaleID);

      const [avatarImgMale, avatarImgFemale] = await Promise.all([
        Canvas.loadImage(avatarMale),
        Canvas.loadImage(avatarFemale)
      ]);

      const bgUrl = "https://drive.google.com/uc?export=download&id=1QnmVdwJgqNcOIN1QTsxwB0dbWzTpD2BJ";
      const bgRes = await axios.get(bgUrl, { responseType: "arraybuffer" });
      const bg = await Canvas.loadImage(bgRes.data);

      const canvasWidth = 850;
      const canvasHeight = 600;
      const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);

      const avatarSize = 170;
      const y = canvasHeight / 2 - avatarSize - 90;

      // 👩 Female avatar
      ctx.save();
      const femaleX = 300;
      const yFemale = y - 30;
      ctx.beginPath();
      ctx.arc(femaleX + avatarSize / 2, yFemale + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImgFemale, femaleX, yFemale, avatarSize, avatarSize);
      ctx.restore();

      // 👨 Male avatar
      ctx.save();
      const maleX = 130;
      const yMale = y + 290;
      ctx.beginPath();
      ctx.arc(maleX + avatarSize / 2, yMale + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImgMale, maleX, yMale, avatarSize, avatarSize);
      ctx.restore();

      const imgPath = path.join(__dirname, "tmp", `${maleID}_${femaleID}_fk.png`);
      await fs.ensureDir(path.dirname(imgPath));
      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      message.reply({
        body: "Fkkkk!",
        attachment: fs.createReadStream(imgPath)
      }, () => fs.unlinkSync(imgPath));

    } catch (err) {
      console.error("Error in fk command:", err);
      message.reply("❌ There was an error creating the FK image.");
    }
  }
};
