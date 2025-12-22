const { getTime } = global.utils;
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "leave",
    version: "2.0",
    author: "Tarek (Upgraded by Maya)",
    category: "events"
  },

  langs: {
    en: {
      session1: "𝗺𝗼𝗿𝗻𝗶𝗻𝗴",
      session2: "𝗻𝗼𝗼𝗻",
      session3: "𝗮𝗳𝘁𝗲𝗿𝗻𝗼𝗼𝗻",
      session4: "𝗲𝘃𝗲𝗻𝗶𝗻𝗴",

      normalLeave:
        "💔 {userName} has left {boxName}...\nWe’ll miss you 😢\nHave a good {session}!",

      vipLeave:
        "💖 {userName} (VIP) has left {boxName}...\n" +
        "You were not just a member, you were family 🥺✨\n" +
        "This group won’t feel the same without you 💔\n" +
        "Take care & stay happy 🌸\n" +
        "Have a lovely {session} 🌙",

      normalKick:
        "⚠️ {userName} has been removed from {boxName}.\nPlease follow the rules next time.",

      vipKick:
        "🚨 VIP MEMBER REMOVED 🚨\n\n" +
        "{userName} was a valued VIP member of {boxName} 💎\n" +
        "This action should NOT be taken lightly ⚠️\n\n" +
        "Admins are advised to review the situation carefully.\n" +
        "Respect VIP members 🙏"
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang, usersData }) => {
    const hours = parseInt(getTime("HH"));
    const { threadID, logMessageData, logMessageType } = event;
    const threadData = await threadsData.get(threadID);

    if (threadData?.settings?.sendLeaveMessage === false) return;

    const getSession = () => {
      if (hours <= 10) return getLang("session1");
      if (hours <= 12) return getLang("session2");
      if (hours <= 18) return getLang("session3");
      return getLang("session4");
    };

    const downloadImage = async (url, filePath) => {
      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, res.data);
    };

    /* ================= LEAVE ================= */
    if (logMessageType === "log:unsubscribe") {
      const uid = logMessageData.leftParticipantFbId;
      const userInfo = await api.getUserInfo(uid);
      const userName = userInfo[uid]?.name || "Someone";

      const isVip = await usersData?.isVip?.(uid);

      let text = isVip ? getLang("vipLeave") : getLang("normalLeave");
      text = text
        .replace(/\{userName\}/g, userName)
        .replace(/\{boxName\}/g, threadData.threadName || "this group")
        .replace(/\{session\}/g, getSession());

      const imgUrl = "https://files.catbox.moe/1jy0ww.jpg";
      const imgPath = path.join(__dirname, isVip ? "vip_leave.jpg" : "leave.jpg");

      await downloadImage(imgUrl, imgPath);

      return message.send({
        body: text,
        attachment: fs.createReadStream(imgPath)
      });
    }

    /* ================= KICK ================= */
    if (logMessageType === "log:admin_removed") {
      const uid = logMessageData.userFbId;
      const userInfo = await api.getUserInfo(uid);
      const userName = userInfo[uid]?.name || "Someone";

      const isVip = await usersData?.isVip?.(uid);

      let text = isVip ? getLang("vipKick") : getLang("normalKick");
      text = text
        .replace(/\{userName\}/g, userName)
        .replace(/\{boxName\}/g, threadData.threadName || "this group");

      const imgUrl = "https://files.catbox.moe/27ym75.jpg";
      const imgPath = path.join(__dirname, isVip ? "vip_kick.jpg" : "kick.jpg");

      await downloadImage(imgUrl, imgPath);

      return message.send({
        body: text,
        attachment: fs.createReadStream(imgPath)
      });
    }
  }
};