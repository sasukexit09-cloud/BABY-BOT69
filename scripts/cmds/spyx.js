const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

/**
* @author MahMUD
* @author: do not delete it
*/

module.exports = {
  config: {
    name: "spyx",
    version: "1.7",
    role: 0,
    author: "AYAN BBE",
    category: "info",
    countDown: 10
  },

  onStart: async function ({ event, message, api, args, usersData }) {
     const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68); 
     if (module.exports.config.author !== obfuscatedAuthor) {
     return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
     }
    const { senderID, mentions, type, messageReply } = event;
    let uid = type === "message_reply" ? messageReply.senderID : Object.keys(mentions)[0] || senderID;

    if (args[0] && !args[0].startsWith("--")) {
      if (/^\d+$/.test(args[0])) uid = args[0];
      else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) uid = match[1];
      }
    }

    try {
      const allUsers = await usersData.getAll();
      const userData = await usersData.get(uid) || {};
      const userInfo = await api.getUserInfo(uid);
      const user = userInfo[uid] || {};

      const money = userData.money || 0;
      const exp = userData.exp || 0;

      const expRank = allUsers.sort((a, b) => (b.exp || 0) - (a.exp || 0)).findIndex(u => u.userID == uid) + 1;
      const moneyRank = allUsers.sort((a, b) => (b.money || 0) - (a.money || 0)).findIndex(u => u.userID == uid) + 1;

      const baseUrl = await baseApiUrl();
      let janTeach = "0", janTeachRank = "N/A";

      try {
        const res = await axios.get(`${baseUrl}/api/jan/list/all`);
        const entries = Object.entries(res.data?.data || {})
          .map(([id, val]) => ({ userID: id, value: parseInt(val) || 0 }))
          .sort((a, b) => b.value - a.value);

        const userTeachData = entries.find(d => d.userID === uid);
        if (userTeachData) {
          janTeach = userTeachData.value;
          janTeachRank = entries.findIndex(d => d.userID === uid) + 1;
        }
      } catch (e) {}

      const genderText = user.gender === 1 ? "Girl" : user.gender === 2 ? "Boy" : "Other";

      const msg = `╭────[ 𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎 ]
├‣ 𝙽𝚊𝚖𝚎: ${user.name || "Unknown"}
├‣ 𝙶𝚎𝚗𝚍𝚎𝚛: ${genderText}
├‣ 𝚄𝙸𝙳: ${uid}
├‣ 𝙲𝚕𝚊𝚜𝚜: FRIEND
├‣ 𝚄𝚜𝚎𝚛𝚗𝚊𝚖𝚎: ${user.vanity || "none"}
├‣ 𝙱𝚒𝚛𝚝𝚑𝚍𝚊𝚢: Private
├‣ 𝙽𝚒𝚌𝚔𝙽𝚊𝚖𝚎: None
╰‣ 𝙵𝚛𝚒𝚎𝚗𝚍 𝚠𝚒𝚝𝚑 𝚋𝚘𝚝: ${user.isFriend ? "Yes ✅" : "No ❌"}

╭────[ 𝐔𝐒𝐄𝐑 𝐒𝐓𝐀𝐓𝐒 ]
├‣ 𝚄𝚜𝚎𝚛 𝚁𝚊𝚗𝚔: #${expRank}/${allUsers.length}
├‣ 𝙴𝚇𝙿: ${formatMoney(exp)}
├‣ 𝙱𝚊𝚕𝚊𝚗𝚌𝚎: ${formatMoney(money)}
├‣ 𝙱𝚊𝚕𝚊𝚗𝚌𝚎 𝚁𝚊𝚗𝚔: #${moneyRank}
╰‣ 𝙰𝚕𝚒𝚢𝚊 𝚃𝚎𝚊𝚌𝚑: ${janTeach} #${janTeachRank}`;

      return message.reply(msg);
    } catch (err) {
      return message.reply(`Error: ${err.message}`);
    }
  }
};

function formatMoney(num) {
  if (!num) return "0";
  let n = typeof num !== "number" ? parseInt(num) || 0 : num;
  const units = ["", "K", "M", "B", "T"];
  let unit = 0;
  while (n >= 1000 && ++unit < units.length) n /= 1000;
  return n.toFixed(1).replace(/\.0$/, "") + units[unit];
}