const fs = require("fs-extra");
const axios = require("axios");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "fk",
    aliases: ["fk", "fuck"],
    version: "1.3",
    author: "Tarek + Maya Fix",
    countDown: 5,
    role: 0,
    shortDescription: "FK with custom image (VIP only, auto-detect)",
    longDescription: "Generate a FK image with the mentioned user using a custom background. Male on right, female on left. Only VIP users can use.",
    category: "funny",
    guide: "{pn} @mention"
  },

  isVIP: async function(userID, usersData) {
    try {
      const data = await usersData.get(userID);
      return data.isVIP === true;
    } catch {
      return false;
    }
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
    const senderID = event.senderID;
    if (!(await this.isVIP(senderID, usersData))) {
      return message.reply("❌ এই কমান্ডটি শুধুমাত্র VIP user এর জন্য।");
    }

    const mention = Object.keys(event.mentions);
    if (!mention[0]) return message.reply("Please mention someone to FK.");
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

      // Background
      const bgUrl = "https://i.imgur.com/PlVBaM1.jpg"; // direct link, safe
      const bgRes = await axios.get(bgUrl, { responseType: "arraybuffer" });
      const bg = await Canvas.loadImage(bgRes.data);

      const canvasWidth = 850;
      const canvasHeight = 600;
      const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);

      // Female avatar
      ctx.save();
      const avatarSize = 170;
      const femaleX = 300;
      const yFemale = canvasHeight/2 - avatarSize - 90;
      ctx.beginPath();
      ctx.arc(femaleX + avatarSize/2, yFemale + avatarSize/2, avatarSize/2, 0, Math.PI*2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarFemale, femaleX, yFemale, avatarSize, avatarSize);
      ctx.restore();

      // Male avatar
      ctx.save();
      const maleX = 130;
      const yMale = canvasHeight/2 + 50;
      ctx.beginPath();
      ctx.arc(maleX + avatarSize/2, yMale + avatarSize/2, avatarSize/2, 0, Math.PI*2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarMale, maleX, yMale, avatarSize, avatarSize);
      ctx.restore();

      const imgPath = path.join(__dirname, "tmp", `${maleID}_${femaleID}_fk.png`);
      await fs.ensureDir(path.dirname(imgPath));
      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      message.reply({
        body: "Fkkkk! 😏",
        attachment: fs.createReadStream(imgPath)
      }, () => fs.unlinkSync(imgPath));

    } catch (err) {
      console.error("Error in fk command:", err);
      message.reply("❌ There was an error creating the FK image.");
    }
  }
};
