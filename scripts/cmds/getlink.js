module.exports = {
  config: {
    name: "getlink",
    aliases: ["link"],
    version: "1.0.2",
    author: "CYBER BOT TEAM & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { 
      en: "Get direct download link from attachments",
      bn: "অ্যাটাচমেন্ট থেকে সরাসরি ডাউনলোড লিঙ্ক বের করুন" 
    },
    category: "tool",
    guide: { en: "Reply to an image, video, or audio with {pn}" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, type, messageReply } = event;

    // ১. চেক করা হচ্ছে এটি রিপ্লাই কি না
    if (type !== "message_reply") {
      return api.sendMessage("❌ দয়া করে একটি ছবি, ভিডিও বা অডিওর রিপ্লাইয়ে কমান্ডটি লিখুন!", threadID, messageID);
    }

    // ২. অ্যাটাচমেন্ট আছে কি না চেক করা
    if (!messageReply.attachments || messageReply.attachments.length == 0) {
      return api.sendMessage("❌ আপনি যে মেসেজে রিপ্লাই দিয়েছেন তাতে কোনো ফাইল নেই!", threadID, messageID);
    }

    // ৩. একের অধিক ফাইল থাকলে সতর্কতা (ঐচ্ছিক, তবে ১টির জন্য পারফেক্ট)
    if (messageReply.attachments.length > 1) {
      return api.sendMessage("⚠️ দয়া করে শুধুমাত্র ১টি ফাইলের রিপ্লাই দিন!", threadID, messageID);
    }

    try {
      const downloadLink = messageReply.attachments[0].url;

      // ৪. লিঙ্কটি পাঠানো
      return api.sendMessage(`🔗 আপনার ফাইলের ডাউনলোড লিঙ্ক:\n\n${downloadLink}`, threadID, messageID);
      
    } catch (error) {
      return api.sendMessage("❌ লিঙ্কটি বের করতে সমস্যা হয়েছে!", threadID, messageID);
    }
  }
};