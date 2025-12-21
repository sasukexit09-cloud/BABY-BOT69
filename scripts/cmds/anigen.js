const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ratios = {
  "1:1": { width: 1024, height: 1024 },
  "9:7": { width: 1152, height: 896 },
  "7:9": { width: 896, height: 1152 },
  "19:13": { width: 1216, height: 832 },
  "13:19": { width: 832, height: 1216 },
  "7:4": { width: 1344, height: 768 },
  "4:7": { width: 768, height: 1344 },
  "12:5": { width: 1536, height: 640 },
  "5:12": { width: 640, height: 1536 },
  "9:16": { width: 640, height: 1136 }
};

module.exports = {
  config: {
    name: "anigen",
    aliases: [],
    author: "Vex_Kshitiz",
    version: "1.1",
    cooldowns: 20,
    role: 0,
    shortDescription: "Generate an image based on a prompt (VIP only).",
    longDescription: "Generates an image based on a prompt and optional ratio.",
    category: "fun",
    guide: "{p}anigen <prompt> -<ratio>"
  },
  
  onStart: async function ({ message, args, usersData, event }) {
    const { senderID } = event;

    // ===== VIP CHECK =====
    const userData = await usersData.get(senderID);
    if (!userData || userData.vip !== true) {
      return message.reply(
        "🔒 | **VIP ONLY COMMAND**\n\n🥺 Baby, তুমি VIP না\n✨ আগে VIP নাও তারপর anigen use করো 💋"
      );
    }
    // =====================

    try {
      const joinedArgs = args.join(" ");

      // Split by the last dash to allow hyphens in prompt
      const lastDashIndex = joinedArgs.lastIndexOf("-");
      const prompt = lastDashIndex !== -1 ? joinedArgs.slice(0, lastDashIndex).trim() : joinedArgs;
      const ratioInput = lastDashIndex !== -1 ? joinedArgs.slice(lastDashIndex + 1).trim() : "1:1";
      const validRatio = ratios.hasOwnProperty(ratioInput) ? ratioInput : "1:1";

      // Build API URL
      let apiUrl = "https://imagegeneration-kshitiz-c3o0.onrender.com/anigen?prompt=" + encodeURIComponent(prompt);
      if (validRatio !== "1:1") apiUrl += "&ratio=" + encodeURIComponent(validRatio);

      // Fetch image
      const response = await axios.get(apiUrl, { responseType: "stream" });

      // Ensure cache folder exists
      const cacheFolderPath = path.join(__dirname, "/cache");
      if (!fs.existsSync(cacheFolderPath)) fs.mkdirSync(cacheFolderPath);

      // Unique filename for this request
      const timestamp = Date.now();
      const imagePath = path.join(cacheFolderPath, `anigen_${timestamp}.png`);

      // Save image to file
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      writer.on("finish", async () => {
        const stream = fs.createReadStream(imagePath);
        try {
          await message.reply({ body: "", attachment: stream });
        } catch (err) {
          console.error("Error sending image:", err);
          message.reply("❌ | Failed to send image.");
        } finally {
          // Cleanup image after sending
          fs.unlink(imagePath, (err) => {
            if (err) console.error("Failed to delete cached image:", err);
          });
        }
      });

      writer.on("error", (err) => {
        console.error("Error writing image:", err);
        message.reply("❌ | Failed to save image.");
      });

    } catch (error) {
      console.error("Error generating image:", error);
      message.reply("❌ | Failed to generate image.");
    }
  }
};
