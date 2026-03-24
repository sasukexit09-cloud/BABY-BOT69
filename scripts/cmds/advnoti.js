const { getStreamsFromAttachment } = global.utils;
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const selectionCache = new Map();

module.exports = {
  config: {
    name: "advnoti",
    aliases: ["advancenoti"],
    version: "4.0",
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

  // 🔹 STEP 1 → SEND NOTICE & SHOW GROUP LIST
  onStart: async function ({ message, api, event, args }) {

    const allThreads = await api.getThreadList(1000, null, ["INBOX"]);
    const groups = allThreads.filter(t => t.isGroup);

    if (groups.length === 0) {
      return message.reply("❌ No groups found.");
    }

    if (!args.length && !event.messageReply) {
      return message.reply("⚠️ Message dao ba reply koro.");
    }

    // Save data
    selectionCache.set(event.senderID, {
      message: args.join(" "),
      reply: event.messageReply,
      attachments: event.attachments
    });

    // Show list
    let list = "📋 GROUP LIST:\n\n";
    groups.forEach((g, i) => {
      list += `${i + 1}. ${g.name || "Unnamed Group"}\n`;
    });

    list += "\n🔢 Reply with number (e.g: 1 3 5)\n🌍 Type 'all' for all groups";

    message.reply(list);
  },

  // 🔹 STEP 2 → USER SELECT GROUP & SEND
  onReply: async function ({ message, api, event, envCommands, commandName }) {

    const { delayPerBatch, batchSize } = envCommands[commandName];

    const cache = selectionCache.get(event.senderID);
    if (!cache) return;

    const allThreads = await api.getThreadList(1000, null, ["INBOX"]);
    const groups = allThreads.filter(t => t.isGroup);

    let selectedGroups = [];

    const input = event.body.toLowerCase();

    if (input === "all") {
      selectedGroups = groups;
    } else {
      const nums = input.split(" ").map(n => parseInt(n));
      selectedGroups = nums
        .filter(n => !isNaN(n) && n > 0 && n <= groups.length)
        .map(n => groups[n - 1]);
    }

    if (selectedGroups.length === 0) {
      return message.reply("❌ Invalid selection.");
    }

    // 🕒 Time
    const time = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    // 👤 Mention
    let mentions = [];
    let tagLine = "";

    if (cache.reply?.senderID) {
      tagLine = "👤 Mentioned User";
      mentions.push({
        tag: "Mentioned User",
        id: cache.reply.senderID
      });
    }

    // 🔍 AUTO DETECT IMAGE URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const foundUrls = cache.message.match(urlRegex) || [];

    // Clean message
    let cleanMessage = cache.message.replace(urlRegex, "").trim();

    // 📎 Attachments collect
    let allAttachments = [];

    if (cache.attachments?.length > 0) {
      allAttachments.push(...cache.attachments);
    }

    if (cache.reply?.attachments?.length > 0) {
      allAttachments.push(...cache.reply.attachments);
    }

    // 🌐 Download image URLs
    for (let i = 0; i < foundUrls.length; i++) {
      try {
        const url = foundUrls[i];

        if (!url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) continue;

        const filePath = path.join(__dirname, "cache", `notice_${Date.now()}_${i}.jpg`);
        const res = await axios.get(url, { responseType: "arraybuffer" });

        await fs.writeFile(filePath, res.data);
        allAttachments.push(fs.createReadStream(filePath));

      } catch (e) {
        console.log("URL error:", e.message);
      }
    }

    // Convert to stream
    let streams = [];
    if (allAttachments.length > 0) {
      streams = await getStreamsFromAttachment(allAttachments);
    }

    // 💎 PREMIUM DESIGN
    const stylishText = `╔═══『 🍨 𝗬𝗘𝗔 𝗠𝗜𝗞𝗢 𝗔𝗗𝗠𝗜𝗡 𝗡𝗢𝗧𝗜𝗖𝗘 🍨 』═══╗
┃ 𝚂𝙴𝙽𝙳𝙴𝚁 𝙱𝚈 𝙰𝙳𝙼𝙸𝙽 🍨
┃ 🍰 𝚃𝙸𝙼𝙴 𝚃𝙾 𝚃𝙰𝙺𝙴 𝙰𝙲𝚃𝙸𝙾𝙽 : ${time}
┃ ${tagLine}
╠═══════════════════
┃ 📢 𝙸𝙼𝙿𝙾𝚁𝚃𝙰𝙽𝚃 𝙼𝙴𝚂𝚂𝙰𝙶𝙴𝚂:
┃ ${cleanMessage || "—"}
╠═══════════════════
┃ ⚠️ 𝙿𝙻𝙴𝙰𝚂𝙴 𝙵𝙾𝙻𝙻𝙾𝚆 𝚃𝙷𝙴 𝙽𝙾𝚃𝙸𝙲𝙴 𝙰𝙽𝙳 𝚂𝚄𝙿𝙿𝙾𝚁𝚃 𝚃𝙷𝙴 𝙰𝙳𝙼𝙸𝙽 🝮︎︎︎︎︎︎︎
╚═══════════════════╝`;

    const formSend = {
      body: stylishText,
      mentions,
      attachment: streams
    };

    message.reply(`⚡ Sending to ${selectedGroups.length} groups...`);

    let success = 0;
    let failed = [];

    // ⚡ SUPER FAST BATCH SYSTEM
    for (let i = 0; i < selectedGroups.length; i += batchSize) {
      const batch = selectedGroups.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async ({ threadID }) => {
          try {
            await api.sendMessage(formSend, threadID);
            success++;
          } catch (err) {
            failed.push(threadID);
          }
        })
      );

      await new Promise(res => setTimeout(res, delayPerBatch));
    }

    selectionCache.delete(event.senderID);

    message.reply(`🍓𝙳𝙾𝙽𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴 𝚂𝙴𝙽𝚃...!\n💌 𝚂𝚄𝙲𝙲𝙴𝚂𝚂: ${success}\n🐱 𝚂𝙾𝚁𝚁𝚈 𝙱𝙱𝙴 𝙵𝙰𝙸𝙻𝙴𝙳: ${failed.length}`);
  }
};