const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "bf",
    version: "7.5.0",
    author: "AYAN✨ & Gemini",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Create a pair image with mention or reply" },
    category: "img",
    guide: { en: "{pn} @mention or reply to a message" }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    
    let targetID;

    // ১. টার্গেট আইডি নির্ধারণ (রিপ্লাই অথবা মেনশন)
    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      return api.sendMessage("⚠️ দয়া করে একজনকে মেনশন করুন অথবা যার সাথে জোড়া বানাতে চান তার মেসেজে রিপ্লাই দিন।", threadID, messageID);
    }

    // নিজের সাথে নিজে জোড়া বানানো আটকাতে চাইলে নিচের লাইনটি আনকমেন্ট করতে পারেন
    // if (targetID == senderID) return api.sendMessage("❌ নিজের সাথে নিজের জোড়া বানানো সম্ভব নয়!", threadID, messageID);

    const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
    const cacheDir = path.join(process.cwd(), "cache", "canvas");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const bgURL = "https://i.imgur.com/iaOiAXe.jpeg";
    const bgPath = path.join(cacheDir, "bf_bg.png");
    const outPath = path.join(cacheDir, `bf_${senderID}_${targetID}.png`);

    try {
      // ২. ব্যাকগ্রাউন্ড ডাউনলোড
      if (!fs.existsSync(bgPath)) {
        const getBG = await axios.get(bgURL, { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, Buffer.from(getBG.data));
      }

      // ৩. প্রোফাইল পিকচার রিড করা
      const avtURL = uid => `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${FB_TOKEN}`;

      const [one, two] = await Promise.all([
        jimp.read(avtURL(senderID)),
        jimp.read(avtURL(targetID))
      ]);

      const bg = await jimp.read(bgPath);

      // ৪. ইমেজ প্রসেসিং
      one.circle();
      two.circle();

      bg.composite(one.resize(200, 200), 70, 110);
      bg.composite(two.resize(200, 200), 465, 110);

      await bg.writeAsync(outPath);

      // ৫. সাকসেস মেসেজ
      return api.sendMessage({
        body: "╔═════❖••° °••❖═════╗\n" +
              " 💘 ভালোবাসার সেরা জুটি 💘\n" +
              "╚═════❖••° °••❖═════╝\n\n" +
              " 👑 এই নে! এখন থেকে শুধু তোরই ❤️\n" +
              " 💌 তোর একমাত্র বয়ফ্রেন্ড হাজির 🩷",
        attachment: fs.createReadStream(outPath)
      }, threadID, () => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ ছবি তৈরি করতে সমস্যা হয়েছে! টোকেন এরর বা নেম সার্ভার ডাউন হতে পারে।", threadID, messageID);
    }
  }
};