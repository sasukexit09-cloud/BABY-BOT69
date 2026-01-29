// dl.js
const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "dl",
    aliases: ["download"],
    version: "1.1",
    author: "♡︎ 𝐻𝐴𝑆𝐴𝑁 ♡︎",
    countDown: 2,
    role: 0,
    description: {
      en: "Download 1000+ website's videos safely",
    },
    category: "media",
    guide: {
      en: "{pn} [url | reply to an url]",
    },
  },

  onStart: async function ({ api, args, event }) {
    try {
      const url = event.messageReply?.body || args[0];

      // URL validation
      const isValidURL = url => /^https?:\/\/\S+$/.test(url);
      if (!url || !isValidURL(url)) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(
          "⁉️ | Please provide a valid URL or reply to an URL",
          event.threadID,
          event.messageID
        );
      }

      // GitHub JSON থেকে base API লোড করা
      let hasan = "https://default-dl-api.example.com"; // fallback
      try {
        const { data } = await axios.get(
          "https://raw.githubusercontent.com/KingsOfToxiciter/alldl/refs/heads/main/toxicitieslordhasan.json"
        );
        if (data?.hasan) hasan = data.hasan;
      } catch {
        console.warn("⚠️ GitHub API failed, using fallback URL");
      }

      const downloadLink = `${hasan}/alldl?url=${encodeURIComponent(url)}`;

      // ভিডিও স্ট্রিম আনা
      const stream = await global.utils.getStreamFromURL(downloadLink);

      // বড় ভিডিও চেক (50MB limit)
      if (stream.length && stream.length > 50 * 1024 * 1024) {
        return api.sendMessage(
          "❌ | Video is too large to download (max 50MB)",
          event.threadID,
          event.messageID
        );
      }

      // ভিডিও পাঠানো
      await api.sendMessage(
        {
          body: "✨ | Here is your Downloaded video!",
          attachment: stream,
        },
        event.threadID,
        event.messageID
      );

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❎", event.messageID, () => {}, true);
      api.sendMessage(
        `❌ | Something went wrong:\n${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  },
};
