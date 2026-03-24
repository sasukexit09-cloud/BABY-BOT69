const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "botwelcome",
    version: "3.0",
    author: "Saimx69x",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const botID = api.getCurrentUserID();
    const newUsers = logMessageData.addedParticipants;

    // Bot group e add hole
    if (!newUsers.some(u => u.userFbId === botID)) return;

    try {
      const imageUrl = "https://files.catbox.moe/ewchg9.png";
      const tmp = path.join(__dirname, "..", "cache");
      await fs.ensureDir(tmp);
      const imagePath = path.join(tmp, `bot_join.png`);

      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(imagePath, response.data);

      await api.sendMessage({
        body: "🍓𝙱𝙰𝙱𝚈 𝚃𝙷𝙰𝙽𝙺𝚂 𝙵𝙾𝚁 𝙸𝙽𝚅𝙸𝚃𝙸𝙽𝙶 𝙼𝙸𝙺𝙾 𝚃𝙾 𝚃𝙷𝙴 𝙶𝚁𝙾𝚄𝙿🍓",
        attachment: fs.createReadStream(imagePath)
      }, threadID);

      fs.unlinkSync(imagePath);

    } catch (err) {
      console.error("❌ Error sending bot welcome message:", err);
    }
  }
};