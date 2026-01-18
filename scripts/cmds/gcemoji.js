module.exports = {
  config: {
    name: "gcemoji",
    aliases: ["groupemoji", "setemoji"],
    version: "1.0.1",
    author: "CYBER BOT TEAM & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Change group chat emoji" },
    category: "box",
    guide: { en: "{pn} [emoji]" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const emoji = args.join(" ");

    // ইমোজি না দিলে মেসেজ দিবে
    if (!emoji) {
      return api.sendMessage("⚠️ আপনি কোন ইমোজি দিতে চান তা লিখুন। উদাহরণ: {pn} 🐸", threadID, messageID);
    }

    // ইমোজি পরিবর্তন করার ফাংশন
    return api.changeThreadEmoji(emoji, threadID, (err) => {
      if (err) {
        return api.sendMessage("❌ ইমোজি পরিবর্তন করতে সমস্যা হয়েছে। নিশ্চিত করুন বট অ্যাডমিন কি না।", threadID, messageID);
      }
      return api.sendMessage(`🔨 সফলভাবে গ্রুপের ইমোজি পরিবর্তন করে ${emoji} করা হয়েছে!`, threadID, messageID);
    });
  }
};