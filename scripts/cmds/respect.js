module.exports = {
  config: {
    name: "respect",
    aliases: ["r"],
    version: "1.0",
    author: "〲T A N J I L ツ",
    role: 0,
    shortDescription: {
      en: "Gives respect to the owner"
    },
    longDescription: {
      en: "Only the owner can use this command to get admin privileges as a sign of respect."
    },
    category: "Group",
    guide: {
      en: "/r"
    }
  },

  onStart: async function ({ api, event }) {
    const ownerUID = "100047994102529";
    
    if (event.senderID !== ownerUID) {
      return api.sendMessage("🤣 Lol, respect is not free! Only the Tarek boss gets it.", event.threadID);
    }

    try {
      await api.changeAdminStatus(event.threadID, ownerUID, true);
      api.sendMessage("⚡ Boom! Power restored to the one true ruler!", event.threadID);
    } catch (err) {
      api.sendMessage("🤖 Bro… I don’t even have a chair, how can I give you the throne? 😂", event.threadID);
    }
  }
};
