const axios = require("axios");

module.exports = {
  config: {
    name: "overflow",
    version: "3.5",
    author: "Eren",
    countDown: 5,
    role: 2,
    shortDescription: "Watch overflow 🌚 (VIP only)",
    longDescription: "List all episodes and play selected one",
    category: "hentai",
    guide: "{pn} => Show all episodes and select and watch"
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      // VIP check
      const senderData = await usersData.get(event.senderID);
      if (!senderData.vip) {
        return api.sendMessage(
          "❌ This command is only available for VIP users.",
          event.threadID,
          event.messageID
        );
      }

      // Fetch episode list
      const res = await axios.get("https://high-school-dxd.onrender.com/dxd");
      const episodes = res.data;

      if (!Array.isArray(episodes) || episodes.length === 0)
        return api.sendMessage("❌ No episodes found.", event.threadID);

      let msg = `🎬 Overflow Hanime Episodes:\n\n`;
      const mapEp = [];

      episodes.forEach((epData, i) => {
        msg += `${i + 1}: ${epData.title}\n`;
        mapEp.push(epData);
      });

      msg += `\n📝 Reply with episode number to watch`;

      // Send episode list
      return api.sendMessage(msg, event.threadID, (err, info) => {
        if (err) return console.error(err);

        // Save reply data
        if (!global.GoatBot) global.GoatBot = {};
        if (!global.GoatBot.onReply) global.GoatBot.onReply = new Map();
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          data: mapEp
        });
      }, event.messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Failed to load episode list.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (!Reply) return;
    if (event.senderID !== Reply.author) return;

    const chosen = parseInt(event.body);
    const epList = Reply.data;

    if (isNaN(chosen) || chosen < 1 || chosen > epList.length)
      return api.sendMessage("❌ Invalid episode number.", event.threadID, event.messageID);

    const selectedEp = epList[chosen - 1];

    // Delete the episode list message for a clean chat
    try {
      await api.unsendMessage(Reply.messageID);
    } catch (e) {
      console.log("Failed to delete episode list message:", e);
    }

    // Send video as a reply
    try {
      const stream = await global.utils.getStreamFromURL(selectedEp.video);
      return api.sendMessage({
        body: `🎥 ${selectedEp.title}`,
        attachment: stream
      }, event.threadID, event.messageID);
    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ Failed to load the video.", event.threadID, event.messageID);
    }
  }
};
