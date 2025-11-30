const axios = require("axios");

module.exports = {
  config: {
    name: "ai",
    version: "1.0.2",
    credit: "𝐁𝐀𝐁𝐘 𝐁𝐎𝐓 𝐓𝐄𝐀𝐌 (Optimized by Maya)",
    description: "Google AI Chatbot",
    cooldowns: 0,
    hasPermssion: 0,
    commandCategory: "google",
    usages: {
      en: "{pn} message | photo reply"
    }
  },

  // 🔥 Onstart added (prevents "onstart missing" crash)
  onStart: async () => {},

  run: async ({ api, args, event }) => {
    const input = args.join(" ");

    const encodedApi = "aHR0cHM6Ly9hcGlzLWtlaXRoLnZlcmNlbC5hcHAvYWkvZGVlcHNlZWtWMz9xPQ==";
    const apiUrl = Buffer.from(encodedApi, "base64").toString("utf-8");

    const cuteError = [
      "😿 Oops! Something just meowed wrong!",
      "🌸💫 AI ta ektu ঘুমাচ্ছে… try again!",
      "😖✨ Awww!! System ta ektu লজ্জা পেয়েছে…",
      "🐰💗 Uh-oh! AI bunny slipped! Try again!",
      "🌈🥺 Sorry! Connection ta রাগ করেছে!"
    ];
    const randomError = cuteError[Math.floor(Math.random() * cuteError.length)];

    // --- Image Mode ---
    if (event.type === "message_reply") {
      try {
        const img = event.messageReply.attachments[0]?.url;
        if (!img)
          return api.sendMessage("📸 Please reply to an image.", event.threadID, event.messageID);

        const res = await axios.post(`${apiUrl}${encodeURIComponent(input || "Describe this image.")}`, {
          image: img
        });

        const result =
          res.data.result ||
          res.data.response ||
          res.data.message ||
          "🤖 No response from AI.";

        return api.sendMessage(result, event.threadID, event.messageID);

      } catch (err) {
        console.error(err.message);
        return api.sendMessage(randomError, event.threadID, event.messageID);
      }
    }

    // --- Text Mode ---
    if (!input) {
      return api.sendMessage(
        "🤖 Hey I'm Ai Chat Bot\n✨ How can I assist you today?",
        event.threadID,
        event.messageID
      );
    }

    try {
      const res = await axios.get(`${apiUrl}${encodeURIComponent(input)}`);
      const result =
        res.data.result ||
        res.data.response ||
        res.data.message ||
        "🤖 No response from AI.";

      return api.sendMessage(result, event.threadID, event.messageID);

    } catch (err) {
      console.error(err.message);
      return api.sendMessage(randomError, event.threadID, event.messageID);
    }
  }
};
