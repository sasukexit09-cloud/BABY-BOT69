module.exports = {
  config: {
    name: "AYAN",
    version: "1.0",
    author: "aYan",
    countDown: 5,
    role: 0,
    shortDescription: "no prefix",
    longDescription: "no prefix trigger",
    category: "no prefix",
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    if (!event.body) return;

    const text = event.body.toLowerCase();

    if (text === "ayan") {
      return message.reply({
        body:
`═════════════◊
💖 𝐁𝐨𝐭 & 𝐎𝐰𝐧𝐞𝐫 💖
─────────────
👤 𝐍𝐚𝐦𝐞:- AYAN💋👅
🤖 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞:- ◦•●♡ʏᴏᴜʀ ʙʙʏ♡●•◦
📩 𝐂𝐨𝐧𝐭𝐚𝐜𝐭:- [Click Here](https://m.me/Ayanokujo.6969)
═════════════◊`,

        attachment: await global.utils.getStreamFromURL(
          "https://files.catbox.moe/qh4864.mp4"
        )
      });
    }
  }
};
