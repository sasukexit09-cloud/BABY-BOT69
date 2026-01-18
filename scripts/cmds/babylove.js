const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const apiJsonURL = "https://raw.githubusercontent.com/rummmmna21/rx-api/refs/heads/main/baseApiUrl.json";
const marker = "\u200B";

module.exports = {
  config: {
    name: "babylove",
    version: "1.3.5",
    author: "rX & Gemini",
    countDown: 0,
    role: 0,
    shortDescription: { en: "Auto female voice response" },
    longDescription: { en: "Multi auto voice response with female voice and typing animation." },
    category: "auto",
    guide: { en: "{pn}" }
  },

  onChat: async function ({ api, event, message, usersData }) {
    const msg = event.body?.toLowerCase();
    if (!msg) return;

    const { threadID, messageID, messageReply, senderID } = event;
    const userData = await usersData.get(senderID);
    const name = userData.name || "User";

    // ---- Typing Indicator Function ----
    const sendTyping = async (time = 2500) => {
      api.sendTypingIndicator(threadID, (err) => {
        if (!err) setTimeout(() => api.sendTypingIndicator(threadID), time);
      });
      await new Promise(resolve => setTimeout(resolve, time));
    };

    // ---- Step 1: Reply to bot voice message (Female Voice API) ----
    if (messageReply && messageReply.senderID === api.getCurrentUserID() && messageReply.body?.includes(marker)) {
      const rxAPI = await getRxAPI();
      if (!rxAPI) return;

      await sendTyping(3000);
      try {
        // এখানে '&type=female' প্যারামিটার যুক্ত করা হয়েছে মেয়েদের কন্ঠের জন্য
        const res = await axios.get(`${rxAPI}?text=${encodeURIComponent(msg)}&senderName=${encodeURIComponent(name)}&type=female`);
        const replyData = Array.isArray(res.data.response) ? res.data.response : [res.data.response];

        for (const reply of replyData) {
          await api.sendMessage(reply + marker, threadID, messageID);
        }
      } catch (err) {
        console.error("❌ Voice API Error:", err.message);
      }
      return;
    }

    // ---- Step 2: Audio Triggers (Pre-recorded Female Voices) ----
    const triggers = [
      { keywords: ["ghumabo", "ghum"], audioUrl: "https://files.catbox.moe/us0nva.mp3", reply: "😴 Okaay baby, sweet dreams 🌙", fileName: "ghumabo.mp3" },
      { keywords: ["🤨🤨", "🙄🙄", "ki hoise"], audioUrl: "https://files.catbox.moe/vgzkeu.mp3", reply: "jaki 🐥", fileName: "jaki.mp3" },
      { keywords: ["ringtone", "bhalobashi"], audioUrl: "https://files.catbox.moe/ga798u.mp3", reply: "💖 Ay Love You Baby!", fileName: "bhalobashi.mp3" },
      { keywords: ["kanna", "kadis na"], audioUrl: "https://files.catbox.moe/6xbjbb.mp3", reply: "কে কাঁদায় আমার জানকে? 🥺", fileName: "kanna.mp3" },
      { keywords: ["busy naki", "ki koro"], audioUrl: "https://files.catbox.moe/cw9bdy.mp3", reply: "🥴🤔", fileName: "busy.mp3" },
      { keywords: ["i love you", "love you"], audioUrl: "https://files.catbox.moe/hqw3my.mp3", reply: "🧃🐣 Love you too!", fileName: "love.mp3" },
      { keywords: ["girlfriend", "gf"], audioUrl: "https://files.catbox.moe/v395oa.mp3", reply: "Oow 🫡🎀", fileName: "gf.mp3" }
    ];

    for (const trigger of triggers) {
      if (trigger.keywords.some(k => msg.includes(k))) {
        const cacheDir = path.join(__dirname, "cache");
        const cachePath = path.join(cacheDir, `${Date.now()}_${trigger.fileName}`);
        
        try {
          await sendTyping(2000);
          if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

          const res = await axios.get(trigger.audioUrl, { responseType: "arraybuffer" });
          fs.writeFileSync(cachePath, Buffer.from(res.data));

          return api.sendMessage({
            body: trigger.reply,
            attachment: fs.createReadStream(cachePath)
          }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.removeSync(cachePath);
          }, messageID);
        } catch (e) {
          console.error("❌ Audio Trigger Error:", e.message);
        }
        break;
      }
    }
  },

  onStart: async function ({ message }) {
    return message.reply("🎙️ 𝐁𝐚𝐛𝐲𝐋𝐨𝐯𝐞 𝐒𝐲𝐬𝐭𝐞𝐦 (Female Voice) Active! \nবটের যেকোনো ভয়েস মেসেজে রিপ্লাই দিলে বট মেয়েদের কন্ঠে উত্তর দিবে।");
  }
};

// --- Helper Function to Fetch Base API ---
async function getRxAPI() {
  try {
    const res = await axios.get(apiJsonURL);
    if (res.data && res.data.voice) {
      let base = res.data.voice;
      return base.endsWith("/rx") ? base : base + "/rx";
    }
  } catch (err) {
    console.error("❌ Failed to fetch base API URL");
    return null;
  }
}