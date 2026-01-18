module.exports = {
  config: {
    name: "gcname",
    aliases: ["groupname", "rename"],
    version: "1.0.1",
    author: "CYBER BOT TEAM & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Rename your group chat" },
    category: "box",
    guide: { en: "{pn} [new name]" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const newName = args.join(" ");

    // ১. চেক করা হচ্ছে নাম দেওয়া হয়েছে কি না
    if (!newName) {
      return api.sendMessage("❌ আপনি গ্রুপের কি নাম দিতে চান তা লিখুন।\nউদাহরণ: {pn} আড্ডা ঘর", threadID, messageID);
    }

    // ২. গ্রুপের নাম পরিবর্তন করার ফাংশন (setTitle)
    return api.setTitle(newName, threadID, (err) => {
      if (err) {
        return api.sendMessage("❌ নাম পরিবর্তন করতে সমস্যা হয়েছে। নিশ্চিত করুন বট গ্রুপের অ্যাডমিন কি না।", threadID, messageID);
      }
      
      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(`🔨 সফলভাবে গ্রুপের নাম পরিবর্তন করে "${newName}" রাখা হয়েছে!`, threadID, messageID);
    });
  }
};