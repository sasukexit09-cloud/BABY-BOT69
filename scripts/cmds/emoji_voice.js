const axios = require("axios");
const fs = require("fs");
const path = require("path");

const statusFile = path.join(__dirname, "emoji_status.json");

// Load or initialize status
let isActive = true;
if (fs.existsSync(statusFile)) {
  const data = JSON.parse(fs.readFileSync(statusFile));
  isActive = data.active;
} else {
  fs.writeFileSync(statusFile, JSON.stringify({ active: true }));
}

module.exports = {
  config: {
    name: "emoji_voice",
    version: "10.2",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "Emoji দিলে কিউট মেয়ের ভয়েস পাঠাবে 😍",
    longDescription: "Send specific emojis to get cute girl voice audios\nUse command 'emoji_voice on/off' to enable/disable.",
    category: "command",
    guide: {
      en: "Use command:\nemoji_voice on → Enable\nemoji_voice off → Disable"
    }
  },

  emojiAudioMap: {
    "🥱": "https://files.catbox.moe/9pou40.mp3",
    "😁": "https://files.catbox.moe/60cwcg.mp3",
    "😌": "https://files.catbox.moe/epqwbx.mp3",
    "🥺": "https://files.catbox.moe/wc17iq.mp3",
    "🤭": "https://files.catbox.moe/cu0mpy.mp3",
    "😅": "https://files.catbox.moe/jl3pzb.mp3",
    "😏": "https://files.catbox.moe/z9e52r.mp3",
    "😞": "https://files.catbox.moe/tdimtx.mp3",
    "🤫": "https://files.catbox.moe/0uii99.mp3",
    "🍼": "https://files.catbox.moe/p6ht91.mp3",
    "🤔": "https://files.catbox.moe/hy6m6w.mp3",
    "🥰": "https://files.catbox.moe/dv9why.mp3",
    "🤦": "https://files.catbox.moe/ivlvoq.mp3",
    "😘": "https://files.catbox.moe/sbws0w.mp3",
    "😑": "https://files.catbox.moe/p78xfw.mp3",
    "😢": "https://files.catbox.moe/shxwj1.mp3",
    "🙊": "https://files.catbox.moe/3bejxv.mp3",
    "🤨": "https://files.catbox.moe/4aci0r.mp3",
    "😡": "https://files.catbox.moe/shxwj1.mp3",
    "🙈": "https://files.catbox.moe/3qc90y.mp3",
    "😍": "https://files.catbox.moe/qjfk1b.mp3",
    "😭": "https://files.catbox.moe/itm4g0.mp3",
    "😱": "https://files.catbox.moe/mu0kka.mp3",
    "😻": "https://files.catbox.moe/y8ul2j.mp3",
    "😿": "https://files.catbox.moe/tqxemm.mp3",
    "💔": "https://files.catbox.moe/6yanv3.mp3",
    "🤣": "https://files.catbox.moe/2sweut.mp3",
    "🥹": "https://files.catbox.moe/jf85xe.mp3",
    "😩": "https://files.catbox.moe/b4m5aj.mp3",
    "🫣": "https://files.catbox.moe/ttb6hi.mp3",
    "🐸": "https://files.catbox.moe/utl83s.mp3"
  },

  // === Command based on/off system ===
  onMessage: async function ({ api, event, args, senderID }) {
    const { threadID, messageID } = event;

    // Command: emoji_voice on/off
    const cmd = args[0]?.toLowerCase();
    if (cmd === "on") {
      isActive = true;
      fs.writeFileSync(statusFile, JSON.stringify({ active: true }));
      return api.sendMessage("Emoji Voice এখন **ON** 😍", threadID, messageID);
    } else if (cmd === "off") {
      isActive = false;
      fs.writeFileSync(statusFile, JSON.stringify({ active: false }));
      return api.sendMessage("Emoji Voice এখন **OFF** 😢", threadID, messageID);
    } else {
      return api.sendMessage("Use: emoji_voice on/off", threadID, messageID);
    }
  },

  onChat: async function ({ api, event }) {
    if (!isActive) return; // If OFF, ignore emoji

    const { threadID, messageID, body } = event;
    if (!body) return;

    const emoji = [...body.trim()][0];
    const audioUrl = this.emojiAudioMap[emoji];
    if (!audioUrl) return;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `${encodeURIComponent(emoji)}.mp3`);

    try {
      if (!fs.existsSync(filePath)) {
        const response = await axios({
          method: "GET",
          url: audioUrl,
          responseType: "stream"
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
      }

      api.sendMessage(
        { attachment: fs.createReadStream(filePath) },
        threadID,
        messageID
      );
    } catch (error) {
      console.error("Error:", error);
      api.sendMessage("ইমোজি দিয়ে লাভ নাই\nযাও মুড়ি খাও জান😘", threadID, messageID);
    }
  }
};
