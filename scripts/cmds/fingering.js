const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { Jimp } = require("jimp"); // v1.0+ এর জন্য পরিবর্তন

module.exports = {
  config: {
    name: "fingering",
    aliases: ["fg"],
    version: "1.5",
    author: "Jun & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "fingering image (18+)" },
    category: "18+",
    guide: { en: "{pn} @mention or reply" }
  },

  onStart: async function ({ event, api }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;

    const targetID = messageReply?.senderID || Object.keys(mentions || {})[0];
    if (!targetID) return api.sendMessage("⚠️ Please mention or reply to 1 person.", threadID, messageID);

    const cacheDir = path.join(process.cwd(), "cache", "canvas");
    const templatePath = path.join(cacheDir, "fingeringv2.png");
    const outPath = path.join(cacheDir, `fg_${senderID}_${targetID}.png`);

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    try {
      api.sendMessage("⌛ একটু দাঁড়ান, মিম তৈরি হচ্ছে...", threadID, (err, info) => {
         setTimeout(() => api.unsendMessage(info.messageID), 3000);
      }, messageID);

      if (!fs.existsSync(templatePath)) {
        const response = await axios.get("https://drive.google.com/uc?export=download&id=1HEIUVZXrUgxbJOCkr7h6c9_eeyGgzr3V", { responseType: "arraybuffer" });
        fs.writeFileSync(templatePath, response.data);
      }

      const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
      
      const getAvt = async (uid) => {
        const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=${token}`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const img = await Jimp.read(res.data); // Jimp.read ব্যবহার করা হয়েছে
        return img.circle();
      };

      const [baseImg, avtOne, avtTwo] = await Promise.all([
        Jimp.read(templatePath), // Jimp.read ব্যবহার করা হয়েছে
        getAvt(senderID),
        getAvt(targetID)
      ]);

      baseImg.composite(avtOne.resize({ w: 70, h: 70 }), 180, 110);
      baseImg.composite(avtTwo.resize({ w: 70, h: 70 }), 120, 140);

      const buffer = await baseImg.getBuffer("image/png");
      fs.writeFileSync(outPath, buffer);

      return api.sendMessage({
        attachment: fs.createReadStream(outPath)
      }, threadID, () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Jimp Error: " + err.message, threadID, messageID);
    }
  }
};