const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "chor",
    version: "1.3.0",
    author: "CYBER & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Scooby-doo meme with HD token" },
    category: "fun",
    guide: { en: "{pn} @mention or reply" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    
    // ১. টার্গেট আইডি নির্ধারণ
    let targetID = messageReply ? messageReply.senderID : (Object.keys(mentions)[0] || senderID);

    // ২. আপনার দেওয়া স্পেশাল টোকেন ও হাই-রেজোলিউশন লিঙ্ক
    const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
    const avtURL = `https://graph.facebook.com/${targetID}/picture?height=1500&width=1500&access_token=${encodeURIComponent(FB_TOKEN)}`;
    const bgURL = "https://i.imgur.com/ES28alv.png";

    const cacheDir = path.join(process.cwd(), "cache");
    const outPath = path.join(cacheDir, `chor_hd_${targetID}.png`);

    try {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      // ৩. ছবি ডাউনলোড ও প্রসেসিং
      // প্রথমে এক্সিওস দিয়ে বাফার নেওয়া হচ্ছে যাতে সরাসরি জিম্পে রিড করা যায়
      const [bgImg, avtImg] = await Promise.all([
        jimp.read(bgURL),
        jimp.read(avtURL)
      ]);

      // প্রোফাইল পিকচার প্রসেসিং
      avtImg.circle().resize(111, 111);

      // ব্যাকগ্রাউন্ডের ওপর বসানো
      bgImg.composite(avtImg, 48, 410);

      // ৪. সেভ এবং সেন্ড
      await bgImg.writeAsync(outPath);

      return api.sendMessage({
        body: "বলদ মেয়েদের চিপায় ধরা খাইছে 😁😁",
        attachment: fs.createReadStream(outPath)
      }, threadID, () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ টোকেন বা সার্ভার সমস্যার কারণে ছবি পাওয়া যাচ্ছে না।", threadID, messageID);
    }
  }
};