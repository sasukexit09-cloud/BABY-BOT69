module.exports.config = {
  name: "info2",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "Maya x Ayan",
  description: "Stylish Info Panel with Anime Card",
  commandCategory: "For users",
  usages: "",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, Threads }) => {
  const axios = require("axios");
  const fs = require("fs-extra");
  const moment = require("moment-timezone");

  const time = moment.tz("Asia/Dhaka").format("DD/MM/YYYY - hh:mm A");

  const config = global.config;
  const threadData = (await Threads.getData(event.threadID)).data || {};
  const prefix = threadData.PREFIX || config.PREFIX;

  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);

  const totalUsers = global.data.allUserID.length;
  const totalThreads = global.data.allThreadID.length;
  const ping = Date.now() - event.timestamp;

  const animeImg = [
    "https://i.ibb.co/9nqwQwR/anime-card-1.jpg",
    "https://i.ibb.co/vxBnhZM/anime-card-2.jpg",
    "https://i.ibb.co/hV7K1Zm/anime-card-3.jpg"
  ];
  
  const img = animeImg[Math.floor(Math.random() * animeImg.length)];

  const msg = `
╭━━━ ✨ 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢 ✨ ━━━╮

🤖 Bot Name: **𝐁𝐀𝐁𝐘 𝐁𝐎𝐓 💞**
🔱 Prefix: **${config.PREFIX}**
🎛️ Box Prefix: **${prefix}**
📦 Modules: **${global.client.commands.size}**
🏓 Ping: **${ping}ms**

╰━━━━━━━━━━━━──✦

╭── 👑 𝗢𝗪𝗡𝗘𝗥 ──╮
👤 Name: **𝐀𝐘𝐀𝐍 𝐀𝐇𝐌𝐄𝐃𝐙**
🌐 FB: fb.com/61582355550594
💬 Msg: m.me/Ayanokujo.69
📱 WhatsApp: +8801914227459
╰━━━━━━━━━━━━━━╯

📊 **SYSTEM**
⏳ Uptime: **${h}h ${m}m ${s}s**
👥 Users: **${totalUsers}**
💬 Groups: **${totalThreads}**
🕒 Time: **${time}**

✨ Thanks for using **𝐁𝐀𝐁𝐘 𝐁𝐎𝐓 💋**
`;

  const path = __dirname + "/cache/animeinfo.jpg";
  const imgData = (await axios.get(img, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(path, Buffer.from(imgData, "binary"));

  return api.sendMessage(
    { body: msg, attachment: fs.createReadStream(path) },
    event.threadID,
    () => fs.unlinkSync(path)
  );
};
