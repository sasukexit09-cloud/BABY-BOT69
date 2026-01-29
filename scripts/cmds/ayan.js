module.exports = {
  config: {
    name: "AYAN",
    version: "2.6",
    author: "ayan", // owner name (auto detect)
    countDown: 5,
    role: 0,
    shortDescription: "MP3 for specific user, text for others",
    longDescription: "Replies MP3 to specific user, text to others when owner is mentioned",
    category: "no prefix"
  },

  onChat: async function ({ event, message }) {
    const OWNER_NAME = this.config.author.toLowerCase();
    const SPECIFIC_USER_ID = "61578295556160"; // trigger user
    const AUDIO_URL = "https://i.imgur.com/srRjXWw.mp3"; // direct MP3 link

    let isOwnerMentioned = false;

    // ===== mentions object =====
    if (event.mentions && typeof event.mentions === "object") {
      for (const id in event.mentions) {
        const name = event.mentions[id]?.toLowerCase?.() || "";
        if (name.includes(OWNER_NAME)) {
          isOwnerMentioned = true;
          break;
        }
      }
    }

    // ===== mentions array (new FB update) =====
    if (Array.isArray(event.mentions)) {
      for (const m of event.mentions) {
        if (m.tag && m.tag.toLowerCase().includes(OWNER_NAME)) {
          isOwnerMentioned = true;
          break;
        }
      }
    }

    // ===== fallback body check =====
    if (event.body && event.body.toLowerCase().includes(OWNER_NAME)) {
      isOwnerMentioned = true;
    }

    if (!isOwnerMentioned) return; // owner not mentioned, silent

    // ===== SPECIFIC USER MP3 =====
    if (event.senderID === SPECIFIC_USER_ID) {
      try {
        const audioStream = await global.utils.getStreamFromURL(AUDIO_URL);
        return message.reply({
          body: `🎵 𝙰𝚈𝙰𝙽 𝙴𝚁 𝙿𝙾𝙺𝙷𝙾 𝚃𝙷𝙴𝙺𝙴 𝚃𝚄𝙼𝙰𝚁 𝙹𝙾𝙽𝙽𝙾:`,
          attachment: audioStream
        });
      } catch (err) {
        console.error(err);
        return message.reply("𝙴𝚁𝚁𝙾𝚁 𝙱𝚈 𝙱𝚈");
      }
    }

    // ===== OTHER USERS TEXT REPLY =====
    return message.reply(
`═════════════◊
💖 𝐁𝐨𝐭 & 𝐎𝐰𝐧𝐞𝐫 💖
─────────────
👤 𝐍𝐚𝐦𝐞 : ${this.config.author} 💋
🤖 𝐁𝐨𝐭 : ◦•●♡ʏᴏᴜʀ ʙʙʏ♡●•◦
📩 𝐂𝐨𝐧𝐭𝐚𝐜𝐭 :
👉 https://m.me/Ayanokujo.6969
═════════════◊`
    );
  }
};
