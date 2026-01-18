const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "boypp",
    version: "1.0.2",
    author: "Shahadat SAHU & Gemini",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Send a random Facebook boy profile picture" },
    category: "img",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    const imgLinks = [
      "https://i.imgur.com/yCN9Piq.jpeg", "https://i.imgur.com/IpA5QUo.jpeg",
      "https://i.imgur.com/Sgz38xm.jpeg", "https://i.imgur.com/UZ7CiLk.jpeg",
      "https://i.imgur.com/jqZZm1C.jpeg", "https://i.imgur.com/stP854Y.jpeg",
      "https://i.imgur.com/pXzuhBu.jpeg", "https://i.imgur.com/iCboC1U.jpeg",
      "https://i.imgur.com/mh8RO7i.jpeg", "https://i.imgur.com/peKWGdr.jpeg",
      "https://i.imgur.com/YekeWRX.jpeg", "https://i.imgur.com/ktWIKXB.jpeg",
      "https://i.imgur.com/xoNjVNn.jpeg", "https://i.imgur.com/KLmB1w6.jpeg",
      "https://i.imgur.com/7tgT5rC.jpeg", "https://i.imgur.com/q0mTaXT.jpeg",
      "https://i.imgur.com/c832Y6X.jpeg", "https://i.imgur.com/xWiRrNz.jpeg",
      "https://i.imgur.com/e9tFkoc.jpeg", "https://i.imgur.com/0LNdctf.jpeg",
      "https://i.imgur.com/DfabYU0.jpeg", "https://i.imgur.com/d8E4g8n.png",
      "https://i.imgur.com/Ak3yB2r.jpeg", "https://i.imgur.com/Bm2zYuu.jpeg",
      "https://i.imgur.com/GQNt5Dm.jpeg", "https://i.imgur.com/VseMop0.jpeg",
      "https://i.imgur.com/pq7xQQz.jpeg", "https://i.imgur.com/e8y24F0.jpeg"
    ];

    // ১. র‍্যান্ডম ইমেজ সিলেক্ট করা
    const randomImg = imgLinks[Math.floor(Math.random() * imgLinks.length)];
    const cacheDir = path.join(process.cwd(), "cache");
    const filePath = path.join(cacheDir, `boy_pp_${Date.now()}.jpg`);

    try {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      // ২. ইমেজ ডাউনলোড
      const response = await axios.get(randomImg, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(response.data));

      // ৩. ইমেজ পাঠানো
      return api.sendMessage({
        body: "📸 Facebook Boy Profile 🤌",
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);

    } catch (err) {
      console.error(err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return api.sendMessage("❌ ছবি লোড করতে সমস্যা হয়েছে।", threadID, messageID);
    }
  }
};