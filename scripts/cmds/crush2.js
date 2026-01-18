const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "crush2",
    version: "7.3.5",
    author: "AYAN & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Romantic couple pair with HD avatars" },
    category: "love",
    guide: { en: "{pn} @mention or reply to their message" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // ১. মেনশন অথবা রিপ্লাই থেকে আইডি ডিটেক্ট করা
    let two;
    if (messageReply) {
        two = messageReply.senderID; // যদি কাউকে রিপ্লাই দিয়ে কমান্ড লেখে
    } else if (Object.keys(mentions).length > 0) {
        two = Object.keys(mentions)[0]; // যদি কাউকে মেনশন করে কমান্ড লেখে
    } else {
        return api.sendMessage("❌ দয়া করে আপনার ক্রাশকে মেনশন করুন বা তার মেসেজে রিপ্লাই দিন!", threadID, messageID);
    }

    const one = senderID;
    const cacheDir = path.join(process.cwd(), "cache", "canvas");
    const bgPath = path.join(cacheDir, "crush.png");
    const outPath = path.join(cacheDir, `crush_${one}_${two}.png`);

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    try {
      if (!fs.existsSync(bgPath)) {
        const getBG = await axios.get("https://i.imgur.com/PlVBaM1.jpg", { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, Buffer.from(getBG.data));
      }

      api.sendMessage("⌛ একটু অপেক্ষা করুন, আপনাদের রোমান্টিক মিম তৈরি হচ্ছে...", threadID, (err, info) => {
         setTimeout(() => api.unsendMessage(info.messageID), 3000);
      }, messageID);

      const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
      const getAvt = (id) => `https://graph.facebook.com/${id}/picture?height=1500&width=1500&access_token=${token}`;

      const [baseImg, avatarOneRaw, avatarTwoRaw] = await Promise.all([
        jimp.read(bgPath),
        jimp.read(getAvt(one)),
        jimp.read(getAvt(two))
      ]);

      avatarOneRaw.circle().resize(191, 191);
      avatarTwoRaw.circle().resize(190, 190);

      baseImg.composite(avatarOneRaw, 93, 111)
             .composite(avatarTwoRaw, 434, 107);

      await baseImg.writeAsync(outPath);

      const crushCaptions = [
        "প্রেমে যদি অপূর্ণতাই সুন্দর হয়, তবে পূর্ণতার সৌন্দর্য কোথায়?❤️",
        "যদি বৃষ্টি হতাম… তোমার দৃষ্টি ছুঁয়ে দিতাম! চোখে জমা বিষাদটুকু এক নিমেষে ধুয়ে দিতাম🤗",
        "তোমার ভালোবাসার প্রতিচ্ছবি দেখেছি বারে বার💖",
        "তোমার সাথে একটি দিন হতে পারে ভালো, কিন্তু তোমার সাথে সবগুলি দিন হতে পারে ভালোবাসা🌸",
        "এক বছর নয়, কয়েক জন্ম শুধু তোমার প্রেমে পরতে পরতে চলে যাবে😍",
        "কেমন করে এই মনটা দেব তোমাকে… বেসেছি যাকে ভালো আমি, মন দিয়েছি তাকে🫶"
      ];
      const caption = crushCaptions[Math.floor(Math.random() * crushCaptions.length)];

      return api.sendMessage({
        body: `✧•❁ 𝐂𝐫𝐮𝐬𝐡 ❁•✧\n\n${caption}`,
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