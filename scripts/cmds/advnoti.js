const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const selectionCache = new Map();

module.exports = {
  config: {
    name: "advnoti",
    aliases: ["advancenoti"],
    version: "4.3",
    author: "AYAN",
    countDown: 5,
    role: 2,
    category: "owner",
    guide: "{pn} <message>",
    envConfig: {
      delayPerBatch: 1000,
      batchSize: 5
    }
  },

  onStart: async function ({ message, api, event, args }) {
    try {
      const allThreads = await api.getThreadList(100, null, ["INBOX"]);
      const groups = allThreads.filter(t => t.isGroup && t.threadID !== event.threadID);

      if (!groups.length) return message.reply("❌ No groups found.");
      
      // Message and Attachment check
      const msg = args.join(" ");
      const replyAttachment = event.messageReply?.attachments || [];
      const directAttachment = event.attachments || [];
      const allAttachments = [...directAttachment, ...replyAttachment];

      if (!msg && allAttachments.length === 0) {
        return message.reply("⚠️ Please type a message or provide an attachment to send notice.");
      }

      selectionCache.set(event.senderID, {
        message: msg,
        attachments: allAttachments,
        senderID: event.senderID
      });

      let list = "💌 𝙶𝚁𝙾𝚄𝙿 𝙻𝙸𝚂𝚃 💌:\n\n";
      groups.forEach((g, i) => {
        list += `${i + 1}. ${g.name || "Unnamed Group"} (${g.threadID})\n`;
      });

      list += "\n🍒 𝙿𝙻𝙴𝙰𝚂𝙴 𝚁𝙴𝙿𝙻𝚈 𝚆𝙸𝚃𝙷 𝙶𝚁𝙾𝚄𝙿 𝙽𝙾 (𝙴𝚇𝙰𝙼𝙿𝙻𝙴: 1 3 5) 𝙾𝚁 𝚃𝚈𝙿𝙴 '𝚊𝚕𝚕' 🍒";
      
      return message.reply(list, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          groups: groups
        });
      });
    } catch (e) {
      console.log(e);
      return message.reply("❌ Error fetching group list: " + e.message);
    }
  },

  onReply: async function ({ message, api, event, Reply, envCommands, commandName }) {
    const { author, groups } = Reply;
    if (event.senderID !== author) return;

    const cache = selectionCache.get(author);
    if (!cache) return message.reply("🍰 𝚂𝙴𝙰𝚂𝚂𝙸𝙾𝙽 𝙴𝚇𝙿𝙸𝚁𝙴 𝙿𝙻𝚂 𝚄𝚂𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙰𝙶𝙸𝙽 🐱.");

    const input = (event.body || "").toLowerCase().trim();
    let selectedGroups = [];

    if (input === "all") {
      selectedGroups = groups;
    } else {
      const nums = input.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n));
      selectedGroups = nums
        .filter(n => n > 0 && n <= groups.length)
        .map(n => groups[n - 1]);
    }

    if (!selectedGroups.length) return message.reply("🐱𝙸𝙽𝚅𝙰𝙸𝙻𝙳 𝚂𝙴𝙻𝙴𝙲𝚃𝙸𝙾𝙽 𝙿𝙻𝙴𝙰𝚂𝙴 𝚁𝙴𝙿𝙻𝚈 𝚆𝙸𝚃𝙷 𝙽𝚄𝙼𝙱𝙴𝚁 (1 2) 𝙾𝚁 '𝚊𝚕𝚕'.");

    const { delayPerBatch, batchSize } = envCommands[commandName];
    const { getStreamsFromAttachment } = global.utils;

    try {
      message.reply(`🍓𝚆𝙰𝙸𝚃 𝙱𝙱𝙴 𝚂𝙴𝙽𝙳𝙸𝙽𝙶... ${selectedGroups.length} 𝚃𝙷𝙴 𝙶𝚁𝙾𝚄𝙿 🍓`);

      // Prepare Attachments
      let streams = [];
      if (cache.attachments && cache.attachments.length > 0) {
        streams = await getStreamsFromAttachment(cache.attachments);
      }

      const time = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
      const stylishText = `╔═══『 🍨 𝗬𝗘𝗔 𝗠𝗜𝗞𝗢 𝗢𝗙𝗙𝗜𝗖𝗜𝗔𝗟 𝗡𝗢𝗧𝗜𝗖𝗘 🍨 』═══╗
┃ 🐱 𝚂𝙴𝙽𝙳𝙴𝚁: ${author}
┃ 🕰️ 𝚃𝙸𝙼𝙴: ${time}
╠═══════════════════
┃ 📢 𝙼𝙴𝚂𝚂𝙰𝙶𝙴:
┃ ${cache.message || "— (Media Only) —"}
╠═══════════════════
┃ ⚠️ 𝙿𝙻𝙴𝙰𝚂𝙴 𝙵𝙾𝙻𝙻𝙾𝚆 𝚃𝙷𝙴 𝙽𝙾𝚃𝙸𝙲𝙴 𝙰𝙽𝙳 𝚂𝚄𝙿𝙿𝙾𝚁𝚃 𝙰𝙳𝙼𝙸𝙽 🝮︎︎︎
╚═══════════════════╝`;

      const formSend = { body: stylishText, mentions: [] };
      if (streams.length > 0) formSend.attachment = streams;

      let success = 0, failed = 0;

      for (let i = 0; i < selectedGroups.length; i++) {
        try {
          await api.sendMessage(formSend, selectedGroups[i].threadID);
          success++;
        } catch (err) {
          failed++;
          console.error(`Failed to send to ${selectedGroups[i].threadID}:`, err);
        }
        
        // Anti-spam delay
        if ((i + 1) % batchSize === 0) {
          await new Promise(res => setTimeout(res, delayPerBatch));
        } else {
          await new Promise(res => setTimeout(res, 500));
        }
      }

      selectionCache.delete(author);
      return message.reply(`🍎𝙷𝙴𝚈 𝙼𝙸𝙺𝙾 𝙰𝙳𝙼𝙸𝙽 𝙽𝙾𝚃𝙸𝙵𝙸𝙲𝙰𝚃𝙸𝙾𝙽 𝚂𝙴𝙽𝙳 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈..!\n\n🚀 𝚂𝚄𝙲𝙲𝙴𝚂𝚂 𝙶𝚁𝙾𝚄𝙿 𝙲𝙾𝚄𝙽𝚃: ${success}\n❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝙶𝚁𝙾𝚄𝙿: ${failed}`);

    } catch (error) {
      console.log(error);
      return message.reply("❌ An error occurred: " + error.message);
    }
  }
};