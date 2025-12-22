const axios = require('axios');

async function getStreamFromURL(url) {
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    return response.data;
  } catch (err) {
    console.error("Error fetching video stream:", err.message);
    throw new Error("Video stream fetch failed.");
  }
}

async function fetchTikTokVideos(query) {
  try {
    const response = await axios.get(`https://lyric-search-neon.vercel.app/kshitiz?keyword=${encodeURIComponent(query)}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching TikTok videos:", error.message);
    return [];
  }
}

module.exports = {
  config: {
    name: "xanisar",
    aliases: ["anisr", "as"],
    author: "Vex_kshitiz",
    version: "2.0",
    shortDescription: { en: "Get anime edit" },
    longDescription: { en: "Search and send anime edit videos" },
    category: "anime",
    guide: { en: "{p}{n} [query]" },
    usePrefix: false,
  },

  isVIP: async function(senderID, usersData) {
    const data = await usersData.get(senderID);
    const OWNER_UID = ["61584308632995"]; // নিজের UID
    return OWNER_UID.includes(senderID) || data?.isVIP === true;
  },

  onStart: async function ({ api, event, args, usersData }) {
    const senderID = event.senderID;
    const vip = await this.isVIP(senderID, usersData);

    // Non-VIP users এর জন্য balance check
    if (!vip) {
      const userData = await usersData.get(senderID);
      const balance = userData?.money || 0;

      if (balance < 300) {
        return api.sendMessage(
          `❌ এই কমান্ড ব্যবহার করতে 300 balance লাগবে।\n💰 তোমার balance: ${balance}`,
          event.threadID,
          event.messageID
        );
      }

      await usersData.set(senderID, { money: balance - 300 });
    }

    const query = args.join(' ').trim();
    if (!query) return api.sendMessage("⚠️ কোন search query দেয়া হয় নাই!", event.threadID, event.messageID);

    const modifiedQuery = `${query} anime edit`;

    // Messenger latest reaction support
    try {
      if (api.setMessageReaction) api.setMessageReaction("⏳", event.messageID, () => {}, true);
    } catch (err) {
      console.warn("Reaction not supported in this thread/version.");
    }

    const videos = await fetchTikTokVideos(modifiedQuery);

    if (!videos.length) {
      return api.sendMessage(`❌ '${query}' এর কোন ভিডিও পাওয়া যায়নি।`, event.threadID, event.messageID);
    }

    const selectedVideo = videos[Math.floor(Math.random() * videos.length)];
    const videoUrl = selectedVideo.videoUrl;

    if (!videoUrl) {
      return api.sendMessage('❌ ভিডিও পাওয়া যায়নি।', event.threadID, event.messageID);
    }

    try {
      const videoStream = await getStreamFromURL(videoUrl);
      await api.sendMessage({ body: "", attachment: videoStream }, event.threadID, event.messageID);
    } catch (err) {
      console.error("Video sending error:", err.message);
      api.sendMessage('❌ ভিডিও প্রক্রিয়াকরণে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।', event.threadID, event.messageID);
    }
  }
};
