module.exports = {
  config: {
    name: "pending",
    version: "1.0",
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴",
    countDown: 5,
    role: 2,
    shortDescription: { vi: "", en: "" },
    longDescription: { vi: "", en: "" },
    category: "ArYan"
  },

  langs: {
    en: {
      invaildNumber: "%1 is not a valid number",
      cancelSuccess: "Refused %1 thread!",
      approveSuccess: "Approved successfully %1 threads!",
      cantGetPendingList: "Can't get the pending list!",
      returnListPending: "»「PENDING」«❮ Total pending threads: %1 ❯\n\n%2",
      returnListClean: "「PENDING」There is no thread in the pending list"
    }
  },

  onReply: async function ({ api, event, Reply, getLang, commandName }) {
    if (String(event.senderID) !== String(Reply.author)) return;

    const { body, threadID, messageID } = event;
    let count = 0;

    // CANCEL
    if ((!isNaN(body) ? false : body.startsWith("c") || body.startsWith("cancel"))) {
      const index = body.slice(1).trim().split(/\s+/);
      for (const ArYanIndex of index) {
        if (isNaN(ArYanIndex) || ArYanIndex <= 0 || ArYanIndex > Reply.pending.length)
          return api.sendMessage(getLang("invaildNumber", ArYanIndex), threadID, messageID);

        api.removeUserFromGroup(api.getCurrentUserID(), Reply.pending[ArYanIndex - 1].threadID);
        count++;
      }
      return api.sendMessage(getLang("cancelSuccess", count), threadID, messageID);
    }

    // APPROVE
    const index = body.split(/\s+/);
    for (const ArYanIndex of index) {
      if (isNaN(ArYanIndex) || ArYanIndex <= 0 || ArYanIndex > Reply.pending.length)
        return api.sendMessage(getLang("invaildNumber", ArYanIndex), threadID, messageID);

      const tid = Reply.pending[ArYanIndex - 1].threadID;

      // SEND PREFIX + OWNER + CONTACT
      api.sendMessage(
        `╭────֍  
│ 𝗣𝗥𝗘𝗙𝗜𝗫 : !
│ 𝗢𝗪𝗡𝗘𝗥 : AYAN 🕷️
│ 𝗖𝗢𝗡𝗧𝗔𝗖𝗧 : https://www.facebook.com/Ayanokujo.6969
╰──────────────֍

╭────֍
│ 🍨𝚈𝙴𝙰 𝙼𝙸𝙺𝙾 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳 🍨
╰─────────────֍`,
        tid,
        async () => {
          // AUTO VIDEO SEND
          api.sendMessage(
            {
              body: "🍨 𝙼𝙸𝙺𝙾 𝙸𝚂 𝙽𝙾𝚆 𝙰𝙻𝙸𝚅𝙴 🍨",
              attachment: await global.utils.getStreamFromURL("https://files.catbox.moe/ddxeq9.mp4")
            },
            tid
          );
        }
      );

      count++;
    }

    return api.sendMessage(getLang("approveSuccess", count), threadID, messageID);
  },

  onStart: async function ({ api, event, getLang, commandName }) {
    const { threadID, messageID } = event;

    let msg = "", index = 1;

    try {
      var spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      var pending = await api.getThreadList(100, null, ["PENDING"]) || [];
    } catch (e) {
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }

    const list = [...spam, ...pending].filter(g => g.isSubscribed && g.isGroup);

    for (const group of list) msg += `${index++}/ ${group.name} (${group.threadID})\n`;

    if (list.length !== 0)
      return api.sendMessage(
        getLang("returnListPending", list.length, msg),
        threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            pending: list
          });
        },
        messageID
      );

    return api.sendMessage(getLang("returnListClean"), threadID, messageID);
  }
};
