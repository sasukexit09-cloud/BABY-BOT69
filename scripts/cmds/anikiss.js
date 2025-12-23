const axios = require("axios");

module.exports = {
  config: {
    name: "anikiss",
    aliases: ["kiss", "akiss"],
    version: "2.1",
    author: "Maya",
    role: 0,
    shortDescription: "AI Kiss Video 💋",
    longDescription: "১ জন mention করলে sender তাকে AI kiss video দেবে",
    category: "fun",
    guide: {
      en: "{pn} @mention"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const { threadID, messageID, senderID, mentions } = event;

      // mention check
      if (Object.keys(mentions).length === 0) {
        return api.sendMessage(
          "❌ Kiss দিতে হলে কাউকে @mention করো 😘",
          threadID,
          messageID
        );
      }

      const targetID = Object.keys(mentions)[0];
      const targetName = mentions[targetID];

      // sender name
      const senderInfo = await api.getUserInfo(senderID);
      const senderName = senderInfo[senderID].name;

      // Kiss video (gif/mp4 supported by FB)
      const res = await axios.get("https://api.waifu.pics/sfw/kiss");
      const videoURL = res.data.url;

      return api.sendMessage(
        {
          body: `💋 ${senderName} তোমাকে একটা kiss দিলো ${targetName} 😘`,
          attachment: await global.utils.getStreamFromURL(videoURL)
        },
        threadID,
        messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ Kiss video পাঠাতে সমস্যা হয়েছে 😢",
        event.threadID,
        event.messageID
      );
    }
  }
};
