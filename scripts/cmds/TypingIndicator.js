const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "typingindicator.json");

// default data
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({ enabled: true }, null, 2));
}

function getData() {
  return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "typingindicator",
    version: "1.0.0",
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴",
    role: 0,
    description: "Messenger typing indicator ON/OFF system",
    category: "system",
    cooldowns: 0
  },

  // command part
  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;
    const data = getData();

    if (!args[0]) {
      return api.sendMessage(
        `🟢 Typing Indicator Status: ${data.enabled ? "ON" : "OFF"}\n\nUse:\ntypingindicator on\ntypingindicator off`,
        threadID
      );
    }

    if (args[0].toLowerCase() === "on") {
      data.enabled = true;
      saveData(data);
      return api.sendMessage("✅ Typing Indicator ON করা হয়েছে", threadID);
    }

    if (args[0].toLowerCase() === "off") {
      data.enabled = false;
      saveData(data);
      return api.sendMessage("❌ Typing Indicator OFF করা হয়েছে", threadID);
    }
  },

  // auto typing system
  onChat: async function ({ api, event }) {
    if (!event.body) return;

    const data = getData();
    if (!data.enabled) return;

    const threadID = event.threadID;

    try {
      // typing start
      api.sendTypingIndicator(threadID, true);

      // human-like delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      // typing stop
      api.sendTypingIndicator(threadID, false);
    } catch (e) {
      console.log("Typing Indicator Error:", e);
    }
  }
};
