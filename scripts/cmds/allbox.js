const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "allbox",
    version: "1.0.2",
    author: "BABY BOT TEAM & Gemini",
    countDown: 5,
    role: 2, // Admin only
    shortDescription: {
      en: "Manage joined groups (Ban/Unban/Del/Out)"
    },
    longDescription: {
      en: "View list of all groups and manage them using reply."
    },
    category: "Admin",
    guide: {
      en: "{pn} [page]"
    }
  },

  onReply: async function ({ api, event, Reply, threadsData, message }) {
    if (event.senderID != Reply.author) return;

    const time = moment.tz("Asia/Dhaka").format("HH:mm:ss - DD/MM/YYYY");
    const arg = event.body.split(" ");
    const action = arg[0].toLowerCase();
    const index = parseInt(arg[1]) - 1;

    const id = Reply.groupid[index];
    const name = Reply.groupName[index];

    if (!id) return message.reply("❌ Invalid number!");

    try {
      // ---------------- BAN ----------------
      if (action === "ban") {
        await threadsData.set(id, {
          "data.banned": true,
          "data.dateAdded": time
        });
        return message.reply(`✅ Ban Success\n\n🔷 ${name}\n🔰 TID: ${id}`);
      }

      // --------------- UNBAN ---------------
      if (["unban", "ub"].includes(action)) {
        await threadsData.set(id, {
          "data.banned": false,
          "data.dateAdded": null
        });
        return message.reply(`✅ Unban Success\n\n🔷 ${name}\n🔰 TID: ${id}`);
      }

      // ---------------- DELETE DATA ----------------
      if (action === "del") {
        await threadsData.remove(id);
        return message.reply(`🗑️ Delete Success\n\n🔷 ${name}\n🔰 TID: ${id}`);
      }

      // ---------------- OUT GROUP ----------------
      if (action === "out") {
        api.removeUserFromGroup(api.getCurrentUserID(), id, (err) => {
          if (err) return message.reply("❌ Error removing bot!");
          message.reply(`🚪 Bot Removed\n\n🔷 ${name}\n🔰 TID: ${id}`);
        });
        return;
      }
    } catch (e) {
      console.error(e);
      return message.reply("❌ Something went wrong!");
    }
  },

  onStart: async function ({ api, event, args, message }) {
    let threads;
    try {
      threads = await api.getThreadList(100, null, ["INBOX"]);
    } catch (e) {
      return message.reply("⚠️ Can't load thread list!");
    }

    const list = threads
      .filter(t => t.isGroup)
      .map(t => ({
        name: t.name || "Unnamed Group",
        id: t.threadID,
        count: t.messageCount || 0
      }))
      .sort((a, b) => b.count - a.count);

    let page = parseInt(args[0]) || 1;
    const limit = 20; // প্রতি পেজে ২০টি গ্রুপ
    const total = Math.ceil(list.length / limit);

    if (page > total) page = total;
    if (page < 1) page = 1;

    const start = (page - 1) * limit;
    const end = start + limit;

    let msg = `🎭 𝐆𝐑𝐎𝐔𝐏 𝐋𝐈𝐒𝐓 (Page ${page}/${total}) 🎭\n\n`;

    const groupid = [];
    const groupName = [];

    list.slice(start, end).forEach((g, idx) => {
      msg += `${idx + 1}. ${g.name}\n🔰 𝐓𝐈𝐃: ${g.id}\n💌 𝐌𝐬𝐠: ${g.count}\n\n`;
      groupid.push(g.id);
      groupName.push(g.name);
    });

    msg += `👉 Reply: Ban / Unban / Del / Out + index (e.g., Ban 1)`;

    return message.reply(msg, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        messageID: info.messageID,
        groupid,
        groupName
      });
    });
  }
};