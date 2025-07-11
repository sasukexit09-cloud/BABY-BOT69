const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "gcinfo",
    aliases: [],
    version: "2.1",
    author: "〲T A N J I L ツ",
    role: 0,
    shortDescription: {
      en: "Show group info"
    },
    longDescription: {
      en: "Displays group name, photo, member stats, admins, emoji, approval mode, and more beautifully"
    },
    category: "Group",
    guide: {
      en: "/gcinfo"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const groupName = threadInfo.threadName || "Unnamed Group";
      const boldName = groupName
        .split('')
        .map(char =>
          char
            .replace(/[A-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x1D400 - 0x41))
            .replace(/[a-z]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x1D41A - 0x61))
        )
        .join('');

      const adminIDs = threadInfo.adminIDs.map(i => i.id);
      const admins = threadInfo.userInfo.filter(user => adminIDs.includes(user.id));
      const males = threadInfo.userInfo.filter(u => u.gender === 'MALE').length;
      const females = threadInfo.userInfo.filter(u => u.gender === 'FEMALE').length;
      const totalMembers = threadInfo.participantIDs.length;
      const totalMessages = threadInfo.messageCount || "Unknown";
      const groupEmoji = threadInfo.emoji || "None";
      const groupImage = threadInfo.imageSrc;
      const approvalMode = threadInfo.approvalMode ? "On" : "Off";
      const threadID = event.threadID;

      const adminList = admins.map(ad => `• ${ad.name}`).join("\n");

      const msg =
`🌸── 𝙂𝙧𝙤𝙪𝙥 𝙎𝙣𝙖𝙥 ──🌸
📛 𝙉𝙖𝙢𝙚: ${boldName}
🆔 𝙄𝘿: ${threadID}
👥 𝙈𝙚𝙢𝙗𝙚𝙧𝙨: ${totalMembers}
💌 𝙈𝙨𝙜 𝘾𝙤𝙪𝙣𝙩: ${totalMessages}

🧒 𝙈𝙖𝙡𝙚: ${males} | 👧 𝙁𝙚𝙢𝙖𝙡𝙚: ${females}
😊 𝙀𝙢𝙤𝙟𝙞: ${groupEmoji}
🔐 𝘼𝙥𝙥𝙧𝙤𝙫𝙖𝙡: ${approvalMode}

👑 𝘼𝘿𝙈𝙄𝙉𝙎:
${adminList}
🌸─────────────────🌸`;

      if (groupImage) {
        const path = __dirname + "/gc_cover.png";
        const res = await axios.get(groupImage, { responseType: "arraybuffer" });
        fs.writeFileSync(path, Buffer.from(res.data, "utf-8"));

        api.sendMessage({
          body: msg,
          attachment: fs.createReadStream(path)
        }, event.threadID, () => fs.unlinkSync(path));
      } else {
        api.sendMessage(msg, event.threadID);
      }
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to get group info.", event.threadID);
    }
  }
};
