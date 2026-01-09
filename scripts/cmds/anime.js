const axios = require("axios");
const fs = require("fs");
const path = require("path");

/* ===== Fetch base API URL ===== */
const getBaseApiUrl = async () => {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
    );
    return response.data.mahmud;
  } catch (err) {
    console.error("Base API fetch failed:", err.message);
    throw new Error("API URL fetch failed");
  }
};

module.exports = {
  config: {
    name: "anime",
    aliases: ["anivid", "animevideo"],
    version: "2.1",
    role: 0,
    author: "MahMUD • Edited by Maya",
    category: "anime",
    guide: {
      en: "{pn} → random anime video\n{pn} list → anime category list"
    }
  },

  onStart: async function ({ api, event, message, args }) {
    try {
      const senderID = event.senderID;
      const apiUrl = await getBaseApiUrl();

      /* ===== LIST MODE ===== */
      if (args[0]?.toLowerCase() === "list") {
        const res = await axios.get(`${apiUrl}/api/album/list`);
        const lines = res.data.message.split("\n");

        const animeCategories = lines.filter(
          line =>
            /anime/i.test(line) &&
            !/hanime/i.test(line) &&
            !/Total\s*anime/i.test(line)
        );

        if (!animeCategories.length) {
          return message.reply("❌ | No anime categories found.");
        }

        return message.reply(animeCategories.join("\n"));
      }

      /* ===== LOADING ===== */
      const loadingMsg = await message.reply(
        "🐤 | 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 random anime video...\n⏳ Please wait!"
      );

      /* ===== FETCH VIDEO ===== */
      const res = await axios.get(
        `${apiUrl}/api/album/videos/anime?userID=${senderID}`
      );

      if (!res.data.success || !res.data.videos?.length) {
        return message.reply("❌ | No anime videos found.");
      }

      const videoUrl =
        res.data.videos[Math.floor(Math.random() * res.data.videos.length)];

      const filePath = path.join(__dirname, "anime_video.mp4");

      const videoStream = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const writer = fs.createWriteStream(filePath);
      videoStream.data.pipe(writer);

      writer.on("finish", async () => {
        try {
          if (loadingMsg?.messageID) {
            api.unsendMessage(loadingMsg.messageID);
          }
        } catch {}

        api.sendMessage(
          {
            body: "✨ | Here's your anime video",
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => {
            try {
              fs.unlinkSync(filePath);
            } catch {}
          },
          event.messageID
        );
      });

      writer.on("error", () => {
        message.reply("❌ | Video download failed.");
      });

    } catch (err) {
      console.error("ANIME CMD ERROR:", err);
      message.reply("❌ | Failed to fetch or send anime video.");
    }
  }
};
