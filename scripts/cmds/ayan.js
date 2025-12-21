module.exports = {
  config: {
    name: "AYAN",
    version: "1.3",
    author: "aYan",
    countDown: 5,
    role: 0,
    shortDescription: "mention owner trigger",
    longDescription: "trigger only when owner is mentioned",
    category: "no prefix",
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    // কোনো মেনশন না থাকলে কিছু করবে না
    if (!event.mentions || Object.keys(event.mentions).length === 0) return;

    // এখানে owner এর Facebook ID দিন
    const ownerID = "61584308632995"; // <-- এখানে owner এর ID বসাতে হবে

    // মেনশনগুলো চেক করা হচ্ছে
    if (!event.mentions[ownerID]) return;

    try {
      const videoStream = await global.utils.getStreamFromURL(
        "https://files.catbox.moe/qh4864.mp4"
      );

      return message.reply({
        body:
`═════════════◊
💖 𝐁𝐨𝐭 & 𝐎𝐰𝐧𝐞𝐫 💖
─────────────
👤 𝐍𝐚𝐦𝐞:- AYAN💋👅
🤖 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞:- ◦•●♡ʏᴏᴜʀ ʙʙʏ♡●•◦
📩 𝐂𝐨𝐧𝐭𝐚𝐜𝐭:- [Click Here](https://m.me/Ayanokujo.6969)
═════════════◊`,
        attachment: videoStream
      });
    } catch (err) {
      return message.reply("ভিডিও লোড করতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।");
    }
  }
};