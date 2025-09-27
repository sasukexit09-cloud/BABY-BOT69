const { getTime } = global.utils;

module.exports = {
  config: {
    name: "cmdLogger",
    version: "1.0",
    author: "Tarek",
    category: "system",
    isEvent: true
  },

  onChat: async ({ event, message, api, usersData, threadsData }) => {
    try {
      const { threadID, senderID, body } = event;
      const { config } = global.GoatBot;
      const logGroupID = config.logGroupID || "1879628072949507";

      // যদি মেসেজ prefix দিয়ে শুরু হয়, তখনই লগ করবো
      const prefix = config.prefix || "/";
      if (!body || !body.startsWith(prefix)) return;

      const threadInfo = await api.getThreadInfo(threadID);
      const threadName = threadInfo.threadName || "Unnamed Group";
      const userName = await usersData.getName(senderID);
      const time = getTime("DD/MM/YYYY HH:mm:ss");

      const logMsg = `⚡───[ COMMAND USAGE LOG ]───⚡
👤 User: ${userName} (${senderID})
💬 Command: ${body}
👥 Group: ${threadName} (${threadID})
⏰ Time: ${time}`;

      api.sendMessage(logMsg, logGroupID);
    } catch (e) {
      console.error("Command Logger Error:", e);
    }
  }
};
