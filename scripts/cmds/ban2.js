module.exports = {
  config: {
    name: "ban2",
    version: "2.5.0",
    author: "SHAHADAT SAHU & Gemini",
    countDown: 5,
    role: 2, // শুধুমাত্র এডমিনরা ব্যবহার করতে পারবে
    shortDescription: { en: "Ban or Unban a user directly" },
    longDescription: { en: "Manage user access by banning or unbanning them via reply, mention, or UID." },
    category: "system",
    guide: { en: "{pn} ban <UID/@tag> | {pn} unban <UID/@tag> | reply to a message" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, messageReply, mentions } = event;

    // ১. আর্গুমেন্ট চেক
    if (!args[0] && !messageReply) {
      return api.sendMessage("❌ সঠিক ব্যবহার: ban/unban <UID/@tag> অথবা মেসেজে রিপ্লাই দিন।", threadID, messageID);
    }

    const subCommand = args[0]?.toLowerCase();
    let targetID;

    // ২. টার্গেট ইউজার আইডি নির্ধারণ
    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      targetID = args[1] || args[0]; // যদি UID সরাসরি দেওয়া হয়
    }

    if (!targetID || isNaN(targetID)) {
      return api.sendMessage("⚠️ দয়া করে একটি বৈধ UID, মেনশন অথবা রিপ্লাই ব্যবহার করুন।", threadID, messageID);
    }

    try {
      const userData = await usersData.get(targetID);
      if (!userData) return api.sendMessage("❌ এই আইডিটি ডাটাবেসে পাওয়া যায়নি।", threadID, messageID);
      
      const name = userData.name || "User";

      // ৩. BAN লজিক
      if (subCommand === "ban" || args.includes("ban")) {
        if (targetID == api.getCurrentUserID()) return api.sendMessage("❌ আমি নিজেকে ব্যান করতে পারব না!", threadID, messageID);

        await usersData.set(targetID, {
          banned: true,
          data: { 
            ...userData.data, 
            banInfo: {
              reason: "Manual ban",
              date: new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })
            }
          }
        });
        return api.sendMessage(`🚫 [ Ban User ]\nইউজার: ${name}\nআইডি: ${targetID}\nস্ট্যাটাস: সফলভাবে ব্যান করা হয়েছে।`, threadID, messageID);
      }

      // ৪. UNBAN লজিক
      else if (subCommand === "unban" || args.includes("unban")) {
        if (!userData.banned) return api.sendMessage(`ℹ️ ইউজার ${name} আগে থেকেই আনব্যান আছে।`, threadID, messageID);

        await usersData.set(targetID, {
          banned: false,
          data: { ...userData.data, banInfo: {} }
        });
        return api.sendMessage(`✅ [ Unban User ]\nইউজার: ${name}\nআইডি: ${targetID}\nস্ট্যাটাস: আনব্যান করা হয়েছে।`, threadID, messageID);
      }

      else {
        return api.sendMessage("❓ আপনি কি 'ban' করতে চান নাকি 'unban'? পরিষ্কারভাবে লিখুন।", threadID, messageID);
      }

    } catch (err) {
      console.error(err);
      return api.sendMessage(`❌ এরর: ${err.message}`, threadID, messageID);
    }
  }
};