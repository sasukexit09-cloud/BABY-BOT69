const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "bday",
    version: "1.2.0",
    author: "ULLASH, SAHU & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "See admin's birthday countdown with HQ profile pic" },
    category: "info",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    
    // ১. এডমিনের জন্ম তারিখ ও আইডি সেটআপ
    const birthMonth = 10; // November (0=Jan, 10=Nov)
    const birthDay = 13;
    const adminUID = "61584308632995";
    const accessToken = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
    
    const now = new Date();
    let targetDate = new Date(now.getFullYear(), birthMonth, birthDay);

    if (now > targetDate) {
      targetDate.setFullYear(now.getFullYear() + 1);
    }

    const diffMs = targetDate - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const diffSeconds = Math.floor((diffMs / 1000) % 60);

    // ২. কাউন্টডাউন টেক্সট
    let msg = "";
    if (diffDays === 0 && now.getDate() === birthDay) {
      msg = `╔═══ 🎉 𝐇𝐀𝐏𝐏𝐘 𝐁𝐈𝐑𝐓𝐇𝐃𝐀𝐘 🎉 ════╗\n║ 🎂 𝐇𝐁𝐃 𝐀𝐘𝐀𝐍 𝐀𝐇𝐌𝐄𝐃𝐙! 💖 \n╟─────────────────\n║ 🥳 আজ আমাদের প্রিয় এডমিনের জন্মদিন! \n║ ❤️ সবাই মন থেকে প্রাণভরে উইশ করো! \n╚═════════════════════════╝`;
    } else {
      msg = `╔═══════════════════╗\n║ 🎂 ADMIN AYAN 💫\n║ এর জন্মদিন ফাঁস হয়ে গেছে ❤️‍🩹🤌\n║═══════════════════\n║ 📅 Days : ${diffDays}\n║ ⏰ Hours : ${diffHours}\n║ 🕰️ Minutes : ${diffMinutes}\n║ ⏳ Seconds : ${diffSeconds}\n╚════════════════════╝`;
    }

    // ৩. এক্সেস টোকেনসহ ইমেজ ইউআরএল
    const url = `https://graph.facebook.com/${adminUID}/picture?height=1500&width=1500&access_token=${accessToken}`;
    const cacheDir = path.join(process.cwd(), "cache");
    const imgPath = path.join(cacheDir, `bday_${adminUID}.png`);

    try {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const response = await axios({
        url,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(imgPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: msg,
          attachment: fs.createReadStream(imgPath)
        }, threadID, () => {
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }, messageID);
      });

      writer.on("error", () => {
        api.sendMessage(msg, threadID, messageID);
      });

    } catch (err) {
      api.sendMessage(msg, threadID, messageID);
    }
  }
};