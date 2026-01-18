module.exports = {
  config: {
    name: "antijoin",
    version: "1.0.0",
    author: "BABY BOT TEAM & Gemini",
    countDown: 5,
    role: 1, // Admin only
    shortDescription: {
      en: "Enable/Disable Anti-Join"
    },
    longDescription: {
      en: "When enabled, the bot will automatically kick new members who join the group."
    },
    category: "system",
    guide: {
      en: "{pn} on/off"
    }
  },

  onStart: async function ({ api, event, threadsData, message }) {
    const { threadID, messageID } = event;
    
    // ১. চেক করা বট গ্রুপ এডমিন কি না
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const isAdmin = threadInfo.adminIDs.some(item => item.id == botID);

    if (!isAdmin) {
      return message.reply("⚠️ [ 𝐀𝐍𝐓𝐈 𝐉𝐎𝐈𝐍 ] » বটের গ্রুপ এডমিন পারমিশন প্রয়োজন। দয়া করে বটকে এডমিন বানিয়ে আবার চেষ্টা করুন।");
    }

    try {
      // ২. ডেটাবেস থেকে বর্তমান সেটিংস নেওয়া
      const data = await threadsData.get(threadID);
      const isAntiJoin = data.settings?.antijoin || false;

      // ৩. অন/অফ লজিক
      const newState = !isAntiJoin;

      await threadsData.set(threadID, {
        "settings.antijoin": newState
      });

      return message.reply(`[ 𝐀𝐍𝐓𝐈 𝐉𝐎𝐈𝐍 ] » 𝗔𝗻𝘁𝗶 𝗝𝗼𝗶𝗻 এখন ${(newState) ? "𝗢𝗻 ✅" : "𝗢𝗳𝗳 ❌"} করা হয়েছে।`);
    } catch (e) {
      console.error(e);
      return message.reply("❌ ডেটাবেস আপডেট করতে সমস্যা হয়েছে।");
    }
  }
};