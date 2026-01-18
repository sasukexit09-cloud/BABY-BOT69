const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "fuck2",
    version: "3.1.2",
    author: "C B T & Gemini",
    countDown: 5,
    role: 2, 
    shortDescription: { en: "😈 যুদ্ধ করার কমান্ড (Reply/Mention) 😈" },
    category: "funny",
    guide: { en: "{pn} @mention or reply to a message" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // ১. আইডি ডিটেকশন (Reply > Mention)
    let two;
    if (messageReply) {
      two = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      two = Object.keys(mentions)[0];
    } else {
      return api.sendMessage("❌ দয়া করে একজনকে মেনশন করুন অথবা তার মেসেজে রিপ্লাই দিন!", threadID, messageID);
    }

    const one = senderID;
    const cacheDir = path.join(process.cwd(), "cache", "canvas");
    const bgPath = path.join(cacheDir, "fuckv3.png");
    const outPath = path.join(cacheDir, `fuckv3_${one}_${two}.png`);

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    try {
      // ২. ব্যাকগ্রাউন্ড চেক ও ডাউনলোড
      if (!fs.existsSync(bgPath)) {
        const getBG = await axios.get("https://i.ibb.co/TW9Kbwr/images-2022-08-14-T183542-356.jpg", { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, Buffer.from(getBG.data));
      }

      api.sendMessage("⌛ প্রসেসিং হচ্ছে, একটু দাঁড়ান...", threadID, (err, info) => {
         setTimeout(() => api.unsendMessage(info.messageID), 3000);
      }, messageID);

      // ৩. HD Avatars (Using your Token)
      const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
      const getAvt = (id) => `https://graph.facebook.com/${id}/picture?height=1500&width=1500&access_token=${token}`;

      const [baseImg, avtOne, avtTwo] = await Promise.all([
        jimp.read(bgPath),
        jimp.read(getAvt(one)),
        jimp.read(getAvt(two))
      ]);

      // ৪. ইমেজ এডিটিং (আপনার কোডের কোঅর্ডিনেটস অনুযায়ী)
      avtOne.circle().resize(100, 100); // আপনার ছবি
      avtTwo.circle().resize(150, 150); // শত্রুর ছবি

      baseImg.composite(avtOne, 20, 300) 
             .composite(avtTwo, 100, 20);

      await baseImg.writeAsync(outPath);

      // ৫. আউটপুট পাঠানো
      return api.sendMessage({
        body: "😈 শিক্ষা দিয়ে দিলাম!",
        attachment: fs.createReadStream(outPath)
      }, threadID, () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ ছবি তৈরি করতে সমস্যা হয়েছে! সম্ভবত টোকেনটি কাজ করছে না।", threadID, messageID);
    }
  }
};