const axios = require("axios");

module.exports = {
  config: {
    name: "move",
    version: "1.3",
    author: "Chitron Bhattacharjee",
    countDown: 20,
    role: 2,
    shortDescription: {
      en: "Move all real users from a GC to your support box"
    },
    description: {
      en: "Adds all human members from a specified GC to your support box"
    },
    category: "admin",
    guide: {
      en: "Usage: +move <source GC tid>"
    }
  },

  onStart: async function ({ api, message, args }) {
    const SUPPORT_BOX_TID = "2090871814651210"; // Updated GC tid

    if (!args[0]) return message.reply("❌ Please provide the source GC TID. Example: +move 1234567890");

    const SOURCE_TID = args[0];

    message.reply("📦 Fetching members from source GC...");

    let membersData;
    try {
      // Get members from source GC
      membersData = await api.getThreadInfo(SOURCE_TID);
    } catch (e) {
      return message.reply("❌ Failed to get source GC info. Maybe wrong TID or bot doesn't have access.");
    }

    const userSet = new Set();
    const members = membersData.participantIDs || []; // Facebook API gives array of IDs

    // Step 1: Filter out bots (check each member info)
    for (const uid of members) {
      try {
        const userInfo = await api.getUserInfo(uid);
        if (!userInfo[uid].is_friend && userInfo[uid].type === "Page") continue; // skip pages/bots
        userSet.add(uid);
      } catch (e) {
        console.log(`Failed to fetch info for UID: ${uid}`);
      }
    }

    const total = userSet.size;
    message.reply(`👥 Total real users found: ${total}\n📬 Adding them to support box...`);

    // Step 2: Add to support box
    const failed = [];
    let successCount = 0;

    for (const uid of userSet) {
      try {
        await api.addUserToGroup(uid, SUPPORT_BOX_TID);
        successCount++;
        await new Promise(res => setTimeout(res, 100)); // avoid spam/block
      } catch (e) {
        failed.push(uid);
      }
    }

    // Step 3: Final message
    message.reply(
      `✅ Move complete!\n\n👤 Added: ${successCount}/${total}\n❌ Failed: ${failed.length}` +
      (failed.length > 0 ? `\n\n🔍 Failed UIDs:\n${failed.join(", ")}` : "")
    );
  }
};
