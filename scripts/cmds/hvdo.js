module.exports = {
  config: {
    name: "hvd2",
    aliases: ["hvdo"],
    version: "1.2",
    author: "kshitiz",
    countDown: 60,
    role: 2, // কোনো VIP restriction নেই
    shortDescription: "Get hentai video",
    longDescription: "It will send hentai video (no VIP required)",
    category: "𝟭𝟴+",
    guide: "{p}{n}hvdo",
  },

  sentVideos: [],

  onStart: async function({ api, event, message }) {
    const senderID = event.senderID;

    const loadingMessage = await message.reply({ body: "⏳ Loading random hentai video... Please wait!" });

    const link = [ /* সব Google Drive লিঙ্ক */ ];

    // Filter out already sent videos
    let availableVideos = link.filter(video => !this.sentVideos.includes(video));
    if (availableVideos.length === 0) {
      this.sentVideos = [];
      availableVideos = [...link];
    }

    const randomIndex = Math.floor(Math.random() * availableVideos.length);
    const randomVideo = availableVideos[randomIndex];
    this.sentVideos.push(randomVideo);

    try {
      const attachment = await global.utils.getStreamFromURL(randomVideo);
      await message.reply({ body: '🎬 Make sure to watch full video 🥵', attachment });
    } catch (err) {
      console.error(err);
      await message.reply("⚠️ Failed to send video. Try again!");
    }

    // Remove loading message after 30 seconds
    setTimeout(() => api.unsendMessage(loadingMessage.messageID).catch(() => {}), 30000);
  }
};
