const os = require("os");
const moment = require("moment-timezone");

module.exports.config = {
  name: "info2",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Maya x Ayan",
  description: "Display Baby Bot Information",
  commandCategory: "Info",
  usages: "info",
  cooldowns: 5,
};

module.exports.onStart = async function ({ api, event, Threads, Users }) {
  const prefix = global.config.PREFIX || "!";
  const ping = Date.now() - event.timestamp;

  // Time & uptime
  const time = moment.tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm:ss A");
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);

  // Bot stats
  const totalUsers = global.data.allUserID?.length || 0;
  const totalThreads = global.data.allThreadID?.length || 0;

  // Main info message
  const infoMessage = `╭━━━━━━━━━━━━━━━━╮
      🤖 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢
╰━━━━━━━━━━━━━━━━╯

🤖 Bot Name: **𝐁𝐀𝐁𝐘 𝐁𝐎𝐓 💞**
🔱 Prefix: **${global.config.PREFIX}**
🎛️ Box Prefix: **${prefix}**
📦 Modules: **${global.client.commands.size}**
🏓 Ping: **${ping}ms**

╰━━━━━━━━━━━━──✦

╭── 👑 𝗢𝗪𝗡𝗘𝗥 ──╮
👤 Name: **𝐀𝐘𝐀𝐍 𝐀𝐇𝐌𝐄𝐃𝐙**
🌐 FB: fb.com/61582355550594
💬 Msg: m.me/Ayanokujo.69.69
📱 WhatsApp: +8801914227459
╰━━━━━━━━━━━━━━╯

📊 **SYSTEM**
⏳ Uptime: **${h}h ${m}m ${s}s**
👥 Users: **${totalUsers}**
💬 Groups: **${totalThreads}**
🕒 Time: **${time}**

✨ Thanks for using **𝐁𝐀𝐁𝐘 𝐁𝐎𝐓 💋**
`;

  return api.sendMessage(infoMessage, event.threadID, event.messageID);
};
