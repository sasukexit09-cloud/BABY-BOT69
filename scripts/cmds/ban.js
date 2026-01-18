module.exports = {
  config: {
    name: "ban",
    version: "4.0.0",
    author: "Ayan & Gemini",
    countDown: 0,
    role: 2, // শুধুমাত্র এডমিনদের জন্য
    shortDescription: { en: "Ban user by mention or reply", bn: "মেনশন বা রিপ্লাই দিয়ে ইউজারকে ব্যান করুন" },
    category: "system",
    guide: { en: "{pn} @mention | or reply to a message with {pn}" }
  },

  onStart: async function ({ api, event, usersData, args }) {
    const { threadID, messageID, mentions, messageReply, senderID } = event;
    let targetID;

    // ১. টার্গেট ইউজার আইডি খুঁজে বের করা
    if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (messageReply) {
      targetID = messageReply.senderID;
    } else {
      return api.sendMessage("❌ কাকে ban করবেন? মেনশন দিন অথবা মেসেজে রিপ্লাই করুন!", threadID, messageID);
    }

    // বটের নিজের আইডি বা এডমিন আইডি ব্যান করা থেকে সুরক্ষা
    if (targetID == api.getCurrentUserID()) return api.sendMessage("❌ আমি নিজেকে ব্যান করতে পারব না!", threadID, messageID);
    
    try {
      // ২. GoatBot ডাটাবেসে ব্যান স্ট্যাটাস আপডেট করা
      const userData = await usersData.get(targetID);
      const name = userData.name || "User";

      const banData = {
        banned: true,
        reason: args.join(" ") || "Manual BAN by admin",
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
      };

      // ডাটাবেসে সেভ করা
      await usersData.set(targetID, {
        banned: true,
        data: { ...userData.data, banInfo: banData }
      });

      // ৩. এডমিনদের নোটিফিকেশন পাঠানো
      const adminList = global.GoatBot.config.adminBot || [];
      for (const adminID of adminList) {
        api.sendMessage(
          `=== BAN Notification ===\n👤 Name: ${name}\n🆔 UID: ${targetID}\n🚫 Status: BANNED\n📅 Time: ${banData.date}\n📝 Reason: ${banData.reason}`,
          adminID
        );
      }

      // ৪. সাকসেস মেসেজ
      return api.sendMessage(
        `✅ Successfully BANNED!\n\n🔰 Name: ${name}\n🆔 UID: ${targetID}\n📝 Reason: ${banData.reason}`,
        threadID,
        messageID
      );

    } catch (err) {
      console.error(err);
      return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
  }
};