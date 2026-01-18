const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API_KEYS = [
  "b38444b5b7mshc6ce6bcd5c9e446p154fa1jsn7bbcfb025b3b",
  "719775e815msh65471c929a0203bp10fe44jsndcb70c04bc42",
  "a2743acb5amsh6ac9c5c61aada87p156ebcjsnd25f1ef87037",
  "8e938a48bdmshcf5ccdacbd62b60p1bffa7jsn23b2515c852d"
];

const getRandomApiKey = () =>
  API_KEYS[Math.floor(Math.random() * API_KEYS.length)];

async function getFastDownloadLink(videoId) {
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      const res = await axios.get(
        `https://yt-kshitiz.vercel.app/download?id=${videoId}&apikey=${API_KEYS[i]}`,
        { timeout: 6000 }
      );
      if (res.data?.length) return res.data[0];
    } catch (_) {}
  }
  throw new Error("All download servers failed");
}

async function video(api, event, args, message) {
  const { messageID } = event;
  api.setMessageReaction("⚡", messageID, () => {}, true);

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  try {
    let title;

    /* ==== INPUT ==== */
    if (event.messageReply?.attachments?.length) {
      const att = event.messageReply.attachments[0];
      const reco = await axios.get(
        `https://audio-recon-ahcw.onrender.com/kshitiz?url=${encodeURIComponent(att.url)}`,
        { timeout: 8000 }
      );
      title = reco.data?.title;
      if (!title) throw new Error("Audio recognition failed");
    } else if (args.length) {
      title = args.join(" ");
    } else {
      return message.reply("❌ | ভিডিও নাম দাও বা audio reply করো");
    }

    /* ==== SEARCH ==== */
    const yt = await axios.get(
      `https://youtube-kshitiz-gamma.vercel.app/yt?search=${encodeURIComponent(title)}`,
      { timeout: 6000 }
    );

    if (!yt.data?.length) throw new Error("No result found");

    const videoData = yt.data[0];
    const videoId = videoData.videoId;

    /* ==== 1 MIN LIMIT CHECK ==== */
    const durationSec = videoData.duration || 0; // seconds
    if (durationSec > 60) {
      return message.reply("❌ | Video exceeds 1 minute. Please choose a shorter video.");
    }

    /* ==== FAST DOWNLOAD LINK ==== */
    const videoUrl = await getFastDownloadLink(videoId);
    const filePath = path.join(cacheDir, `${videoId}.mp4`);

    /* ==== FAST STREAM ==== */
    const response = await axios({
      url: videoUrl,
      method: "GET",
      responseType: "stream",
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Encoding": "gzip, deflate"
      }
    });

    const writer = fs.createWriteStream(filePath, { highWaterMark: 1 << 25 });
    response.data.pipe(writer);

    writer.on("finish", async () => {
      await message.reply({
        body: `⚡ Fast Download Complete\n🎬 ${title}`,
        attachment: fs.createReadStream(filePath)
      });
      api.setMessageReaction("✅", messageID, () => {}, true);
      fs.unlink(filePath, () => {});
    });

    writer.on("error", () => {
      fs.unlink(filePath, () => {});
      message.reply("❌ | Download failed");
    });

  } catch (err) {
    console.error(err);
    message.reply(`❌ | ${err.message}`);
  }
}

module.exports = {
  config: {
    name: "video",
    version: "2.1",
    author: "AYAN BBE💋 (Fast + 1min limit by Maya)",
    countDown: 5,
    role: 0,
    shortDescription: "Ultra fast YouTube video (≤1 min)",
    category: "music",
    guide: "{p}video <name> | reply audio"
  },
  onStart({ api, event, args, message }) {
    return video(api, event, args, message);
  }
};
