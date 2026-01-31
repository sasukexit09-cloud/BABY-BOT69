const fs = require("fs-extra");
const axios = require("axios");
const { Jimp } = require("jimp");
const path = require("path");

module.exports = {
  config: {
    name: "fk",
    aliases: ["fuck"],
    version: "2.5",
    author: "Tarek + Gemini",
    countDown: 10,
    role: 0,
    shortDescription: { en: "FK HD with New Mention Style" },
    category: "funny",
    guide: { en: "{pn} @mention or reply" }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // ১. টার্গেট আইডি এবং নাম ডিটেকশন
    let targetID = messageReply?.senderID || Object.keys(mentions || {})[0];
    if (!targetID) return api.sendMessage("⚠️ দয়া করে একজনকে মেনশন করুন বা তার মেসেজে রিপ্লাই দিন!", threadID, messageID);

    const targetName = mentions[targetID] ? mentions[targetID].replace("@", "") : "User";

    const cacheDir = path.join(process.cwd(), "cache", "canvas");
    await fs.ensureDir(cacheDir);

    const bgPath = path.join(cacheDir, "fk_bg.jpg");
    const outPath = path.join(cacheDir, `fk_hd_${Date.now()}.png`);

    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);

      // ব্যাকগ্রাউন্ড ইমেজ ডাউনলোড
      if (!fs.existsSync(bgPath)) {
        const getBG = await axios.get("https://i.imgur.com/PlVBaM1.jpg", { responseType: "arraybuffer" });
        await fs.writeFile(bgPath, Buffer.from(getBG.data));
      }

      const senderData = await usersData.get(senderID);
      
      // জেন্ডার লজিক (মেল-ফিমেল পজিশন ঠিক করার জন্য)
      const senderGender = (senderData.gender === 1 || senderData.gender === "female") ? "female" : "male";
      let maleID = senderGender === "male" ? senderID : targetID;
      let femaleID = senderGender === "female" ? senderID : targetID;

      // ২. স্মার্ট ইমেজ ফেচার (Circle Crop সহ)
      const getAvt = async (uid) => {
        const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
        const hdUrl = `https://graph.facebook.com/${uid}/picture?height=800&width=800&access_token=${token}`;
        const normalUrl = `https://graph.facebook.com/${uid}/picture?height=800&width=800`;

        try {
          const res = await axios.get(hdUrl, { responseType: "arraybuffer", timeout: 8000 });
          const img = await Jimp.read(Buffer.from(res.data));
          return img.circle();
        } catch (err) {
          const res = await axios.get(normalUrl, { responseType: "arraybuffer" });
          const img = await Jimp.read(Buffer.from(res.data));
          return img.circle();
        }
      };

      const [baseImg, avtMale, avtFemale] = await Promise.all([
        Jimp.read(bgPath),
        getAvt(maleID),
        getAvt(femaleID)
      ]);

      // ৩. ইমেজ পজিশনিং ও কম্পোজিট
      avtFemale.resize(170, 170);
      baseImg.composite(avtFemale, 300, 110);

      avtMale.resize(170, 170);
      baseImg.composite(avtMale, 130, 350);

      const buffer = await baseImg.getBufferAsync(Jimp.MIME_PNG);
      await fs.writeFile(outPath, buffer);

      api.setMessageReaction("✅", messageID, () => {}, true);

      // ৪. FB New Style Mention Message
      const msgBody = `🔥 FK রেডি! 😈\nএই নে কড়া ডোজ ${targetName}!`;

      return api.sendMessage({
        body: msgBody,
        mentions: [{
          tag: targetName,
          id: targetID
        }],
        attachment: fs.createReadStream(outPath)
      }, threadID, () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(`❌ এরর: ইমেজ প্রসেসিং এ সমস্যা হয়েছে। আবার চেষ্টা করুন।`, threadID, messageID);
    }
  }
};