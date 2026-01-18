const axios = require("axios");

module.exports = {
  config: {
    name: "bn",
    version: "1.1.0",
    author: "Islamick Cyber Chat & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Translate text to Bengali" },
    category: "media",
    guide: { en: "{pn} [text] or reply to a message" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;
    let translateThis = "";

    // ১. টেক্সট নির্ধারণ (রিপ্লাই অথবা আর্গুমেন্ট)
    if (type === "message_reply") {
      translateThis = messageReply.body;
    } else if (args.length > 0) {
      translateThis = args.join(" ");
    } else {
      return api.sendMessage("⚠️ দয়া করে কিছু লিখুন অথবা কোনো মেসেজে রিপ্লাই দিয়ে কমান্ডটি দিন।", threadID, messageID);
    }

    try {
      // ২. গুগল ট্রান্সলেট এপিআই কল (সরাসরি বাংলাতে ট্রান্সলেট করবে)
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=bn&dt=t&q=${encodeURIComponent(translateThis)}`;
      
      const res = await axios.get(url);
      const translation = res.data[0].map(item => item[0]).join("");
      const fromLang = res.data[2]; // কোন ভাষা থেকে ট্রান্সলেট হয়েছে

      // ৩. মেসেজ পাঠানো
      return api.sendMessage(translation, threadID, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ ট্রান্সলেশন করার সময় একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।", threadID, messageID);
    }
  }
};