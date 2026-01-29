const axios = require("axios");

let cachedBaseUrl = null;
const baseApiUrl = async () => {
  if (cachedBaseUrl) return cachedBaseUrl;
  const res = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
  );
  cachedBaseUrl = res.data.mahmud;
  return cachedBaseUrl;
};

module.exports = {
  config: {
    name: "say",
    version: "2.2",
    author: "AYAN BBE💋 | fixed by Maya",
    countDown: 5,
    role: 0, // সবাই ইউজ করতে পারবে
    category: "media",
    guide: "{pn} <text> (or reply)",
  },

  onStart: async function ({ message, args, event }) {
    // ===== TEXT COLLECT =====
    let text = (args.join(" ") || event.messageReply?.body || "").trim();
    if (!text) {
      return message.reply(
        "⚠️ দয়া করে কিছু লিখুন বা একটি মেসেজে রিপ্লাই দিন!"
      );
    }

    try {
      // ===== API CALL =====
      const baseUrl = await baseApiUrl();
      const response = await axios.get(`${baseUrl}/api/say`, {
        params: { text },
        headers: {
          Author: module.exports.config.author,
        },
        responseType: "stream",
        timeout: 20000,
      });

      // ===== SEND RESULT =====
      return message.reply({
        body: "",
        attachment: response.data,
      });

    } catch (e) {
      console.error("[SAY ERROR]", e.message);
      return message.reply(
        "🐥 দুঃখিত, অডিও তৈরি করা যায়নি!\n" +
        (e.response?.data?.error || e.message)
      );
    }
  },
};
