*cmd install ai.js const axios = require("axios");

module.exports = {
  config: {
    name: "ai2",
    aliases: ["gemini"],
    version: "1.0",
    author: "AYAN",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "AI chat using Gemini API"
    },
    description: {
      en: "Chat with AI using gemini-api-by-sagor"
    },
    category: "ai",
    guide: {
      en: "{p}ai <your question>"
    }
  },

  onStart: async function ({ message, args }) {
    try {
      const text = args.join(" ");
      if (!text) {
        return message.reply("❌ Please type something.\nExample: ai Hello");
      }

      message.reply("🤖 Thinking...");

      const url = `https://gemini-api-by-sagor.vercel.app/api/chat?text=${encodeURIComponent(text)}`;
      const res = await axios.get(url);

      const reply =
        res.data?.response ||
        res.data?.reply ||
        res.data?.result ||
        "⚠️ No response from API";

      return message.reply(reply);

    } catch (err) {
      return message.reply("❌ Error occurred while contacting AI API.");
    }
  }
};