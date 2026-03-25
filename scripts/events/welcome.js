const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "2.8",
    author: "Saimx69x",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const newUsers = logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();

    if (newUsers.some(u => u.userFbId === botID)) return;

    // নামের বক্স (Font) সমস্যা দূর করার ফাংশন
    const clearName = (str) => {
      return str.normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\x00-\x7F]/g, " ")
                .trim();
    };

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      // NULL ফিক্স: যদি গ্রুপের নাম না থাকে তবে "New Group" দেখাবে
      const groupName = threadInfo.threadName || "this group";
      const memberCount = threadInfo.participantIDs.length;

      for (const user of newUsers) {
        const userId = user.userFbId;
        const fullName = user.fullName; 
        const apiName = clearName(fullName) || "New Member";

        const timeStr = new Date().toLocaleString("en-BD", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          weekday: "long", year: "numeric", month: "2-digit", day: "2-digit",
          hour12: true,
        });

        // এখানে আমরা এপিআই থেকে ডাটা নিচ্ছি
        const apiUrl = `https://xsaim8x-xxx-api.onrender.com/api/welcome?name=${encodeURIComponent(apiName)}&uid=${userId}&threadname=${encodeURIComponent(groupName)}&members=${memberCount}`;
        
        const tmp = path.join(__dirname, "cache");
        await fs.ensureDir(tmp);
        // এনিমেশন দেখানোর জন্য ফাইল এক্সটেনশন .gif হওয়া জরুরি
        const gifPath = path.join(tmp, `welcome_${userId}.gif`);

        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(gifPath, response.data);

        await api.sendMessage({
          body: `‎𝐇𝐞𝐥𝐥𝐨 ${fullName}\n𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 ${groupName}\n𝐘𝐨𝐮'𝐫𝐞 𝐭𝐡𝐞 ${memberCount} 𝐦𝐞𝐦𝐛𝐞𝐫 𝐨𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩, 𝐩𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐣𝐨𝐲 🎉\n━━━━━━━━━━━━━━━━\n📅 ${timeStr}`,
          attachment: fs.createReadStream(gifPath),
          mentions: [{ tag: fullName, id: userId }]
        }, threadID);

        if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
      }
    } catch (err) {
      console.error("❌ Welcome Error:", err);
    }
  }
};