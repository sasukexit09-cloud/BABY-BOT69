module.exports.config = {
  name: 'allbox',
  version: '1.0.2',
  credits: 'BABY BOT TEAM (Fixed by Maya)',
  hasPermssion: 2,
  description: '[Ban/Unban/Del/Remove] Manage joined groups.',
  commandCategory: 'Admin',
  usages: '[page/all]',
  cooldowns: 5
};

module.exports.handleReply = async function ({ api, event, Threads, handleReply }) {
  if (event.senderID != handleReply.author) return;

  const moment = require("moment-timezone");
  const time = moment.tz("Asia/Dhaka").format("HH:mm:ss - DD/MM/YYYY");

  const arg = event.body.split(" ");
  const index = arg[1] - 1;

  const id = handleReply.groupid[index];
  const name = handleReply.groupName[index];

  if (!id) return api.sendMessage("❌ Invalid number!", event.threadID);

  // ---------------- BAN ----------------
  if (["ban", "Ban"].includes(arg[0])) {
    const data = (await Threads.getData(id)).data || {};
    data.banned = 1;
    data.dateAdded = time;

    await Threads.setData(id, { data });
    global.data.threadBanned.set(id, { dateAdded: time });

    return api.sendMessage(
      `✅ Ban Success\n\n🔷 ${name}\n🔰 TID: ${id}`,
      event.threadID
    );
  }

  // --------------- UNBAN ---------------
  if (["unban", "Unban", "ub", "Ub"].includes(arg[0])) {
    const data = (await Threads.getData(id)).data || {};
    data.banned = 0;
    data.dateAdded = null;

    await Threads.setData(id, { data });
    global.data.threadBanned.delete(id);

    return api.sendMessage(
      `✅ Unban Success\n\n🔷 ${name}\n🔰 TID: ${id}`,
      event.threadID
    );
  }

  // ---------------- DELETE DATA ----------------
  if (["del", "Del"].includes(arg[0])) {

    await Threads.delData(id);

    return api.sendMessage(
      `🗑️ Delete Success\n\n🔷 ${name}\n🔰 TID: ${id}`,
      event.threadID
    );
  }

  // ---------------- OUT GROUP ----------------
  if (["out", "Out"].includes(arg[0])) {

    api.removeUserFromGroup(api.getCurrentUserID(), id, () => {
      api.sendMessage(
        `🚪 Bot Removed\n\n🔷 ${name}\n🔰 TID: ${id}`,
        event.threadID
      );
    });

    return;
  }
};


module.exports.run = async function ({ api, event, args }) {
  let threads;

  try {
    threads = await api.getThreadList(500, null, ["INBOX"]);
  } catch (e) {
    return api.sendMessage("⚠️ Can't load thread list!", event.threadID);
  }

  const list = threads
    .filter(t => t.isGroup)
    .map(t => ({
      name: t.name,
      id: t.threadID,
      count: t.messageCount
    }))
    .sort((a, b) => b.count - a.count);

  let page = 1;
  const limit = 100;

  if (args[0] && !isNaN(args[0])) page = parseInt(args[0]);
  const total = Math.ceil(list.length / limit);

  if (page > total) page = total;

  const start = (page - 1) * limit;
  const end = start + limit;

  let msg = `🎭 GROUP LIST (Page ${page}/${total}) 🎭\n\n`;

  const groupid = [];
  const groupName = [];

  list.slice(start, end).forEach((g, idx) => {
    msg += `${start + idx + 1}. ${g.name}\n🔰 TID: ${g.id}\n💌 Messages: ${g.count}\n\n`;
    groupid.push(g.id);
    groupName.push(g.name);
  });

  msg += `Reply: Ban / Unban / Del / Out + number`;

  api.sendMessage(msg, event.threadID, (e, info) => {
    global.client.handleReply.push({
      name: module.exports.config.name,
      author: event.senderID,
      messageID: info.messageID,
      groupid,
      groupName,
      type: "reply"
    });
  });
};
