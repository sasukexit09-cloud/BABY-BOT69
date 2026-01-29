const fs = require("fs-extra");
const axios = require("axios");

module.exports = {
  config: {
    name: "alive",
    version: "1.5",
    author: "Xos Eren",
    shortDescription: "Alive check with voice",
    longDescription: "Replies with bot status + a cute voice",
    category: "alive",
    guide: {
      en: "Type: alive"
    },
    usePrefix: true,
    onChat: true
  },

  onStart: async ({ message }) => sendAlive(message),

  onChat: async ({ event, message }) => {
    const text = event.body?.toLowerCase().trim();
    if (text === "alive") {
      await sendAlive(message);
    }
  }
};

async function sendAlive(message) {
  const voiceUrl = "https://files.catbox.moe/qbzn1a.mp3";
  const voicePath = `${__dirname}/cache/alive.mp3`;

  try {
    // Download voice
    const res = await axios({
      method: "GET",
      url: voiceUrl,
      responseType: "stream"
    });

    const writer = res.data.pipe(fs.createWriteStream(voicePath));

    writer.on("finish", async () => {
      await message.reply({
        body: `
───────────────
✨ 𝙰𝙳𝙼𝙸𝙽 𝙰𝚈𝙰𝙽 ✨

𝙱𝙰𝙱𝚈 𝙸𝚂 𝙰𝙻𝙸𝚅𝙴 𝚄𝙼𝙼𝙼𝙼𝙰𝙷 😽💋
𝙼𝙰𝙳𝙴 𝙱𝚈: 𝙰𝚈𝙰𝙽𝚄 𝙱𝙱𝙴💋
𝙷𝙸𝙴 𝙱𝙰𝙱𝚈 𝙺𝙸𝚂𝚂 𝙼𝙴 💋

───────────────`,
        attachment: fs.createReadStream(voicePath)
      });

      fs.unlinkSync(voicePath); // Delete file after use
    });

    writer.on("error", (err) => {
      console.error("Audio download error:", err);
      message.reply("Failed to load voice.");
    });

  } catch (err) {
    console.error("Failed to fetch voice:", err);
    message.reply("Something went wrong.");
  }
}