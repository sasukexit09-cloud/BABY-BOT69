module.exports = {
  config: {
    name: "gali",
    version: "1.0.5",
    author: "𝐈𝐬𝐥𝐚𝐦𝐢𝐜𝐤 𝐂𝐲𝐛𝐞𝐫 & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Auto reply for haters (No Prefix)" },
    category: "no prefix",
    guide: { en: "Just type the specific keyword in chat." }
  },

  // এই ফাংশনটি প্রতিটি মেসেজ চেক করবে
  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    // কিউওয়ার্ড লিস্ট (এখানে আপনার দেওয়া শব্দগুলো আছে)
    const badWords = [
      "Ayan Bokasoda", "Ayan mc", "chod", "Ayan nodir pola", 
      "bc", "Ayan re chudi", "ayan re chod", "Ayan Abal", 
      "Ayan Boakachoda", "Ayan madarchod", "ayan Bokachoda"
    ];

    // চেক করা হচ্ছে মেসেজে এই শব্দগুলোর কোনোটি আছে কি না
    const isMatched = badWords.some(word => body.toLowerCase().includes(word.toLowerCase()));

    if (isMatched) {
      const responseMsg = "তোর মতো বোকাচোদা রে আমার বস আয়ান চু** বাদ দিছে🤣\nআয়ান এখন আর hetars চুষে না🥱😈";
      
      // বটের রিপ্লাই এবং সাথে একটি ইমোজি রিঅ্যাকশন
      return api.sendMessage(responseMsg, threadID, () => {
        api.setMessageReaction("🔥", messageID, (err) => {}, true);
      }, messageID);
    }
  },

  // এটি খালি থাকবে কারণ এটি কমান্ড হিসেবে নয়, ইভেন্ট হিসেবে কাজ করবে
  onStart: async function () {}
};