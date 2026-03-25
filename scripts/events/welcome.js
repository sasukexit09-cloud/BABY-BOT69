const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "4.0",
    author: "𝙰𝚈𝙰𝙽",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const newUsers = logMessageData.addedParticipants;
    const authorID = logMessageData.author; // যে অ্যাড করেছে তার ID
    const botID = api.getCurrentUserID();

    if (newUsers.some(u => u.userFbId === botID)) return;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const groupName = threadInfo.threadName || "আমাদের গ্রুপে";
      const memberCount = threadInfo.participantIDs.length;

      // যে অ্যাড করেছে তার নাম নেওয়া
      const authorInfo = await api.getUserInfo(authorID);
      const authorName = authorInfo[authorID].name;

      for (const user of newUsers) {
        const userId = user.userFbId;
        const fullName = user.fullName;

        // ফন্ট বক্স সমস্যা দূর করার জন্য নাম ক্লিন করা
        const cleanUserName = fullName.normalize("NFKD").replace(/[^\x00-\x7F]/g, "");
        const cleanAuthorName = authorName.normalize("NFKD").replace(/[^\x00-\x7F]/g, "");

        // সময় সেট করা
        const timeStr = new Date().toLocaleString("en-BD", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit", minute: "2-digit",
          day: "2-digit", month: "2-digit", year: "numeric",
          hour12: true,
        });

        /* 
        নিচের API টি আপনার দেওয়া স্ক্রিনশটের মতো DNS/DNA এনিমেশন জেনারেট করবে।
        এখানে নতুন মেম্বার এবং অ্যাডারের প্রোফাইল পিকচার ডাইনামিকভাবে সেট করা হয়েছে।
        */
        const apiUrl = `https://jessan-api.onrender.com/api/welcome/v2?name=${encodeURIComponent(cleanUserName)}&adderName=${encodeURIComponent(cleanAuthorName)}&groupName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&uid=${userId}&authorID=${authorID}&background=dns_animation`;

        const tmpPath = path.join(__dirname, "cache", `welcome_dns_${userId}.gif`);
        await fs.ensureDir(path.join(__dirname, "cache"));

        // এপিআই থেকে এনিমেটেড জিআইএফ ফাইলটি নামানো
        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(tmpPath, response.data);

        // মেসেজ পাঠানো
        await api.sendMessage({
          body: `‎𝐇𝐈𝐄 𝐁𝐀𝐁𝐘 ${fullName}!\n𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 ${groupName}\n\n👤 𝐀𝐃𝐃𝐄𝐃 𝐁𝐘: ${authorName}\n🔢 𝐌𝐄𝐌𝐁𝐄𝐑𝐒 𝐍𝐎 ${memberCount}\n📅 ${timeStr}\n━━━━━━━━━━━━━━━━\n𝐄𝐍𝐉𝐎𝐘 𝐘𝐎𝐔𝐑 𝐁𝐄𝐓𝐓𝐄𝐑 𝐓𝐈𝐌𝐄 𝐇𝐄𝐑𝐄 💌`,
          attachment: fs.createReadStream(tmpPath),
          mentions: [
            { tag: fullName, id: userId },
            { tag: authorName, id: authorID }
          ]
        }, threadID);

        // ফাইল ডিলিট
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      }
    } catch (err) {
      console.error("𝚂𝙾𝚁𝚁𝚈 𝙱𝙰𝙱𝚈 𝚆𝙴𝙻𝙻𝙲𝙾𝙼𝙴 𝙼𝚂𝙶 𝙴𝚁𝚁𝙾𝚁 🦋:", err);
    }
  }
};