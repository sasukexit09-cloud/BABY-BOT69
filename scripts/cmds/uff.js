 const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Mock database for demonstration (balance optional)
let usersDB = {
  // userId: { balance: number } // যদি চাইলে ব্যালেন্সও রাখতে পারো
};

// Function to check if the author matches
async function checkAuthor(authorName) {
  try {
    const response = await axios.get('https://author-check.vercel.app/name');
    const apiAuthor = response.data?.name || "";
    return apiAuthor === authorName;
  } catch (error) {
    console.error("Error checking author:", error.message);
    return false;
  }
}

module.exports = {
  config: {
    name: "uff",
    aliases: [],
    author: "AYAN BBE💋", 
    version: "1.3",
    cooldowns: 5,
    role: 2, // সবাই ব্যবহার করতে পারবে
    shortDescription: "18+ TikTok video",
    longDescription: "Fetches a random 18+ TikTok video",
    category: "18+",
    guide: "{p}onlytik"
  },

  onStart: async function ({ api, event, args, message }) {
    const userId = event.senderID;

    // Check author validity
    const isAuthorValid = await checkAuthor(module.exports.config.author);
    if (!isAuthorValid) {
      await message.reply("⚠️ Author changed! This command belongs to AYAN BBE💋.");
      return;
    }

    const apiUrl = "https://only-tik.vercel.app/kshitiz";

    try {
      const response = await axios.get(apiUrl);
      const { videoUrl, likes } = response.data;

      // Ensure cache folder exists
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const tempVideoPath = path.join(cacheDir, `${Date.now()}.mp4`);
      const writer = fs.createWriteStream(tempVideoPath);

      const videoResponse = await axios.get(videoUrl, { responseType: "stream" });
      videoResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      await message.reply({
        body: `🎬 Here’s your video! Likes: ${likes}`,
        attachment: fs.createReadStream(tempVideoPath)
      });

      fs.unlink(tempVideoPath, err => {
        if (err) console.error("Error deleting temp video:", err.message);
      });

    } catch (error) {
      console.error("Error fetching OnlyTik video:", error.message);
      await message.reply("❌ Sorry, an error occurred while processing your request.");
    }
  }
};
