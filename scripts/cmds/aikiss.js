const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "aikiss",
    aliases: ["akissv", "kissvid"],
    version: "1.1",
    author: "Maya",
    role: 0,
    shortDescription: "AI cartoon kiss video 💋",
    longDescription: "CMD user + mention করা user এর AI kissing video বানাবে",
    category: "fun",
    guide: {
      en: "{pn} @someone"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const { senderID, mentions, threadID, messageID } = event;

      // only 1 mention required
      const mentionIDs = Object.keys(mentions);
      if (mentionIDs.length < 1) {
        return api.sendMessage(
          "❌ একজনকে mention করো 😘\nExample: anikissvideo @crush",
          threadID,
          messageID
        );
      }

      const uid1 = senderID;        // cmd user
      const uid2 = mentionIDs[0];   // mentioned user

      // Cartoon avatars (safe)
      const avatar1 = `https://api.multiavatar.com/${uid1}.png`;
      const avatar2 = `https://api.multiavatar.com/${uid2}.png`;

      api.sendMessage(
        "🎨 Cartoon avatar বানাচ্ছি...\n💋 AI kiss video তৈরি হচ্ছে...",
        threadID
      );

      // AI kissing video API (example / replaceable)
      const res = await axios.post(
        "https://api.aivideo.fun/kiss",
        {
          avatar1: avatar1,
          avatar2: avatar2,
          style: "anime",
          duration: 5
        },
        { responseType: "arraybuffer" }
      );

      const videoPath = path.join(
        __dirname,
        "cache",
        `anikiss_${Date.now()}.mp4`
      );
      fs.writeFileSync(videoPath, res.data);

      api.sendMessage(
        {
          body: "💞 Love is in the air 💞",
          attachment: fs.createReadStream(videoPath)
        },
        threadID,
        () => fs.unlinkSync(videoPath),
        messageID
      );

    } catch (err) {
      api.sendMessage(
        "❌ AI লজ্জা পেয়ে গেল 😳\nপরে আবার চেষ্টা করো",
        event.threadID,
        event.messageID
      );
    }
  }
};
