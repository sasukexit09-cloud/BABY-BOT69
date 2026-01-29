const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function downloadVideo(url, destination) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

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
    version: "1.3",
    author: "kshitiz (edited by Maya)",
    aliases: [],
    category: "FUN",
    shortDescription: { en: "View Instagram reels by hashtag" },
    longDescription: { en: "View Instagram reels by hashtag and reply with number to download" },
    guide: { en: "{p}reels [hashtag]" }
  },

  onStart: async function ({ api, event, args }) {
    const { senderID, threadID, messageID } = event;

    const hashtag = args[0];
    if (!hashtag) {
      return api.sendMessage(
        "⚠️ Hashtag দাও\nExample: reels zoro",
        threadID,
        messageID
      );
    }

    try {
      const { data } = await axios.get(
        `https://reels-insta.vercel.app/reels?hashtag=${encodeURIComponent(hashtag)}`
      );

      const videoURLs = data?.videoURLs;
      if (!Array.isArray(videoURLs) || videoURLs.length === 0) {
        return api.sendMessage(
          `😕 #${hashtag} এর জন্য কোনো reels পাওয়া যায়নি`,
          threadID,
          messageID
        );
      }

      const list = videoURLs
        .map((url, i) => `${i + 1}. Reel ${i + 1}`)
        .join('\n');

      api.sendMessage(
        `🎬 Instagram Reels (#${hashtag})\n\n${list}\n\n👉 নাম্বার লিখে reply করো`,
        threadID,
        (err, info) => {
          if (!global.GoatBot?.onReply) return;
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "reels",
            author: senderID,
            videoURLs
          });
        }
      );
    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ Reels fetch করতে সমস্যা হচ্ছে, পরে try করো",
        threadID,
        messageID
      );
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    if (!Reply) return;

    const { senderID, threadID, messageID } = event;
    const { author, videoURLs } = Reply;

    if (senderID !== author) return;

    const index = parseInt(args[0]);
    if (isNaN(index) || index < 1 || index > videoURLs.length) {
      return api.sendMessage(
        "⚠️ সঠিক নাম্বার দাও",
        threadID,
        messageID
      );
    }

    try {
      const videoURL = videoURLs[index - 1];
      const filePath = path.join(
        os.tmpdir(),
        `reel_${Date.now()}.mp4`
      );

      await downloadVideo(videoURL, filePath);

      await api.sendMessage(
        {
          body: "🎥 Instagram Reel",
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        messageID
      );

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ Reel download করতে সমস্যা হয়েছে",
        threadID,
        messageID
      );
    } finally {
      global.GoatBot?.onReply?.delete(event.messageReply?.messageID);
    }
  }
};
