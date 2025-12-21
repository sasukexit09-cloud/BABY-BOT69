const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function downloadVideo(url, destination) {
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destination);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

module.exports = {
  config: {
    name: "reels",
    version: "1.2",
    author: "kshitiz",
    aliases: [],
    category: "FUN",
    shortDescription: { en: "View Instagram reels by hashtag (VIP only)" },
    longDescription: { en: "View Instagram reels by providing a hashtag and reply with the reel list by number" },
    guide: { en: "{p}reels [hashtag]" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;

    // ===== VIP CHECK =====
    const userData = await usersData.get(senderID);
    if (!userData || userData.vip !== true) {
      return api.sendMessage(
        "🔒 | **VIP ONLY COMMAND**\n\n🥺 Baby, তুমি VIP না\n✨ আগে VIP নাও তারপর reels use করো 💋",
        threadID,
        messageID
      );
    }
    // =====================

    const hashtag = args[0];
    if (!hashtag) return api.sendMessage(
      'Please provide a hashtag.\nExample: {p}reels zoro',
      threadID,
      messageID
    );

    try {
      const { data } = await axios.get(`https://reels-insta.vercel.app/reels?hashtag=${hashtag}`);
      const videoURLs = data.videoURLs;
      if (!videoURLs || videoURLs.length === 0) {
        return api.sendMessage(`No reels found for hashtag ${hashtag}.`, threadID, messageID);
      }

      const message = `Choose a reel by replying with its number:\n\n${videoURLs.map((url, i) => `${i+1}. ${url.slice(0,50)}...`).join('\n')}`;

      api.sendMessage(message, threadID, (err, info) => {
        if (!global.GoatBot?.onReply || typeof global.GoatBot.onReply.set !== 'function') return;

        global.GoatBot.onReply.set(info.messageID, {
          commandName: 'reels',
          messageID: info.messageID,
          author: senderID,
          videoURLs
        });
      });
    } catch (err) {
      console.error(err.response?.data || err.message);
      api.sendMessage('An error occurred while fetching reels. Please try again later.', threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply, args, usersData }) {
    if (!Reply) return;

    const { senderID, threadID, messageID } = event;

    // ===== VIP CHECK =====
    const userData = await usersData.get(senderID);
    if (!userData || userData.vip !== true) {
      return api.sendMessage(
        "🔒 | VIP only\n✨ Download করার জন্য VIP লাগবে 💋",
        threadID,
        messageID
      );
    }
    // =====================

    const { author, messageID: origMsgID, videoURLs } = Reply;
    if (senderID !== author || !videoURLs) return;

    const reelIndex = parseInt(args[0], 10);
    if (isNaN(reelIndex) || reelIndex <= 0 || reelIndex > videoURLs.length) {
      return api.sendMessage('Invalid input. Please provide a valid number.', threadID, messageID);
    }

    try {
      const selectedVideoURL = videoURLs[reelIndex - 1];
      const tempVideoPath = path.join(os.tmpdir(), `reels_video_${Date.now()}.mp4`);

      await downloadVideo(selectedVideoURL, tempVideoPath);

      await api.sendMessage({
        body: 'Here is the Instagram reel:',
        attachment: fs.createReadStream(tempVideoPath)
      }, threadID, messageID);

      fs.unlinkSync(tempVideoPath);
    } catch (err) {
      console.error(err.response?.data || err.message);
      api.sendMessage('An error occurred while processing the reel. Please try again later.', threadID, messageID);
    } finally {
      if (global.GoatBot?.onReply?.delete) global.GoatBot.onReply.delete(origMsgID);
    }
  }
};
