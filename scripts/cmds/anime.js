const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
  const response = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return response.data.mahmud;
};

module.exports = {
  config: {
    name: "anime",
    aliases: ["anivid", "animevideo"],
    version: "1.8",
    role: 0,
    author: "MahMUD",
    category: "anime",
    guide: {
      en: "Use {pn} to get a random anime video or {pn} list to see total anime count."
    }
  },

  isVIP: async function(senderID, usersData) {
    const data = await usersData.get(senderID);
    return data?.isVIP === true;
  },

  onStart: async function ({ api, event, message, args, usersData }) {
    try {
      const senderID = event.senderID;
      const OWNER_UID = ["61584308632995"]; // নিজের UID বসাও
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

      if (args[0] === "list") {
        const apiUrl = await mahmud();
        const response = await axios.get(`${apiUrl}/api/album/list`);
        const lines = response.data.message.split("\n");
        const animeCategories = lines.filter(line =>
          /anime/i.test(line) && !/hanime/i.test(line) && !/Total\s*anime/i.test(line)
        );
        if (!animeCategories.length) {
          return api.sendMessage("❌ | No anime categories found.", event.threadID, event.messageID);
        }
        return api.sendMessage(animeCategories.join("\n"), event.threadID, event.messageID);
      }

      const loadingMessage = await message.reply("🐤 | 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 𝗿𝗮𝗻𝗱𝗼𝗺 𝗮𝗻𝗶𝗺𝗲 𝘃𝗶𝗱𝗲𝗼... 𝗣𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁..!!");

      setTimeout(() => {
        api.unsendMessage(loadingMessage.messageID);
      }, 5000);

      const apiUrl = await mahmud();
      const res = await axios.get(`${apiUrl}/api/album/videos/anime?userID=${event.senderID}`);
      if (!res.data.success || !res.data.videos.length)
        return api.sendMessage("❌ | No videos found.", event.threadID, event.messageID);

      const url = res.data.videos[Math.floor(Math.random() * res.data.videos.length)];
      const filePath = path.join(__dirname, "temp_video.mp4");

      const video = await axios({
        url,
        method: "GET",
        responseType: "stream",
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const writer = fs.createWriteStream(filePath);
      video.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: "✨ | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐚𝐧𝐢𝐦𝐞 𝐯𝐢𝐝𝐞𝐨",
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
      });

      writer.on("error", () => {
        api.sendMessage("❌ | Download error.", event.threadID, event.messageID);
      });
    } catch (e) {
      console.error("ERROR:", e);
      api.sendMessage("❌ | Failed to fetch or send video.", event.threadID, event.messageID);
    }
  }
};
