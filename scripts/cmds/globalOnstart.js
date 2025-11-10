const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "globalOnStart",
  version: "1.0.2",
  hasPermssion: 2,
  credits: "Maya x Shahadat",
  description: "Run all commands' onStart automatically",
  commandCategory: "System",
  usages: "globalOnStart",
  cooldowns: 0
};

module.exports.onStart = async function ({ api }) {
  try {
    const commandsDir = path.join(__dirname);
    const files = fs.readdirSync(commandsDir).filter(file => file.endsWith(".js") && file !== "globalOnStart.js");

    let total = 0;
    for (const file of files) {
      const commandPath = path.join(commandsDir, file);
      try {
        delete require.cache[require.resolve(commandPath)];
        const cmd = require(commandPath);

        if (cmd.onStart && typeof cmd.onStart === "function") {
          await cmd.onStart({ api });
          console.log(`✅ onStart executed for: ${cmd.config?.name || file}`);
          total++;
        }
      } catch (err) {
        console.log(`❌ Error loading ${file}: ${err.message}`);
      }
    }

    console.log(`\n🌍 Successfully ran onStart for ${total} command(s)!`);
    api.sendMessage(`🌍 All modules initialized successfully!\n✅ Total onStart executed: ${total}`, global.mainThreadID || "");
  } catch (error) {
    console.error("❌ Global onStart failed:", error);
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("✅ Global onStart system is active and ready!", event.threadID, event.messageID);
};
