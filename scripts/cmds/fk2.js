const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "fk2",
    version: "4.1.3",
    author: "AYAN & Gemini",
    countDown: 5,
    role: 2, 
    shortDescription: { en: "😈 যুদ্ধ করার কমান্ড (Reply/Mention) 😈" },
    category: "funny",
    guide: { en: "{pn} @mention or reply to a message" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // ১. আইডি ডিটেকশন লজিক (Reply > Mention)
    let two;
    if (messageReply) {
      two = messageReply.senderID; // রিপ্লাই দিলে তার আইডি
    } else if (Object.keys(mentions).length > 0) {
      two = Object.keys(mentions)[0]; // মেনশন করলে তার আইডি
    } else {
      return api.sendMessage("❌ দয়া করে একজনকে মেনশন করুন অথবা তার মেসেজে রিপ্লাই দিন!", threadID, messageID);
    }

    const one = senderID;
    const cacheDir = path.join(process.cwd(), "cache", "canvas");
    const bgPath = path.join(cacheDir, "fucksv5.png");
    const outPath = path.join(cacheDir, `fk_${one}_${two}.png`);

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    try {
      // ২. ব্যাকগ্রাউন্ড চেক
      if (!fs.existsSync(bgPath)) {
        const getBG = await axios.get("https://i.ibb.co/VJHCjCb/images-2022-08-14-T183802-542.jpg", { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, Buffer.from(getBG.data));
      }

      api.sendMessage("⌛ একটু দাঁড়াও, সাইজ করছি...", threadID, (err, info) => {
         setTimeout(() => api.unsendMessage(info.messageID), 3000);
      }, messageID);

      // ৩. HD Avatars using your Token
      const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
      const getAvt = (id) => `https://graph.facebook.com/${id}/picture?height=1500&width=1500&access_token=${token}`;

      const [baseImg, avtOne, avtTwo] = await Promise.all([
        jimp.read(bgPath),
        jimp.read(getAvt(one)),
        jimp.read(getAvt(two))
      ]);

      // ৪. ইমেজ এডিটিং
      avtOne.circle().resize(150, 150);
      avtTwo.circle().resize(150, 150);

      baseImg.composite(avtOne, 50, 20) 
             .composite(avtTwo, 460, 20);

      await baseImg.writeAsync(outPath);

      // ৫. আউটপুট
      return api.sendMessage({
        body: "😈 খেলা শুরু!",
        attachment: fs.createReadStream(outPath)
      }, threadID, () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ ছবি তৈরি করতে সমস্যা হয়েছে।", threadID, messageID);
    }
  }
};