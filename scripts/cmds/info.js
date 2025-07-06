module.exports = {
  config: {
    name: "info",
    version: "1.5",
    author: "✨ Tarek ✨",
    shortDescription: "Display bot and owner info",
    longDescription: "Shows owner's and bot's details with videos.",
    category: "INFO",
    guide: { en: "[user]" },
  },

  onStart: async function ({ api, event }) {
    const videoUrls = [
      // ✅ Fixed: Converted to direct-download format
      "https://drive.google.com/uc?export=download&id=1T76MSnPSi4oIK4UFP9Uhy3QW53K6jAw1"
    ];

    const msgBody = `
┌────────────────┐
           𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢
└────────────────┘

  ☁️ 𝗡𝗮𝗺𝗲 ➝ 𝗧𝗮𝗿𝗲𝗸 𝗦𝗵𝗶𝗸𝗱𝗮𝗿
  🎂 𝗔𝗴𝗲 ➝ 18+
  🧠 𝗘𝗱𝘂𝗰𝗮𝘁𝗶𝗼𝗻 ➝ 𝗗𝗶𝗽𝗹𝗼𝗺𝗮 𝗶𝗻 𝗖𝗶𝘃𝗶𝗹 𝗘𝗻𝗴𝗶𝗻𝗲𝗲𝗿𝗶𝗻𝗴                  
  ❄️ 𝘀𝗲𝘀𝘀𝗶𝗼𝗻 ➝ 2023-24
  🏠 𝗙𝗿𝗼𝗺 ➝ 𝗧𝗮𝗻𝗴𝗮𝗶𝗹
  ❤️ 𝗥𝗲𝗹𝗮𝘁𝗶𝗼𝗻 ➝ 𝐒𝐢𝐧𝐠𝐥𝐞
  ♂️ 𝗚𝗲𝗻𝗱𝗲𝗿 ➝ 𝐌𝐚𝐥𝐞

━━━━━━━━━━━━━━━━━━

 ✦ 𝗛𝗼𝗯𝗯𝗶𝗲𝘀 ➝ ɢᴀᴍɪɴɢ • ᴍᴜsɪᴄ

━━━━━━━━━━━━━━━━━━

✨ 𝗕𝗼𝘁 𝗧𝘆𝗽𝗲 ➝ 𝗚𝗼𝗮𝘁𝗕𝗼𝘁 𝗩𝟮

💫 𝗧𝗵𝗮𝗻𝗸𝘀 𝗳𝗼𝗿 𝘂𝘀𝗶𝗻𝗴 𝗺𝗲 💫
    `;

    const randomVideo = videoUrls[Math.floor(Math.random() * videoUrls.length)];

    api.sendMessage({
      body: msgBody,
      attachment: await global.utils.getStreamFromURL(randomVideo),
    }, event.threadID, event.messageID);
  },
};
