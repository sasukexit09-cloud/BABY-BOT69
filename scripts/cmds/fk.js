const fs = require("fs-extra");
const axios = require("axios");
const { Jimp } = require("jimp");
const path = require("path");

module.exports = {
  config: {
    name: "fk",
    aliases: ["fuck"],
    version: "2.0",
    author: "Tarek + Gemini",
    countDown: 10, // স্প্যাম কমাতে সময় বাড়ানো হয়েছে
    role: 0, 
    shortDescription: { en: "FK HD with Rate Limit Bypass" },
    category: "funny",
    guide: { en: "{pn} @mention or reply" }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    let targetID = messageReply?.senderID || Object.keys(mentions || {})[0];
    if (!targetID) return api.sendMessage("⚠️ দয়া করে একজনকে মেনশন করুন বা তার মেসেজে রিপ্লাই দিন!", threadID, messageID);

    const cacheDir = path.join(process.cwd(), "cache", "canvas");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    
    const bgPath = path.join(cacheDir, "fk_bg.jpg");
    const outPath = path.join(cacheDir, `fk_hd_${senderID}.png`);

    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);

      if (!fs.existsSync(bgPath)) {
        const getBG = await axios.get("https://i.imgur.com/PlVBaM1.jpg", { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, Buffer.from(getBG.data));
      }

      const senderData = await usersData.get(senderID);
      const targetData = await usersData.get(targetID);

      const senderGender = (senderData.gender === 1 || senderData.gender === "female") ? "female" : "male";
      let maleID = senderGender === "male" ? senderID : targetID;
      let femaleID = senderGender === "female" ? senderID : targetID;

      // ২. স্মার্ট ইমেজ ফেচার (Error 429 হ্যান্ডেলিং সহ)
      const getAvt = async (uid) => {
        const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
        // রেশিও কমিয়ে ৮০০ করা হয়েছে যাতে লোড কম পড়ে কিন্তু কোয়ালিটি ঠিক থাকে
        const hdUrl = `https://graph.facebook.com/${uid}/picture?height=800&width=800&access_token=${token}`;
        const normalUrl = `https://graph.facebook.com/${uid}/picture?height=800&width=800`;

        try {
          // প্রথমে টোকেন দিয়ে চেষ্টা করবে
          const res = await axios.get(hdUrl, { responseType: "arraybuffer", timeout: 10000 });
          const img = await Jimp.read(res.data);
          return img.circle();
        } catch (err) {
          // টোকেন কাজ না করলে (Error 429 হলে) টোকেন ছাড়া চেষ্টা করবে
          console.log(`Fallback trigger for UID: ${uid}`);
          const res = await axios.get(normalUrl, { responseType: "arraybuffer" });
          const img = await Jimp.read(res.data);
          return img.circle();
        }
      };

      const [baseImg, avtMale, avtFemale] = await Promise.all([
        Jimp.read(bgPath),
        getAvt(maleID),
        getAvt(femaleID)
      ]);

      avtFemale.resize({ w: 170, h: 170 });
      baseImg.composite(avtFemale, 300, 110);

      avtMale.resize({ w: 170, h: 170 });
      baseImg.composite(avtMale, 130, 350);

      const buffer = await baseImg.getBuffer("image/png");
      fs.writeFileSync(outPath, buffer);

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage({
        body: "🔥 FK রেডি! (Rate Limit Bypass Active) 😈",
        attachment: fs.createReadStream(outPath)
      }, threadID, () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(`❌ এরর: ফেসবুক সার্ভার বর্তমানে আপনার রিকোয়েস্ট ব্লক করেছে। ১০ মিনিট পর চেষ্টা করুন।`, threadID, messageID);
    }
  }
};