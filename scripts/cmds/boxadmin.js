module.exports.config = {
  name: "boxadmin",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "AYAN BBE💋",
  description: "Add/remove/list admin via me, mention, reply, or onStart",
  commandCategory: "system",
  usages: "boxadmin me | boxadmin add/remove @mention | boxadmin list | reply",
  cooldowns: 5,
  onStart: true // bot চালু হলে স্বয়ংক্রিয় ফাংশন
};

const cleanName = (name) => name ? name.replace(/\s+/g, " ").trim() : "User";

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const botID = api.getCurrentUserID();

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botIsAdmin = threadInfo.adminIDs.some(ad => ad.id == botID);
    const ownerID = threadInfo.ownerID;

    // LIST ADMINS
    if (args[0]?.toLowerCase() === "list") {
      const admins = threadInfo.adminIDs.map(a => a.id === ownerID ? "👑 Owner" : `👤 ${a.id}`).join("\n");
      return api.sendMessage(`🌸 Group Admins:\n${admins}`, threadID);
    }

    // ADD/REMOVE LOGIC
    let action = args[0]?.toLowerCase() === "me" ? "add" : args[0]?.toLowerCase();
    if (!["add", "remove"].includes(action)) 
      return api.sendMessage("🌸 Usage: boxadmin me | boxadmin add/remove @mention | reply", threadID, event.messageID);

    // DETERMINE TARGET UID
    let uid;
    if (args[0]?.toLowerCase() === "me" || args[1]?.toLowerCase() === "me") {
      uid = event.senderID;
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } else if (event.type === "message_reply" && event.messageReply) {
      uid = event.messageReply.senderID;
    } else {
      return api.sendMessage("🌸 Usage: boxadmin me | boxadmin add/remove @mention | reply", threadID, event.messageID);
    }

    // OWNER PROTECTION
    if (uid == ownerID && action === "remove") 
      return api.sendMessage("⚠️ Owner কে remove করা যাবে না!", threadID, event.messageID);

    const userInfo = await api.getUserInfo([uid, event.senderID]);
    const senderName = cleanName(userInfo[event.senderID]?.name || "আপনি");
    const targetName = cleanName(userInfo[uid]?.name || "User");

    const targetIsAdmin = threadInfo.adminIDs.some(ad => ad.id == uid);

    if (!botIsAdmin && uid !== event.senderID) 
      return api.sendMessage("🌺 আমাকে আগে গ্রুপে অ্যাডমিন বানাতে হবে এই কমান্ডটি ব্যবহারের জন্য!", threadID, event.messageID);

    // ADD ADMIN
    if (action === "add") {
      if (targetIsAdmin) return api.sendMessage(`✅ ${targetName} আগে থেকেই অ্যাডমিন!`, threadID, event.messageID);
      await api.changeAdminStatus(threadID, uid, true);
      return api.sendMessage(uid === event.senderID 
        ? `✅ ${senderName} নিজেকে অ্যাডমিন বানিয়েছে! 🌸` 
        : `✅ ${senderName} ${targetName}-কে অ্যাডমিন বানিয়েছে! 😘`, threadID);
    }

    // REMOVE ADMIN
    if (action === "remove") {
      if (!targetIsAdmin) return api.sendMessage(`❌ ${targetName} এখনও অ্যাডমিন নয়!`, threadID, event.messageID);
      await api.changeAdminStatus(threadID, uid, false);
      return api.sendMessage(uid === event.senderID 
        ? `⚠️ ${senderName} নিজেকে অ্যাডমিন থেকে রিমুভ করেছে! 🐸` 
        : `❌ ${targetName} কে অ্যাডমিন থেকে রিমুভ করেছে! 🤣`, threadID);
    }

  } catch (err) {
    console.error("Boxadmin Error:", err);
    return api.sendMessage(`⚠️ Error: ${err.message}`, threadID, event.messageID);
  }
};

// ONSTART FUNCTION
module.exports.onStart = async function({ api, threadID }) {
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    api.sendMessage(`🌸 BoxAdmin module is active!\nCurrent owner: 👑 ${threadInfo.ownerID}`, threadID);
  } catch (err) {
    console.error("Boxadmin OnStart Error:", err);
  }
};
