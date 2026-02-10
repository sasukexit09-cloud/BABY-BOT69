const { getTime } = global.utils;
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "leave",
    version: "2.2",
    author: "𝐀𝐘𝐀𝐍 (Upgraded by Maya)",
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
        "Respect VIP members 🙏",

      // 🔥 roast lines for admin kick
      kickRoast:
        "\n\n😈 𝐑𝐔𝐋𝐄𝐒 𝐍𝐀 𝐌𝐀𝐍𝐋𝐄 𝐌𝐀𝐑𝐀 𝐓𝐎 𝐊𝐇𝐄𝐓𝐄𝐘 𝐇𝐎𝐁𝐄 𝐏𝐈𝐎🚪\n" +
        "𝐑 𝐃𝐎𝐒𝐇 𝐃𝐈𝐓𝐄 𝐄𝐒𝐎 𝐍𝐀 𝐀𝐃𝐌𝐈𝐍 𝐓𝐔𝐌𝐀𝐃𝐄𝐑 𝐌𝐎𝐓𝐎 𝐁𝐀𝐋𝐏𝐀𝐊𝐍𝐀 𝐌𝐄𝐌𝐁𝐄𝐑𝐒 𝐂𝐇𝐔𝐒𝐄 𝐍𝐀😼🔥"
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang, usersData }) => {
    const hours = new Date().getHours();
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
      if (fs.existsSync(filePath)) return;
      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, res.data);
    };

    /* ================= SELF LEAVE ================= */
    if (logMessageType === "log:unsubscribe") {
      const uid = logMessageData.leftParticipantFbId;

      let userName = "Someone";
      try {
        const userInfo = await api.getUserInfo(uid);
        userName = userInfo?.[uid]?.name || userName;
      } catch (e) {}

      const isVip = await usersData?.isVip?.(uid);

      let text = isVip ? getLang("vipLeave") : getLang("normalLeave");
      text = text
        .replace(/\{userName\}/g, userName)
        .replace(/\{boxName\}/g, threadData.threadName || "this group")
        .replace(/\{session\}/g, getSession());

      // funny line ONLY for self leave
      text += "\n\n𝐣𝐚 𝐤𝐮𝐭𝐭𝐚 𝐯𝐚𝐠𝐠𝐠 𝐡𝐮𝐬𝐬𝐬 😾😝";

      const imgUrl = "https://files.catbox.moe/asuxqo.jpg";
      const imgPath = path.join(__dirname, isVip ? "vip_leave.jpg" : "leave.jpg");
      await downloadImage(imgUrl, imgPath);

      return message.send({
        body: text,
        attachment: fs.createReadStream(imgPath)
      });
    }

    /* ================= ADMIN KICK ================= */
    if (logMessageType === "log:admin_removed") {
      const uid = logMessageData.userFbId;

      let userName = "Someone";
      try {
        const userInfo = await api.getUserInfo(uid);
        userName = userInfo?.[uid]?.name || userName;
      } catch (e) {}

      const isVip = await usersData?.isVip?.(uid);

      let text = isVip ? getLang("vipKick") : getLang("normalKick");
      text = text
        .replace(/\{userName\}/g, userName)
        .replace(/\{boxName\}/g, threadData.threadName || "this group");

      // 🔥 roast added ONLY when admin kicks
      text += getLang("kickRoast");

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