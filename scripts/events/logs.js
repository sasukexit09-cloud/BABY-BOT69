const { getTime } = global.utils;

module.exports = {
  config: {
    name: "logs",
    version: "2.0",
    author: "TAREK",
    category: "events",
    envConfig: {
      logGroupID: "1879628072949507" // তোমার লগ গ্রুপ আইডি
    }
  },

  onEvent: async function ({ event, api, usersData, threadsData }) {
    const { config } = global.GoatBot;
    const logGroupID = config.logGroupID || this.config.envConfig.logGroupID;

    // যদি logGroupID না থাকে তাহলে কিছু করবে না
    if (!logGroupID) return;

    const time = getTime("DD/MM/YYYY HH:mm:ss");

    // --------- BOT ADD/KICK LOG ---------
    if (
      event.logMessageType === "log:subscribe" &&
      event.logMessageData?.addedParticipants?.some(
        (p) => p.userFbId === api.getCurrentUserID()
      )
    ) {
      const authorName = await usersData.getName(event.author);
      const threadInfo = await api.getThreadInfo(event.threadID);
      const threadName = threadInfo.threadName || "Unnamed Group";

      const msg = `🛸───[ BOT EVENT LOG ]───🛸
✨ EVENT: Bot has been added!
🙋 Added by: ${authorName}
📌 DETAILS:
- User ID: ${event.author}
- Group: ${threadName}
- Group ID: ${event.threadID}
- Timestamp: ${time}`;

      return api.sendMessage(msg, logGroupID);
    }

    if (
      event.logMessageType === "log:unsubscribe" &&
      event.logMessageData?.leftParticipantFbId === api.getCurrentUserID()
    ) {
      const authorName = await usersData.getName(event.author);
      const threadInfo = await api.getThreadInfo(event.threadID);
      const threadName = threadInfo.threadName || "Unnamed Group";

      const msg = `⚡ BOT ALERT ⚡
❌ Bot has been removed!
Responsible: ${authorName}
📌 DETAILS:
- User ID: ${event.author}
- Group: ${threadName}
- Group ID: ${event.threadID}
- Timestamp: ${time}`;

      return api.sendMessage(msg, logGroupID);
    }

    // --------- COMMAND USAGE LOG ---------
    if (event.type === "message" && event.body) {
      const prefix = config.prefix || "/";
      if (!event.body.startsWith(prefix)) return;

      const userName = await usersData.getName(event.senderID);
      const threadInfo = await api.getThreadInfo(event.threadID);
      const threadName = threadInfo.threadName || "Unnamed Group";

      const msg = `⚡───[ COMMAND USAGE LOG ]───⚡
👤 User: ${userName} (${event.senderID})
💬 Command: ${event.body}
👥 Group: ${threadName} (${event.threadID})
⏰ Time: ${time}`;

      return api.sendMessage(msg, logGroupID);
    }
  }
};
