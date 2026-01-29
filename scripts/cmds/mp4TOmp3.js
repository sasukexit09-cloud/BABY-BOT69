const axios = require("axios");

module.exports = {
  config: {
    name: "mp4tomp3",
    version: "1.0.0",
    author: "Maya",
    role: 0,
    description: "Convert MP4 URL to MP3 and return audio URL",
    category: "media",
    cooldowns: 5
  },

  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;

    if (!args[0]) {
      return api.sendMessage(
        "❌ MP4 link দাও\n\nExample:\nmp4tomp3 https://example.com/video.mp4",
        threadID
      );
    }

    const mp4Url = args[0];

    try {
      // typing start
      api.sendTypingIndicator(threadID, true);

      // public working API
      const apiUrl = `https://www.noobs-api.top/dipto/mp4tomp3?url=${encodeURIComponent(mp4Url)}`;
      const res = await axios.get(apiUrl);

      if (!res.data || !res.data.audio) {
        api.sendTypingIndicator(threadID, false);
        return api.sendMessage("❌ Convert করা যায়নি", threadID);
      }

      // typing stop
      api.sendTypingIndicator(threadID, false);

      return api.sendMessage(
        `✅ MP3 Ready 🎧\n\n🔗 Download Link:\n${res.data.audio}`,
        threadID
      );

    } catch (err) {
      api.sendTypingIndicator(threadID, false);
      console.error(err);
      return api.sendMessage("❌ Error: MP4 to MP3 convert failed", threadID);
    }
  }
};
