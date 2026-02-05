const axios = require('axios');

module.exports = {
  config: {
    name: "alldl",
    aliases: ["dl", "video", "fb", "insta", "yt", "tiktok"],
    version: "0.0.1",
    author: "ArYAN",
    countDown: 5,
    role: 0,
    category: "media",
    guide: {
      en: "{pn} [URL]"
    }
  },

  onStart: async function ({ message, args, event }) {
    const url = args.find(arg => /^https?:\/\//.test(arg));
    if (!url) return message.reply("Please provide a valid URL.");

    message.reaction("⏳", event.messageID);

    try {
      const res = await axios.get(`http://103.187.23.122:2099/dl?url=${encodeURIComponent(url)}`);
      const data = res.data;

      if (!data.url) {
        message.reaction("❌", event.messageID);
        return message.reply("Could not find a downloadable link for this URL.");
      }

      await message.reply({
        body: `•Title: ${data.title}\n•Duration: ${data.duration}\n•Description: ${data.description || 'No description'}`,
        attachment: await global.utils.getStreamFromUrl(data.url)
      });

      message.reaction("✅", event.messageID);
    } catch (error) {
      message.reaction("❌", event.messageID);
      return message.reply("An error occurred while processing your request.");
    }
  },

  onChat: async function ({ event, message }) {
    if (!event.body || event.senderID === global.botID) return;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = event.body.match(urlRegex);

    if (match) {
      const url = match[0];
      
      try {
        const res = await axios.get(`http://103.187.23.122:2099/dl?url=${encodeURIComponent(url)}`);
        const data = res.data;

        if (data.url) {
          message.reaction("⏳", event.messageID);
          await message.reply({
            body: `•Title: ${data.title}\n•Duration: ${data.duration}`,
            attachment: await global.utils.getStreamFromUrl(data.url)
          });
          message.reaction("✅", event.messageID);
        }
      } catch (e) {
        // Silent error for auto-dl
      }
    }
  }
};