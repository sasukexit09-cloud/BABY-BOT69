const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Mock user database for balance and VIP status
let userData = {
  // Example structure: userID: { balance: 1000, isVIP: false }
};

const BASE_COST = 250; // Taka per use

let cachedBaseAPI;
const baseApiUrl = async () => {
  if (cachedBaseAPI) return cachedBaseAPI;
  const base = await axios.get("https://raw.githubusercontent.com/nazrul4x/Noobs/main/Apis.json");
  cachedBaseAPI = base.data.api;
  return cachedBaseAPI;
};

// Helper to deduct balance
const deductBalance = (userID) => {
  if (!userData[userID]) userData[userID] = { balance: 0, isVIP: false };

  if (userData[userID].isVIP) return true; // VIP users skip deduction

  if (userData[userID].balance >= BASE_COST) {
    userData[userID].balance -= BASE_COST;
    return true;
  } else {
    return false;
  }
};

module.exports = {
  config: {
    name: "video",
    aliases: ["music", "searchsong"],
    version: "2.1.0",
    author: "Nazrul + Edited by ChatGPT",
    countDowns: 20,
    role: 0,
    description: "Search or Download YouTube Videos (250 Taka per use)",
    category: "Media",
    guide: {
      en: "use {pn} song songName or YouTube link"
    }
  },

  onStart: async function ({ api, event, args }) {
    const userID = event.senderID;

    if (!deductBalance(userID)) {
      return api.sendMessage(
        "❌ You don’t have enough balance (250 Taka required) or you are not VIP. Please top-up or buy VIP!",
        event.threadID,
        event.messageID
      );
    }

    const songQuery = args.join(" ").trim();
    const isUrl = songQuery.startsWith('https://') || songQuery.startsWith('http://');

    if (isUrl) {
      await this.downloadVideo(api, event, songQuery);
    } else if (songQuery.length > 0) {
      await this.searchSong(api, event, songQuery);
    } else {
      api.sendMessage("🎵 Please provide a Song Name or YouTube URL!", event.threadID, event.messageID);
    }
  },

  downloadVideo: async function (api, event, videoUrl, videoTitle = "Unknown", videoDuration = "Unknown") {
    try {
      const res = await axios.get(`${await baseApiUrl()}/nazrul/ytMp4?url=${encodeURIComponent(videoUrl)}`);
      const videoData = res.data;

      if (!videoData.d_url) throw new Error('Download link not found!');

      const videoPath = path.resolve(__dirname, `video_${Date.now()}.mp4`);
      const writer = fs.createWriteStream(videoPath);
      const videoStream = (await axios.get(videoData.d_url, { responseType: 'stream' })).data;

      await new Promise((resolve, reject) => {
        videoStream.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      await api.sendMessage({
        body: `🎬 Here's your Video Song!\n\n♡ Title: ${videoData.title}\n♡ Duration: ${videoDuration}\n💸 250 Taka deducted!`,
        attachment: fs.createReadStream(videoPath)
      }, event.threadID, () => fs.unlinkSync(videoPath), event.messageID);

    } catch (error) {
      console.error('Error downloading video:', error.message);
      api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  },

  // searchSong and onReply remain mostly same, balance deduction handled in onStart
};
