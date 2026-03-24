const { getTime } = global.utils;

module.exports = {
  config: {
    name: "logs",
    version: "2.1",
    author: "TAREK",
    category: "events"
  },

  onEvent: async function ({ event, api, usersData, threadsData }) {
    // এখানে তোমার লগ গ্রুপ আইডি বসাও (String হিসেবে)
    const logGroupID = "1534849337581834"; 

    // যদি logGroupID না থাকে বা ইভেন্ট নিজের পাঠানো হয় তবে কাজ করবে না
    if (!logGroupID || event.senderID === api.getCurrentUserID()) return;

    const time = getTime("DD/MM/YYYY HH:mm:ss");

    try {
      // --------- BOT ADD LOG ---------
      if (event.logMessageType === "log:subscribe") {
        const addedParticipants = event.logMessageData.addedParticipants;
        if (addedParticipants.some(p => p.userFbId === api.getCurrentUserID())) {
          const authorName = await usersData.getName(event.author);
          const threadName = (await threadsData.get(event.threadID)).threadName || "Unnamed Group";

          const msg = `🛸───[ BOT EVENT LOG ]───🛸\n` +
                      `✨ EVENT: Bot has been added!\n` +
                      `🙋 Added by: ${authorName}\n` +
                      `📌 DETAILS:\n` +
                      `- User ID: ${event.author}\n` +
                      `- Group: ${threadName}\n` +
                      `- Group ID: ${event.threadID}\n` +
                      `- Timestamp: ${time}`;
          return api.sendMessage(msg, logGroupID);
        }
      }

      // --------- BOT KICK LOG ---------
      if (event.logMessageType === "log:unsubscribe") {
        if (event.logMessageData.leftParticipantFbId === api.getCurrentUserID()) {
          const authorName = await usersData.getName(event.author);
          const threadName = (await threadsData.get(event.threadID)).threadName || "Unnamed Group";

          const msg = `⚡ BOT ALERT ⚡\n` +
                      `❌ Bot has been removed!\n` +
                      `Responsible: ${authorName}\n` +
                      `📌 DETAILS:\n` +
                      `- User ID: ${event.author}\n` +
                      `- Group: ${threadName}\n` +
                      `- Group ID: ${event.threadID}\n` +
                      `- Timestamp: ${time}`;
          return api.sendMessage(msg, logGroupID);
        }
      }

      // --------- COMMAND USAGE LOG ---------
      // event.body চেক করা হচ্ছে এবং এটি শুধু কমান্ড কি না তা যাচাই করা হচ্ছে
      const prefix = (await threadsData.get(event.threadID)).prefix || global.GoatBot.config.prefix;
      
      if (event.type === "message" && event.body && event.body.startsWith(prefix)) {
        const userName = await usersData.getName(event.senderID);
        const threadName = (await threadsData.get(event.threadID)).threadName || "Unnamed Group";

        const msg = `⚡───[ COMMAND USAGE LOG ]───⚡\n` +
                    `👤 User: ${userName} (${event.senderID})\n` +
                    `💬 Command: ${event.body}\n` +
                    `👥 Group: ${threadName} (${event.threadID})\n` +
                    `⏰ Time: ${time}`;

        return api.sendMessage(msg, logGroupID);
      }

    } catch (error) {
      console.error("Error in logs event:", error);
    }
  }
};