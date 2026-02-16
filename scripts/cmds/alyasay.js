

const axios = require("axios");

module.exports = {
  config: {
    name: "alyasay",
    aliases: ["alyagotto"],
    version: "1.2",
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴",
    shortDescription: "Generate audio",
    longDescription: "Send text or reply to a message",
    category: "momoi",
    guide: "{p}omaigotto <text> or reply to a message with {p}omaigotto",
  },

  onStart: async function ({ api, event, message, args }) {
    try {
      const text = args.join(" ") || event.messageReply?.body;
      if (!text) return message.reply("provide some text..!");

      // Safely set reaction (ignore errors)
      try {
        api.setMessageReaction("🍓", event.messageID, () => {}, true);
      } catch (_) {}

      const audioUrl = `https://xihad-4-x.vercel.app/Tools/Momoi?txt=${encodeURIComponent(text)}&apikey=dhn`;

      const response = await axios({
        url: audioUrl,
        method: "GET",
        responseType: "stream"
      });

      await message.reply({
        body: `Take alya love bbe🍓😫`,
        attachment: response.data,
      });

      try {
        api.setMessageReaction("🩷🍓🍨", event.messageID, () => {}, true);
      } catch (_) {}

    } catch (error) {
      console.error("omaigotto error:", error);
      try {
        api.setMessageReaction("🍭🍎🍒", event.messageID, () => {}, true);
      } catch (_) {}
      return message.reply("Failed to generate audio ❌");
    }
  },
};