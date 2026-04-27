const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    version: "2.0",
    author: "AYAN BBE💋",
    shortDescription: "Display bot and owner information",
    longDescription: "Shows detailed info including bot name, prefix, and owner's personal information.",
    category: "Special",
    guide: {
      en: "{p}{n}",
    },
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const id = event.senderID;
    const userData = await usersData.get(id);
    const name = userData.name;
    const mention = [{ id, tag: name }];

    // 🛠 Convert Google Drive view link to direct download link
    const fileId = "1QQ4rcb5mnLytHKuavPxOjx0rF-YuOTaS";
    const directURL = `https://files.catbox.moe/hxntdd.mp4`;

    // ⏬ Download the file temporarily
    const filePath = path.join(__dirname, "owner-video.mp4");
    const response = await axios({
      url: directURL,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const info = 
`━━━━━━━━━━━━━━━━
👋 𝗛𝗲𝗹𝗹𝗼, ${name}

📌 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢
• 𝗡𝗮𝗺𝗲➝ ◦•●♡ʏᴏᴜʀ ᴍɪᴋᴏ♡●•◦
• 𝗣𝗿𝗲𝗳𝗶𝘅 ➝! 

👤 𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢
• 𝗢𝘄𝗻𝗲𝗿 𝗮𝗰𝗰𝗼𝘂𝗻𝘁 ➝ https://www.facebook.com/profile.php?id=61580589916867
• 𝗡𝗮𝗺𝗲 ➝ 🍁 𝙰𝚈𝙰𝙽 🍁
• 𝗚𝗲𝗻𝗱𝗲𝗿 ➝ 𝙼𝙰𝙻𝙴
• 𝗔𝗴𝗲 ➝ 18 👄
• 𝗦𝘁𝗮𝘁𝘂𝘀 ➝ 𝙼𝙰𝚁𝚁𝙸𝙴𝙳 𝚆𝙸𝚃𝙷 𝙽𝚄𝙷𝙰 🦋
• 𝗘𝗱𝘂𝗰𝗮𝘁𝗶𝗼𝗻 ➝ 𝙴𝚇𝙿 𝙾𝙵 𝚃𝚁𝚇 🔱
• 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻 ➝ 𝙶𝙰𝚉𝙸𝙿𝚄𝚁/𝙽𝙾𝙰𝙺𝙷𝙰𝙻𝙸 ⚜️
━━━━━━━━━━━━━━━━━`;

    message.reply({
      body: info,
      mentions: mention,
      attachment: fs.createReadStream(filePath)
    });
  }
};