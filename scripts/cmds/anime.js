const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Fetch base API URL
const getBaseApiUrl = async () => {
  try {
    const response = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
    return response.data.mahmud;
  } catch (err) {
    console.error("Failed to fetch base API URL:", err.message);
    throw new Error("Base API URL fetch failed");
  }
};

module.exports = {
  config: {
    name: "anime",
    aliases: ["anivid", "animevideo"],
    version: "2.0",
    role: 0,
    author: "MahMUD",
    category: "anime",
    guide: {
      en: "Use {pn} to get a random anime video or {pn} list to see total anime categories."
    }
  },

  isVIP: async function(senderID, usersData) {
    const data = await usersData.get(senderID);
    return data?.isVIP === true;
  },

  onStart: async function ({ api, event, message, args, usersData }) {
    try {
      const senderID = event.senderID;
      const OWNER_UID = ["61584308632995"]; // নিজের UID
      const vip = OWNER_UID.includes(senderID) || await this.isVIP(senderID, usersData);

      // Non-VIP balance check
      if (!vip) {
        const userData = await usersData.get(senderID);
        const balance = userData?.money || 0;

        if (balance < 1000) {
          return message.reply(`❌ | এই কমান্ড ব্যবহার করতে 1,000 balance লাগবে।\n💰 তোমার balance: ${balance}`);
        }

        await usersData.set(senderID, { money: balance - 1000 });
      }

      const apiUrl = await getBaseApiUrl();

      // List mode
      if (args[0]?.toLowerCase() === "list") {
        const res = await axios.get(`${apiUrl}/api/album/list`);
        const lines = res.data.message.split("\n");
        const animeCategories = lines.filter(line =>
          /anime/i.test(line) && !/hanime/i.test(line) && !/Total\s*anime/i.test(line)
        );
        if (!animeCategories.length) return api.sendMessage("❌ | No anime categories found.", event.threadID, event.messageID);
        return api.sendMessage(animeCategories.join("\n"), event.threadID, event.messageID);
      }

      // Loading message
      const loadingMsg = await message.reply("🐤 | 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 random anime video... Please wait!");

      setTimeout(() => {
        try { api.unsendMessage(loadingMsg.messageID); } catch {}
      }, 5000);

      // Fetch random video
      const res = await axios.get(`${apiUrl}/api/album/videos/anime?userID=${senderID}`);
      if (!res.data.success || !res.data.videos.length)
        return api.sendMessage("❌ | No videos found.", event.threadID, event.messageID);

      const videoUrl = res.data.videos[Math.floor(Math.random() * res.data.videos.length)];
      const filePath = path.join(__dirname, "temp_video.mp4");

      const videoStream = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream",
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const writer = fs.createWriteStream(filePath);
      videoStream.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: "✨ | Here's your anime video",
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => {
          try { fs.unlinkSync(filePath); } catch {}
        }, event.messageID);
      });

      writer.on("error", () => {
        api.sendMessage("❌ | Download error.", event.threadID, event.messageID);
      });

    } catch (err) {
      console.error("ERROR:", err);
      api.sendMessage("❌ | Failed to fetch or send video.", event.threadID, event.messageID);
    }
  }
};
