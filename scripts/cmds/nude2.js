module.exports = {
  config: {
    name: "nude2",
    author: "Romim",
    category: "Nude-pic",
    shortDescription: "Send a random nude image (VIP only)",
    role: 2
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const axios = require('axios');
      const { threadID, messageID } = event;

      // VIP check
      const senderData = await usersData.get(event.senderID);
      if (!senderData.vip) {
        return api.sendMessage(
          "❌ This command is only available for VIP users.",
          threadID,
          messageID
        );
      }

      // Fetch nude image
      const romim = await axios.get("https://www.x-noobs-api.000.pe/nude?uid=100085332887575");
      const { type, url } = romim.data;

      if (!url) {
        return api.sendMessage("❌ Failed to fetch image.", threadID, messageID);
      }

      const response = await axios.get(url, { responseType: 'stream' });

      // Send image with type info
      api.sendMessage({
        body: `💦 Nude type: ${type}`,
        attachment: response.data
      }, threadID, messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ An error occurred. Try again later.", event.threadID, event.messageID);
    }
  }
};
