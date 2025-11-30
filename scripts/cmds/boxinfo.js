const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["boxinfo"],
    version: "1.0",
    author: "xemon",
    countDown: 5,
    role: 0,
    shortDescription: "See Box info",
    category: "box chat",
    guide: { en: "{p} [groupinfo|boxinfo]" }
  },

  onStart: async function ({ api, event }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participants = threadInfo.participantIDs.length;

      // Count genders
      let maleCount = 0,
        femaleCount = 0,
        unknownCount = 0;

      for (let id in threadInfo.userInfo) {
        const user = threadInfo.userInfo[id];
        if (user.gender === "MALE") maleCount++;
        else if (user.gender === "FEMALE") femaleCount++;
        else unknownCount++;
      }

      // Prepare admin list
      let adminList = "";
      const admins = threadInfo.adminIDs;
      for (let i = 0; i < admins.length; i++) {
        const info = await api.getUserInfo(admins[i].id);
        adminList += `• ${info[admins[i].id].name}\n`;
      }

      // Approval mode
      const approval = threadInfo.approvalMode === true
        ? "Turned on"
        : threadInfo.approvalMode === false
        ? "Turned off"
        : "Unknown";

      // Function to send the message
      const sendMessage = () => {
        api.sendMessage(
          {
            body: `🔧 Group Name: ${threadInfo.threadName}
🔧 Group ID: ${threadInfo.threadID}
🔧 Approval: ${approval}
🔧 Emoji: ${threadInfo.emoji || "None"}
🔧 Members: ${participants}
🔧 Male: ${maleCount}
🔧 Female: ${femaleCount}
🔧 Unknown Gender: ${unknownCount}
🔧 Total Admins: ${admins.length}
Admins List:
${adminList}
🔧 Total Messages: ${threadInfo.messageCount} msgs

Made with ❤️ by: TERAA BAPPP`,
            attachment: fs.createReadStream(__dirname + "/cache/1.png")
          },
          event.threadID,
          () => fs.unlinkSync(__dirname + "/cache/1.png"),
          event.messageID
        );
      };

      // Download thread image and then send message
      request(encodeURI(threadInfo.imageSrc))
        .pipe(fs.createWriteStream(__dirname + "/cache/1.png"))
        .on("close", sendMessage);

    } catch (error) {
      console.error("Error fetching group info:", error);
      api.sendMessage("❌ Failed to fetch group info.", event.threadID);
    }
  }
};
