const axios = require("axios");
const fs = require("fs");
const path = require("path");

const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/ARYAN-AROHI-STORE/A4YA9-A40H1/refs/heads/main/APIRUL.json"
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "tiktokid",
    aliases: ["tikuser"],
    version: "7.0.0",
    author: "dipto",
    countDown: 15,
    role: 0,
    shortDescription: "Select TikTok videos by username (VIP only)",
    longDescription: "Fetch TikTok videos from a user and select one to download",
    category: "downloader",
    guide: {
      en: "{pn} username [limit]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;

    // ===== VIP CHECK =====
    const userData = await usersData.get(senderID);
    if (!userData || userData.vip !== true) {
      return api.sendMessage(
        "🔒 | **VIP ONLY COMMAND**\n\n🥺 Baby, তুমি VIP না\n✨ আগে VIP নাও তারপর tiktokid use করো 💋",
        threadID,
        messageID
      );
    }
    // =====================

    const user = args[0];
    const limit = parseInt(args[1]) || 1;

    if (!user) {
      return api.sendMessage(
        "❌ Please provide a TikTok username.",
        threadID,
        messageID
      );
    }

    try {
      const res = await axios.get(
        `${await baseApiUrl()}/tiktokid?url=${user}&num=${limit}`
      );

      const videos = res.data?.data?.videos || [];
      if (!videos.length) {
        return api.sendMessage(
          "😿 No videos found for this user.",
          threadID,
          messageID
        );
      }

      const max = Math.min(limit, videos.length);
      const options = [];
      const filenames = [];

      for (let i = 0; i < max; i++) {
        options.push(`${i + 1}. ${videos[i].title || "No title"}`);

        const imgPath = path.join(cacheDir, `thumb_${i}.jpg`);
        const img = await axios.get(videos[i].origin_cover, {
          responseType: "arraybuffer"
        });
        fs.writeFileSync(imgPath, img.data);
        filenames.push(imgPath);
      }

      const msg =
        `❤️ Choose a video Baby 💝\n` +
        `━━━━━━━━━━━━━━━\n` +
        options.join("\n") +
        `\n━━━━━━━━━━━━━━━`;

      await api.sendMessage(
        {
          body: msg,
          attachment: filenames.map(f => fs.createReadStream(f))
        },
        threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "tiktokid",
            author: senderID,
            videoUrls: videos.map(v => v.play),
            files: filenames
          });
        },
        messageID
      );

    } catch (e) {
      api.sendMessage(
        "⚠️ Failed to fetch TikTok videos. Try again later.",
        threadID,
        messageID
      );
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { senderID, threadID, messageID } = event;

    // ===== VIP CHECK (Reply) =====
    const userData = await usersData.get(senderID);
    if (!userData || userData.vip !== true) {
      return api.sendMessage(
        "🔒 | VIP only\n✨ Download করার জন্য VIP লাগবে 💋",
        threadID,
        messageID
      );
    }
    // ============================

    if (event.senderID !== Reply.author) return;

    const index = parseInt(event.body);
    if (isNaN(index) || index < 1 || index > Reply.videoUrls.length) {
      return api.sendMessage(
        `❌ Reply with a number between 1 and ${Reply.videoUrls.length}`,
        threadID,
        messageID
      );
    }

    try {
      const videoPath = path.join(cacheDir, "tiktok.mp4");
      const video = await axios.get(Reply.videoUrls[index - 1], {
        responseType: "arraybuffer"
      });

      fs.writeFileSync(videoPath, video.data);

      await api.sendMessage(
        {
          body: "🐥 Here is your TikTok video",
          attachment: fs.createReadStream(videoPath)
        },
        threadID,
        () => {
          fs.unlinkSync(videoPath);
          Reply.files.forEach(f => fs.unlinkSync(f));
        },
        messageID
      );

    } catch (e) {
      api.sendMessage(
        "❌ Failed to download video.",
        threadID,
        messageID
      );
    }
  }
};
