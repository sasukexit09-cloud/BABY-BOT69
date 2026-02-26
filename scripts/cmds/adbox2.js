const axios = require("axios");
const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: "adbox2",
    aliases: ["adbox2"],
    version: "1.1",
    author: "Chitron Bhattacharjee (optimized by Maya)",
    countDown: 5,
    role: 1,
    shortDescription: {
      en: "✨ Group Admin Tool: Change Photo, Emoji, Name & Admins ✨",
    },
    description: {
      en: `
🌸 ──────────────
🌟 +adbox name <new group name> — Change group name
🌟 +adbox emoji <emoji> — Change group emoji
🌟 +adbox image — Reply to a photo to change group photo
🌟 +adbox add @tag — Add group admins
🌟 +adbox del @tag — Remove group admins
🌟 +adbox info — Show group info
      `,
    },
    category: "admin",
    guide: {
      en: "Use +adbox with subcommands name, emoji, image, add, del, info as needed.",
    },
  },

  langs: {
    en: {
      usage: `🌸✨ Usage of adbox command 🌸✨
➤ +adbox name <new group name>
➤ +adbox emoji <emoji>
➤ +adbox image (reply to photo)
➤ +adbox add @tag
➤ +adbox del @tag
➤ +adbox info`,
      replyToPhoto: `❌ Please reply to exactly one photo! 🌼`,
      noMention: `❌ Please tag someone to add/remove admin! 🌷`,
      doneName: (n) => `✨ Group name changed to: 💖 ${n}`,
      doneEmoji: (e) => `✨ Group emoji changed to: ${e} 🌟`,
      doneImage: `✨ Group photo changed successfully! 🖼️`,
      addingAdmin: `✨ Adding group admins... 🌱`,
      removingAdmin: `✨ Removing group admins... 🍃`,
      infoTitle: `🌸🍃 Group Info for: 💖 `,
      infoMembers: (num) => `👥 Members: ${num}`,
      infoAdmins: (num) => `👑 Admins: ${num}`,
      infoEmoji: (e) => `😊 Emoji: ${e}`,
      infoApproval: (status) => `🔒 Approval mode: ${status}`,
      infoMessages: (num) => `✉️ Messages sent: ${num}`,
    },
  },

  onChat: async function ({ api, event, args, getLang }) {
    if (!event.body) return;
    if (!event.body.toLowerCase().startsWith("+adbox")) return;

    args = event.body.trim().split(/\s+/).slice(1);
    return this.onStart({
      api,
      event,
      args,
      getLang,
      message: { reply: (msg) => api.sendMessage(msg, event.threadID, event.messageID) },
    });
  },

  onStart: async function ({ api, event, args, getLang, message }) {
    function apiSend(api, tid, msg, attach) {
      if (attach) {
        api.sendMessage({ body: msg, attachment: attach }, tid, event.messageID);
      } else {
        api.sendMessage(msg, tid, event.messageID);
      }
    }

    if (!args || args.length === 0) {
      return apiSend(api, event.threadID, getLang("usage"));
    }

    const sub = args[0].toLowerCase();

    if (sub === "name") {
      let newName = args.slice(1).join(" ") || (event.messageReply && event.messageReply.body);
      if (!newName) return apiSend(api, event.threadID, `❌ Please provide a new group name! 🌸`);
      try {
        await api.setTitle(newName, event.threadID);
        return apiSend(api, event.threadID, getLang("doneName")(newName));
      } catch {
        return apiSend(api, event.threadID, `❌ Failed to change group name! 🚫`);
      }

    } else if (sub === "emoji") {
      let newEmoji = args[1] || (event.messageReply && event.messageReply.body);
      if (!newEmoji) return apiSend(api, event.threadID, `❌ Please provide a new emoji! 🌷`);
      try {
        await api.changeThreadEmoji(newEmoji, event.threadID);
        return apiSend(api, event.threadID, getLang("doneEmoji")(newEmoji));
      } catch {
        return apiSend(api, event.threadID, `❌ Failed to change emoji! 🚫`);
      }

    } else if (sub === "image") {
      if (!event.messageReply) return apiSend(api, event.threadID, getLang("replyToPhoto"));
      if (!event.messageReply.attachments || event.messageReply.attachments.length !== 1)
        return apiSend(api, event.threadID, getLang("replyToPhoto"));

      try {
        let pathFile = __dirname + "/assets/adbox_image.png";
        await new Promise((resolve, reject) => {
          request(encodeURI(event.messageReply.attachments[0].url))
            .pipe(fs.createWriteStream(pathFile))
            .on("close", resolve)
            .on("error", reject);
        });
        await api.changeGroupImage(fs.createReadStream(pathFile), event.threadID);
        fs.unlinkSync(pathFile);
        return apiSend(api, event.threadID, getLang("doneImage"));
      } catch {
        return apiSend(api, event.threadID, `❌ Failed to change group photo! 🚫`);
      }

    } else if (sub === "add") {
      if (!event.mentions || Object.keys(event.mentions).length === 0)
        return apiSend(api, event.threadID, getLang("noMention"));
      apiSend(api, event.threadID, getLang("addingAdmin"));
      for (const uid of Object.keys(event.mentions)) {
        try {
          await api.changeAdminStatus(event.threadID, uid, true);
        } catch {}
      }
      return apiSend(api, event.threadID, `✨ Added admins successfully! 🌟`);

    } else if (sub === "del") {
      if (!event.mentions || Object.keys(event.mentions).length === 0)
        return apiSend(api, event.threadID, getLang("noMention"));
      apiSend(api, event.threadID, getLang("removingAdmin"));
      for (const uid of Object.keys(event.mentions)) {
        try {
          await api.changeAdminStatus(event.threadID, uid, false);
        } catch {}
      }
      return apiSend(api, event.threadID, `✨ Removed admins successfully! 🌟`);

    } else if (sub === "info") {
      try {
        let threadInfo = await api.getThreadInfo(event.threadID);
        let memCount = threadInfo.participantIDs?.length || 0;
        let adminCount = threadInfo.adminIDs?.length || 0;
        let emoji = threadInfo.emoji || "🌸";
        let approval = threadInfo.approvalMode ? "✅ On" : "❎ Off";
        let msgs = threadInfo.messageCount || "Unknown";
        let name = threadInfo.threadName || "N/A";
        let id = threadInfo.threadID;

        let adminList = "";
        for (let adm of threadInfo.adminIDs) {
          let user = await api.getUserInfo(adm);
          adminList += `• ${user[adm].name}\n`;
        }

        let msg = `
🍰 𝐆𝐑𝐎𝐔𝐏 𝐈𝐍𝐅𝐎 - 𝐁𝐀𝐁𝐘 🍇
━━━━━━━━━━━━━━━━
🎀 𝗡𝗔𝗠𝗘: ${name}
🆔 𝗜𝗗: ${id}
🌸 𝗘𝗠𝗢𝗝𝗜: ${emoji}
🔒 𝗔𝗣𝗣𝗥𝗢𝗩𝗔𝗟: ${approval}
👥 𝗠𝗘𝗠𝗕𝗘𝗥𝗦: ${memCount}
👑 𝗔𝗗𝗠𝗜𝗡𝗦: ${adminCount}

💟 𝗔𝗗𝗠𝗜𝗡 𝗟𝗜𝗦𝗧 💟:
${adminList || "𝙽𝙾𝚃 𝙵𝙾𝚄𝙽𝙳 𝙰𝙳𝙼𝙸𝙽 𝙻𝙸𝚂𝚃🥺"}

✉️ 𝙼𝚎𝚜𝚜𝚊𝚐𝚎𝚜 𝚂𝚎𝚗𝚝: ${msgs}

🍓𝙱𝙾𝚃 𝙿𝚁𝙾𝚅𝙸𝙳𝙴𝚁 𝙱𝚈 𝙰𝚈𝙰𝙽 𝙱𝙱𝙴 🍓
━━━━━━━━━━━━━━━━
        `;
        apiSend(api, event.threadID, msg);
      } catch {
        apiSend(api, event.threadID, `❌ Failed to get group info! 🚫`);
      }
    } else {
      return apiSend(api, event.threadID, getLang("usage"));
    }
  },
};
