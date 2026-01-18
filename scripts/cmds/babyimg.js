const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "babyimg",
    version: "1.0.2",
    author: "rX & Gemini",
    countDown: 0,
    role: 0,
    shortDescription: { en: "Send image as reply to trigger word" },
    longDescription: { en: "The bot sends specific images when it detects trigger keywords in chat." },
    category: "auto",
    guide: { en: "{pn}" }
  },

  onChat: async function ({ api, event, message }) {
    const msg = event.body?.toLowerCase();
    if (!msg) return;

    const imageTriggers = [
      {
        keywords: ["khabo", "khuda lagse"],
        imageUrl: "https://i.postimg.cc/x8p156pR/8c3b955e8309b478efc1073e09f72075.jpg",
        reply: "🍽️ 😋",
        fileName: "khabo.jpg"
      },
      {
        keywords: ["holpagol", "sex"],
        imageUrl: "https://i.postimg.cc/Vs26JVMf/e052f3e1f21ab2d1c07312c720eda6ae.jpg",
        reply: "🌙 boka nki 😴",
        fileName: "gumkorefela.jpg"
      },
      {
        keywords: ["handel mara"],
        imageUrl: "https://i.postimg.cc/QxBZYxj7/IMG-7310.jpg",
        reply: "Ai ne",
        fileName: "handel.jpg"
      },
      {
        keywords: ["maria pik", "maria pik daw"],
        imageUrl: "https://i.postimg.cc/qMwr5nh6/IMG-6381.jpg",
        reply: "🎀🧃",
        fileName: "maria.jpg"
      },
      {
        keywords: ["bara", "bokaxhuda", "hol pagol"],
        imageUrl: "https://i.postimg.cc/j5N1pWc7/81e81232266d1c0220e6f4cbf7214bea.jpg",
        reply: "",
        fileName: "bokaxhuda.jpg"
      },
      {
        keywords: ["pixlist dew"],
        imageUrl: "https://i.postimg.cc/6q7ZkN04/IMG-7186.png",
        reply: "📜 Pixlist bY rX",
        fileName: "pixlist.png"
      }
    ];

    for (const trigger of imageTriggers) {
      if (trigger.keywords.some(k => msg.includes(k))) {
        const cacheDir = path.join(__dirname, "cache");
        const filePath = path.join(cacheDir, `${Date.now()}_${trigger.fileName}`);
        
        try {
          // ক্যাশ ফোল্ডার না থাকলে তৈরি করা
          if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

          const res = await axios.get(trigger.imageUrl, { responseType: "arraybuffer" });
          fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

          return api.sendMessage({
            body: trigger.reply,
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }, event.messageID);

        } catch (err) {
          console.log(`❌ Failed to send image for ${trigger.keywords[0]}:`, err.message);
        }
        break; // একটি ট্রিগার মিলে গেলে লুপ বন্ধ হবে
      }
    }
  },

  onStart: async function ({ message }) {
    return message.reply("🖼️ BabyImg system is active! I will respond to trigger words with images.");
  }
};