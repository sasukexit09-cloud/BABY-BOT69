module.exports = {
  config: {
    name: "hvd",
    aliases: ["hvdo"],
    version: "1.3",
    author: "kshitiz",
    countDown: 60,
    role: 2, // কেউই restriction নেই
    shortDescription: "Get a random hentai video",
    longDescription: "Sends a random 18+ hentai video. No VIP required.",
    category: "18+",
    guide: "{p}{n}hvdo",
  },

  sentVideos: [],

  onStart: async function ({ api, event, message }) {
    const senderID = event.senderID;

    const loadingMessage = await message.reply({
      body: "⏳ Loading random hentai video... Please wait!"
    });

    try {
      const link = [
        // এখানে তোমার Google Drive ভিডিও লিঙ্কগুলো রাখো
      ];

      // Filter out already sent videos
      let availableVideos = link.filter(video => !this.sentVideos.includes(video));

      // Reset if all videos have been sent
      if (availableVideos.length === 0) {
        this.sentVideos = [];
        availableVideos = [...link];
      }

      // Pick a random video
      const randomIndex = Math.floor(Math.random() * availableVideos.length);
      const randomVideo = availableVideos[randomIndex];

      // Track sent video
      this.sentVideos.push(randomVideo);

      // Send video
      await message.reply({
        body: '🎬 Make sure to watch the full video! 🥵',
        attachment: await global.utils.getStreamFromURL(randomVideo)
      });

      // Delete loading message
      setTimeout(() => {
        api.unsendMessage(loadingMessage.messageID).catch(() => {});
      }, 3000);

    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to send video.");
      api.unsendMessage(loadingMessage.messageID).catch(() => {});
    }
  }
};
