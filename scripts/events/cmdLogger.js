const { getTime } = global.utils;

module.exports = {
  config: {
    name: "cmdLogger",
    version: "1.1",
    author: "TAREK",
    category: "events"
  },

  onStart: async ({ event, api, usersData }) => {
    try {
      const { threadID, senderID, body } = event;
      const { config } = global.GoatBot;
      const logGroupID = config.logGroupID || "1879628072949507";

      // যদি prefix না থাকে তাহলে return
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
