module.exports = {
  config: {
    name: "hvd2",
    aliases: ["hvdo"],
    version: "1.1",
    author: "kshitiz",
    countDown: 60,
    role: 2,
    shortDescription: "get hentai video",
    longDescription: "it will send hentai video",
    category: "𝟭𝟴+",
    guide: "{p}{n}hvdo",
  },

  sentVideos: [],

  // Example VIP check function
  isVIP: async function(userID) {
    // এখানে তোমার database বা array থেকে VIP users চেক করো
    const vipUsers = ["1234567890", "9876543210"]; // উদাহরণ
    return vipUsers.includes(userID);
  },

  onStart: async function({ api, event, message }) {
    const senderID = event.senderID;

    // VIP চেক
    if (!await this.isVIP(senderID)) {
      return message.reply("❌ এই কমান্ডটি শুধুমাত্র VIP user এর জন্য।");
    }

    const loadingMessage = await message.reply({ body: "Loading random hentai... Please wait! upto 5min 🤡" });

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
      await message.reply({ body: 'make sure to watch full video🥵', attachment });
    } catch (err) {
      await message.reply("⚠️ Failed to send video. Try again!");
    }

    // Remove loading message after 30 seconds
    setTimeout(() => api.unsendMessage(loadingMessage.messageID), 30000);
  }
};
