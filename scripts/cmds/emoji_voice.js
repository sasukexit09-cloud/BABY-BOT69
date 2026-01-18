const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const statusFile = path.join(process.cwd(), "scripts/cmds/cache/emoji_status.json");

module.exports = {
  config: {
    name: "emoji_voice",
    version: "10.5",
    author: "Hasib & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Emoji দিলে কিউট মেয়ের ভয়েস পাঠাবে 😍" },
    category: "fun",
    guide: { en: "{pn} on/off" }
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
    "🤔": "https://files.catbox.moe/hy6m6w.mp3",
    "🥰": "https://files.catbox.moe/dv9why.mp3",
    "😘": "https://files.catbox.moe/sbws0w.mp3",
    "😍": "https://files.catbox.moe/qjfk1b.mp3",
    "😭": "https://files.catbox.moe/itm4g0.mp3",
    "🤣": "https://files.catbox.moe/2sweut.mp3",
    "🥹": "https://files.catbox.moe/jf85xe.mp3",
    "🐸": "https://files.catbox.moe/utl83s.mp3"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    if (!fs.existsSync(path.dirname(statusFile))) fs.mkdirSync(path.dirname(statusFile), { recursive: true });

    let status = fs.existsSync(statusFile) ? JSON.parse(fs.readFileSync(statusFile)) : { active: true };
    const cmd = args[0]?.toLowerCase();

    if (cmd === "on") {
      status.active = true;
      fs.writeFileSync(statusFile, JSON.stringify(status));
      return api.sendMessage("✅ Emoji Voice এখন ON করা হয়েছে!", threadID, messageID);
    } else if (cmd === "off") {
      status.active = false;
      fs.writeFileSync(statusFile, JSON.stringify(status));
      return api.sendMessage("❌ Emoji Voice এখন OFF করা হয়েছে!", threadID, messageID);
    } else {
      return api.sendMessage(`ব্যবহারবিধি: emoji_voice on/off\nবর্তমান অবস্থা: ${status.active ? "ON" : "OFF"}`, threadID, messageID);
    }
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    // স্ট্যাটাস চেক
    let status = fs.existsSync(statusFile) ? JSON.parse(fs.readFileSync(statusFile)) : { active: true };
    if (!status.active) return;

    const emoji = [...body.trim()][0];
    const audioUrl = this.emojiAudioMap[emoji];
    if (!audioUrl) return;

    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `voice_${Date.now()}.mp3`);

    try {
      const response = await axios({
        method: "GET",
        url: audioUrl,
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID, () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, messageID);
      });
    } catch (error) {
      console.error("Emoji Voice Error:", error);
    }
  }
};