module.exports = {
  config: {
    name: "gali",
    version: "1.0.2",
    author: "CYBER BOT TEAM",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Auto reply on specific keywords (No Prefix)" },
    category: "no prefix",
    guide: { en: "Just type the keyword" }
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    // কিউওয়ার্ড লিস্ট (সহজে মেইনটেইন করার জন্য অ্যারে ব্যবহার করা হয়েছে)
    const keywords = [
      "Ayan Bokasoda", "Ayan mc", "chod", "Ayan nodir pola", 
      "bc", "Ayan re chudi", "ayan re chod", "Ayan Abal", 
      "Ayan Boakachoda", "Ayan madarchod", "ayan Bokachoda"
    ];

    // চেক করা হচ্ছে মেসেজের বডিতে এই শব্দগুলো আছে কি না
    const containsKeyword = keywords.some(word => body.toLowerCase().includes(word.toLowerCase()));

    if (containsKeyword) {
      const msg = "তোর মতো বোকাচোদা রে আমার বস আয়ান চু** বাদ দিছে🤣\nআয়ান এখন আর hetars চুষে না🥱😈";
      
      return api.sendMessage(msg, threadID, messageID);
    }
  },

  onStart: async function () {
    // এটি খালি থাকবে কারণ এটি শুধু চ্যাট ইভেন্টে কাজ করবে
  }
};