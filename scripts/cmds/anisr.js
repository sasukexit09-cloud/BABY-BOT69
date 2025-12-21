const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function getStreamFromURL(url) {
  const response = await axios.get(url, { responseType: 'stream' });
  return response.data;
}

async function fetchTikTokVideos(query) {
  try {
    const response = await axios.get(`https://lyric-search-neon.vercel.app/kshitiz?keyword=${query}`);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = {
  config: {
    name: "xanisar",
    aliases: ["anisr","anisr","as"],
    author: "Vex_kshitiz",
    version: "1.1",
    shortDescription: { en: "Get anime edit" },
    longDescription: { en: "Search for anime edits video" },
    category: "anime",
    guide: { en: "{p}{n} [query]" },
    usePrefix: false,
  },

  isVIP: async function(senderID, usersData) {
    const data = await usersData.get(senderID);
    const OWNER_UID = ["61584308632995"]; // নিজের UID বসাও
    return OWNER_UID.includes(senderID) || data?.isVIP === true;
  },

  onStart: async function ({ api, event, args, usersData }) {
    const senderID = event.senderID;
    const vip = await this.isVIP(senderID, usersData);

    if (!vip) {
      const userData = await usersData.get(senderID);
      const balance = userData?.money || 0;

      if (balance < 300) {
        return api.sendMessage(`❌ এই কমান্ড ব্যবহার করতে 300 balance লাগবে।\n💰 তোমার balance: ${balance}`, event.threadID, event.messageID);
      }

      await usersData.set(senderID, { money: balance - 300 });
    }

    const query = args.join(' ');
    if (!query) return api.sendMessage("⚠️ কোন search query দেয়া হয় নাই!", event.threadID, event.messageID);

    const modifiedQuery = `${query} anime edit`;
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const videos = await fetchTikTokVideos(modifiedQuery);
    if (!videos || videos.length === 0) {
      return api.sendMessage({ body: `${query} not found.` }, event.threadID, event.messageID);
    }

    const selectedVideo = videos[Math.floor(Math.random() * videos.length)];
    const videoUrl = selectedVideo.videoUrl;
    if (!videoUrl) {
      return api.sendMessage({ body: 'Error: Video not found.' }, event.threadID, event.messageID);
    }

    try {
      const videoStream = await getStreamFromURL(videoUrl);
      await api.sendMessage({ body: "", attachment: videoStream }, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: '❌ An error occurred while processing the video. Please try again later.' }, event.threadID, event.messageID);
    }
  }
};
