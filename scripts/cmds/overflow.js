const axios = require("axios");

module.exports = {
  config: {
    name: "overflow",
    version: "4.0",
    author: "Eren (Fixed)",
    countDown: 5,
    role: 2,
    shortDescription: "Episode player",
    category: "media",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    try {
      const res = await axios.get("https://high-school-dxd.onrender.com/dxd", {
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      if (!res.data)
        return api.sendMessage("❌ API returned empty data.", event.threadID);

      const episodes = Object.values(res.data);
      if (!episodes.length)
        return api.sendMessage("❌ No episodes found.", event.threadID);

      let msg = "🎬 Episode List:\n\n";
      episodes.forEach((ep, i) => {
        msg += `${i + 1}. ${ep.title || "Untitled"}\n`;
      });

      msg += "\nReply with episode number";

      return api.sendMessage(msg, event.threadID, (err, info) => {
        if (err) return console.log(err);

        global.GoatBot.onReply.set(info.messageID, {
          commandName: "overflow",
          messageID: info.messageID,
          author: event.senderID,
          episodes: episodes
        });
      });

    } catch (err) {
      console.error("API ERROR:", err.response?.data || err.message);
      return api.sendMessage("❌ Failed to fetch episodes.", event.threadID);
    }
  },

  onReply: async function ({ api, event, args, message, Reply }) {
    try {
      if (!Reply) return;
      if (event.senderID !== Reply.author) return;

      const index = parseInt(event.body);
      const episodes = Reply.episodes;

      if (isNaN(index) || index < 1 || index > episodes.length)
        return api.sendMessage("❌ Invalid episode number.", event.threadID);

      const selected = episodes[index - 1];

      if (!selected.video)
        return api.sendMessage("❌ Video link not found.", event.threadID);

      try {
        await api.unsendMessage(Reply.messageID);
      } catch {}

      const stream = await global.utils.getStreamFromURL(selected.video);

      return api.sendMessage({
        body: `🎥 ${selected.title}`,
        attachment: stream
      }, event.threadID);

    } catch (err) {
      console.error("REPLY ERROR:", err.message);
      return api.sendMessage("❌ Something went wrong.", event.threadID);
    }
  }
};