const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

const dataPath = path.join(__dirname, "../../data/logs2_data.json");

// ডাটা লোড বা তৈরি করা
if (!fs.existsSync(dataPath)) {
  fs.outputJsonSync(dataPath, { banned: [], warnings: {} });
}

module.exports = {
  config: {
    name: "logs2",
    version: "4.5",
    author: "GPT & MIKON",
    category: "events",
    envConfig: {
      logGroupID: "1453292846261675", // আপনার লগ গ্রুপ আইডি
      adminUIDs: ["61577428435222"] // অ্যাডমিন আইডি
    }
  },

  onEvent: async function ({ event, api, usersData, threadsData }) {
    const { logGroupID, adminUIDs } = this.config.envConfig;
    const { senderID, threadID, body, type, logMessageType, logMessageData } = event;
    
    if (senderID === api.getCurrentUserID()) return;

    let data = fs.readJsonSync(dataPath);
    const time = moment.tz("Asia/Dhaka").format("HH:mm:ss");

    // --- [ ১. BAN CHECK ] ---
    if (data.banned.includes(senderID) && body && body.startsWith("/")) {
      return api.sendMessage(`🚫 আপনি এই বোট থেকে নিষিদ্ধ (Banned)!`, threadID);
    }

    // --- [ ২. ADMIN REMOVAL PROTECT ] ---
    if (logMessageType === "log:unsubscribe") {
      const leftID = logMessageData?.leftParticipantFbId;
      if (adminUIDs.includes(leftID)) {
        const msg = `🚨 ADMIN ALERT!\n❌ একজন অ্যাডমিনকে রিমুভ করা হয়েছে!\n🆔 UID: ${leftID}\n🕒 সময়: ${time}`;
        api.sendMessage(msg, logGroupID);
      }
    }

    // --- [ ৩. SPAM & NSFW DETECTION ] ---
    if (type === "message" && body) {
      const prefix = "/"; // আপনার বটের প্রিফিক্স
      if (!body.startsWith(prefix)) return;

      const args = body.slice(prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      // --- অটো ব্যান সিস্টেম (Spam) ---
      if (!global.spamTracker) global.spamTracker = new Map();
      let userSpam = global.spamTracker.get(senderID) || [];
      const now = Date.now();
      userSpam.push(now);
      userSpam = userSpam.filter(t => now - t < 15000); // ১৫ সেকেন্ডের উইন্ডো
      global.spamTracker.set(senderID, userSpam);

      if (userSpam.length > 5 && !adminUIDs.includes(senderID)) {
        if (!data.banned.includes(senderID)) {
          data.banned.push(senderID);
          fs.writeJsonSync(dataPath, data);
          api.sendMessage(`🚨 AUTO BAN!\nUser: ${senderID}\nReason: Spamming Commands.`, logGroupID);
          return api.sendMessage("🚫 আপনি স্প্যাম করার কারণে অটো ব্যান হয়েছেন!", threadID);
        }
      }

      // --- NSFW/18+ প্রোটেকশন ---
      const adultCommands = ["18+", "nsfw", "xxx", "sex", "porn"];
      if (adultCommands.includes(command) && !adminUIDs.includes(senderID)) {
        let warnCount = (data.warnings[senderID] || 0) + 1;
        data.warnings[senderID] = warnCount;

        if (warnCount >= 3) {
          data.banned.push(senderID);
          delete data.warnings[senderID];
          fs.writeJsonSync(dataPath, data);
          api.sendMessage(`🚫 User ${senderID} banned for 18+ keyword usage.`, logGroupID);
          return api.sendMessage("🚫 আপনি ৩ বার নিষিদ্ধ কমান্ড ব্যবহারের কারণে ব্যান হয়েছেন!", threadID);
        } else {
          fs.writeJsonSync(dataPath, data);
          return api.sendMessage(`⚠️ Warning ${warnCount}/3: NSFW কমান্ড ব্যবহার নিষিদ্ধ!`, threadID);
        }
      }

      // --- [ ৪. কমান্ডস: UNBAN & KICK ] ---
      // যেহেতু এটি ইভেন্ট ফাইল, এখানে আমরা ম্যানুয়ালি কমান্ড চেক করছি
      if (command === "unban" && adminUIDs.includes(senderID)) {
        const targetID = args[0];
        if (!targetID) return api.sendMessage("⚠️ UID দিন।", threadID);
        data.banned = data.banned.filter(id => id !== targetID);
        fs.writeJsonSync(dataPath, data);
        return api.sendMessage(`✅ User ${targetID} কে আনব্যান করা হয়েছে।`, threadID);
      }

      if (command === "kick" && adminUIDs.includes(senderID)) {
        const targetID = Object.keys(event.mentions)[0] || args[0];
        if (!targetID) return api.sendMessage("⚠️ ইউজার মেনশন করুন বা UID দিন।", threadID);
        return api.removeUserFromGroup(targetID, threadID);
      }
    }
  }
};