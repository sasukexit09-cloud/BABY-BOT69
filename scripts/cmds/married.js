const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "married",
    aliases: ["biya"],
    version: "2.0",
    author: "kivv & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: "Get married to someone",
    longDescription: "Generate a marriage certificate image with mentions.",
    category: "funny",
    guide: { en: "{pn} @tag or reply" }
  },

  onStart: async function ({ event, api, message }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // ১. আইডি ও নাম ডিটেকশন (Reply support সহ)
    let uid2 = messageReply ? messageReply.senderID : Object.keys(mentions)[0];
    if (!uid2) return message.reply("⚠️ দয়া করে একজনকে মেনশন করুন বা তার মেসেজে রিপ্লাই দিন!");

    let targetName = mentions[uid2] ? mentions[uid2].replace("@", "") : "User";
    const cacheDir = path.join(__dirname, "cache", "canvas");
    const templatePath = path.join(cacheDir, "marriedv5.png");
    const outPath = path.join(cacheDir, `married_${Date.now()}.png`);

    try {
      await fs.ensureDir(cacheDir);

      // ২. টেম্পলেট ইমেজ ডাউনলোড (যদি না থাকে)
      if (!fs.existsSync(templatePath)) {
        const res = await axios.get("https://i.ibb.co/mhxtgwm/49be174dafdc259030f70b1c57fa1c13.jpg", { responseType: "arraybuffer" });
        await fs.writeFile(templatePath, Buffer.from(res.data));
      }

      message.reply("⌛ সবুর করো, বিয়ের কার্ড রেডি হচ্ছে...");

      // ৩. হাই-কোয়ালিটি অ্যাভাটার ফেচার (Rate Limit Bypass সহ)
      const getAvt = async (uid) => {
        const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
        const hdUrl = `https://graph.facebook.com/${uid}/picture?height=800&width=800&access_token=${token}`;
        const normalUrl = `https://graph.facebook.com/${uid}/picture?height=800&width=800`;

        try {
          const res = await axios.get(hdUrl, { responseType: 'arraybuffer', timeout: 8000 });
          const img = await jimp.read(Buffer.from(res.data));
          return img.circle();
        } catch (e) {
          const res = await axios.get(normalUrl, { responseType: 'arraybuffer' });
          const img = await jimp.read(Buffer.from(res.data));
          return img.circle();
        }
      };

      // ৪. ইমেজ প্রসেসিং
      const [baseImg, avt1, avt2] = await Promise.all([
        jimp.read(templatePath),
        getAvt(senderID),
        getAvt(uid2)
      ]);

      baseImg.composite(avt1.resize(130, 130), 300, 150)
             .composite(avt2.resize(130, 130), 170, 230);

      const buffer = await baseImg.getBufferAsync(jimp.MIME_PNG);
      await fs.writeFile(outPath, buffer);

      // ৫. FB New Style Mention Logic
      const msgBody = `অভিনন্দন! তোমরা এখন বিবাহিত। 💍\n${targetName}, কবুল বলো!`;

      return message.reply({
        body: msgBody,
        mentions: [{
          tag: targetName,
          id: uid2
        }],
        attachment: fs.createReadStream(outPath)
      }, () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      });

    } catch (err) {
      console.error(err);
      return message.reply("❌ বিয়ের কার্ড বানাতে সমস্যা হয়েছে। পরে চেষ্টা করুন।");
    }
  }
};