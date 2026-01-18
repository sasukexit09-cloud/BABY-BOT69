const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "fixspam",
    version: "1.2.0",
    author: "AYAN & Gemini",
    countDown: 0,
    role: 0,
    shortDescription: { en: "Auto-ban users for using banned words" },
    category: "system"
  },

  handleEvent: async function ({ api, event, usersData }) {
    const { threadID, messageID, body, senderID } = event;

    // যদি কোনো টেক্সট না থাকে বা বট নিজে মেসেজ দেয় তবে ইগনোর করবে
    if (!body || senderID === api.getCurrentUserID()) return;

    const bannedWords = [
      "chudi", "Madarchud bot", "chudna bot", "bot bokachuda", "bot tor boss re chudi",
      "মাদারচোদ বট", "ভোদার বট", "ধোনের বট", "তোর বস রে চুদি", "আয়ান রে চুদি",
      "sahadat mc", "mc Sahu", "bokachoda sahu", "fuck you", "sex", "sexy",
      "hedar bot", "বট চুদি", "crazy bot", "bc bot", "khankir polar bot",
      "bot tor heda", "হেড়ার বট", "bot lon", "x video", "xx", "bot sudi", "bot sida"
    ];

    // চেক করা হচ্ছে মেসেজে নিষিদ্ধ শব্দ আছে কি না
    const lowerBody = body.toLowerCase();
    const foundWord = bannedWords.find(word => lowerBody.includes(word.toLowerCase()));

    if (foundWord) {
      try {
        const userData = await usersData.get(senderID);
        const name = userData.name || "Unknown User";
        const time = moment.tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY");

        // ১. ইউজারকে ব্যান করা (GoatBot Database Update)
        await usersData.set(senderID, {
          banned: true,
          reason: `Auto-ban: used word "${foundWord}"`,
          dateBanned: time
        });

        // ২. ইউজারকে মেসেজ পাঠানো
        const warning = `» Notice from Owner AYAN «\n\nHey ${name}!\nYou have been automatically banned from using this bot for using toxic language: "${foundWord}"`;
        api.sendMessage(warning, threadID, messageID);

        // ৩. এডমিনকে নোটিফিকেশন পাঠানো
        const adminIDs = global.GoatBot.config.adminBot || [];
        const notifyMsg = `=== Bot Notification ===\n\n🆘 User: ${name}\n🆔 UID: ${senderID}\n🚫 Word: ${foundWord}\n⏰ Time: ${time}\n\nStatus: Banned from System.`;
        
        for (const adminID of adminIDs) {
          api.sendMessage(notifyMsg, adminID);
        }

        console.log(`[BAN-SYSTEM] ${name} banned for: ${foundWord}`);
      } catch (err) {
        console.error("Ban Error:", err);
      }
    }
  },

  onStart: async function ({ api, event }) {
    // !fixspam লিখলে এই মেসেজটি আসবে
    return api.sendMessage(
      "( \\_/)\n( •_•)\n// >🧠\n\nUse your brain! This is an automatic monitoring system. Don't try to abuse the bot.",
      event.threadID,
      event.messageID
    );
  }
};