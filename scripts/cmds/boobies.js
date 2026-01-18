const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "boobies",
    version: "1.1.0",
    author: "Kaneki & Gemini",
    countDown: 5,
    role: 0, // সবার জন্য উন্মুক্ত রাখতে ০, এডমিন হলে ২ দিন
    shortDescription: { en: "Squeeze the breast of the tagged user (Anime GIF)" },
    category: "nsfw",
    guide: { en: "{pn} @mention or reply" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, mentions, messageReply, senderID } = event;
    let targetID, name;

    // ১. টার্গেট আইডি এবং নাম নির্ধারণ
    if (messageReply) {
      targetID = messageReply.senderID;
      name = "প্রিয়"; // রিপ্লাইতে নাম ডিটেক্ট করা জটিল তাই ডিফল্ট
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      name = mentions[targetID].replace("@", "");
    } else {
      return api.sendMessage("⚠️ দয়া করে একজনকে মেনশন করুন অথবা মেসেজে রিপ্লাই দিন!", threadID, messageID);
    }

    const links = [
      "https://i.postimg.cc/tC2BTrmF/3.gif",
      "https://i.postimg.cc/pLrqnDg4/78d07b6be53bea612b6891724c1a23660102a7c4.gif",
      "https://i.postimg.cc/gJFD51nb/detail.gif",
      "https://i.postimg.cc/xjPRxxQB/GiC86RK.gif",
      "https://i.postimg.cc/L8J3smPM/tumblr-myzq44-Hv7-G1rat3p6o1-500.gif"
    ];

    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const gifPath = path.join(cacheDir, `squeeze_${Date.now()}.gif`);

    try {
      const randomLink = links[Math.floor(Math.random() * links.length)];
      
      // ২. ইমেজ/গিফ ডাউনলোড
      const response = await axios.get(randomLink, { responseType: "arraybuffer" });
      fs.writeFileSync(gifPath, Buffer.from(response.data));

      // ৩. মেসেজ পাঠানো
      return api.sendMessage({
        body: `${name} 𝗬𝗼𝘂 𝗚𝗲𝘁 𝗬𝗼𝘂𝗿 𝗕𝗿𝗲𝗮𝘀𝘁 𝗦𝗾𝘂𝗲𝗲𝘇𝗲𝗱 😝`,
        mentions: [{ tag: name, id: targetID }],
        attachment: fs.createReadStream(gifPath)
      }, threadID, () => {
        if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
      return api.sendMessage("❌ গিফ লোড করতে সমস্যা হয়েছে!", threadID, messageID);
    }
  }
};