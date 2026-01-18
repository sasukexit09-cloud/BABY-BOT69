const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");

module.exports = {
  config: {
    name: "hug2",
    version: "7.3.8",
    author: "AYAN & Gemini",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Create a hug frame with ultra-precise positioning" },
    category: "img",
    guide: { en: "{pn} @mention or reply" }
  },

  onStart: async function ({ event, api, args }) {
    const { threadID, messageID, senderID, mentions, messageReply, type } = event;

    let targetID;
    if (type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    if (!targetID) {
      return api.sendMessage("আরে বলদ, একজনকে মেনশন কর অথবা তার মেসেজে রিপ্লাই দে! 🤧🤣", threadID, messageID);
    }

    const cacheDir = path.join(process.cwd(), "cache", "canvas");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const bgPath = path.join(cacheDir, "hugv3.png");
    const outPath = path.join(cacheDir, `hug_${senderID}_${targetID}.png`);

    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);

      if (!fs.existsSync(bgPath)) {
        const getBG = await axios.get("https://files.catbox.moe/hk3mko.jpg", { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, Buffer.from(getBG.data));
      }

      const getAvt = async (id) => {
        const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
        const url = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=${token}`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const img = await Jimp.read(res.data);
        return img.circle();
      };

      const [baseImg, avtOne, avtTwo] = await Promise.all([
        Jimp.read(bgPath),
        getAvt(senderID),
        getAvt(targetID)
      ]);

      // --- আপনার দেওয়া ইনস্ট্রাকশন অনুযায়ী নতুন পজিশন ---
      
      // বাম পাশের ক্যারেক্টার (Sender) - আরও বামে এবং একদম উপরে
      avtOne.resize({ w: 170, h: 170 });
      baseImg.composite(avtOne, 150, 10); // X: 150 (বামে সরানো), Y: 10 (একদম উপরে)

      // ডান পাশের ক্যারেক্টার (Target) - আরও বামে এবং এডজাস্ট করা
      avtTwo.resize({ w: 170, h: 170 });
      baseImg.composite(avtTwo, 460, 115); // X: 460 (বামে সরানো), Y: 115 (মাথার পজিশন)

      const buffer = await baseImg.getBuffer("image/png");
      fs.writeFileSync(outPath, buffer);

      const captions = [
        "❝ তুমি আমার জীবনের সেরা অধ্যায়!💝",
        "❝ আমার কাছে তোমাকে ভালোবাসার কোনো সংজ্ঞা নেই!❤️",
        "❝ অনুভূতিগুলো শুধু তোমার জন্যই! 🌻"
      ];
      const caption = captions[Math.floor(Math.random() * captions.length)];

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage({
        body: caption,
        attachment: fs.createReadStream(outPath)
      }, threadID, () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }, messageID);

    } catch (e) {
      console.error(e);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ ছবি তৈরি করতে সমস্যা হয়েছে!", threadID, messageID);
    }
  }
};