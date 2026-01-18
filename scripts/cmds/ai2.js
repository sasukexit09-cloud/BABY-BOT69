const axios = require("axios");

module.exports = {
  config: {
    name: "ai2",
    aliases: ["gemini", "ayan"],
    version: "1.1",
    author: "AYAN & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "AI chat using Gemini API"
    },
    longDescription: {
      en: "Chat with AI using gemini-api-by-sagor"
    },
    category: "ai",
    guide: {
      en: "{pn} <your question>"
    }
  },

  onStart: async function ({ message, args, event }) {
    const { threadID, messageID } = event;
    const text = args.join(" ");

    if (!text) {
      return message.reply("❌ Please provide a question!\nExample: ai2 how are you?");
    }

    try {
      // এপিআই কল করার আগে একটি 'Thinking' রিঅ্যাকশন বা মেসেজ দিলে ভালো হয়
      const waitingMsg = await message.reply("🔍 𝐀𝐈 𝐢𝐬 𝐭𝐲𝐩𝐢𝐧𝐠...");

      const url = `https://gemini-api-by-sagor.vercel.app/api/chat?text=${encodeURIComponent(text)}`;
      const res = await axios.get(url);

      // এপিআই থেকে ডেটা নেওয়ার বিভিন্ন সম্ভাবনা চেক করা
      const reply = res.data?.response || res.data?.reply || res.data?.result;

      if (!reply) {
        return message.reply("⚠️ No response received from the AI server.");
      }

      // আগের 'Thinking' মেসেজটি এডিট বা ডিলিট না করে সরাসরি উত্তর পাঠানো
      return message.reply(reply);

    } catch (err) {
      console.error("AI Command Error:", err);
      return message.reply("❌ এপিআই সার্ভারে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।");
    }
  }
};