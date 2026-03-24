const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

const API_ENDPOINT = "https://free-goat-api.onrender.com/4k"; 
const CACHE_DIR = path.join(__dirname, 'cache');

// Helper to find the image URL from various sources
function getImageUrl(args, event) {
    // 1. Check for URL in arguments
    const urlArg = args.find(arg => arg.startsWith('http'));
    if (urlArg) return urlArg;

    // 2. Check for attachments in the current message
    if (event.attachments && event.attachments.length > 0) {
        const img = event.attachments.find(att => att.type === 'photo' || att.type === 'image');
        if (img) return img.url;
    }

    // 3. Check for attachments in a replied message
    if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        const img = event.messageReply.attachments.find(att => att.type === 'photo' || att.type === 'image');
        if (img) return img.url;
    }

    return null;
}

module.exports = {
  config: {
    name: "4k",
    aliases: ["upscale", "hd", "enhance"],
    version: "1.1",
    author: "NeoKEX",
    countDown: 15,
    role: 0, // Changed to 0 so everyone can use it, set to 2 for Admin only
    longDescription: "Upscales an image to higher resolution (4K) using AI.",
    category: "image",
    guide: {
      en: "{pn} <image_url> | reply to an image | or send an image with the command."
    }
  },

  onStart: async function ({ args, message, event }) {
    const imageUrl = getImageUrl(args, event);

    if (!imageUrl) {
      return message.reply("❌ Please provide an image URL, reply to an image, or attach an image to upscale.");
    }

    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    message.reaction("⏳", event.messageID);
    const tempFilePath = path.join(CACHE_DIR, `upscale_${Date.now()}.jpg`);

    try {
      // 1. Request upscaled image from API
      const { data } = await axios.get(`${API_ENDPOINT}?url=${encodeURIComponent(imageUrl)}`, { 
        timeout: 60000 
      });

      if (!data || !data.image) {
        throw new Error("The API failed to process the image. It might be too large or the format is unsupported.");
      }

      // 2. Download the processed image
      const response = await axios({
          method: 'get',
          url: data.image,
          responseType: 'stream',
          timeout: 60000
      });

      // 3. Save to cache using modern pipeline
      await pipeline(response.data, fs.createWriteStream(tempFilePath));

      // 4. Send back and react success
      message.reaction("✅", event.messageID);
      await message.reply({
        body: `🖼️ Image successfully upscaled to 4K!`,
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      console.error("4K Upscale Error:", error.message);

      let msg = "❌ An error occurred while upscaling.";
      if (error.code === 'ECONNABORTED') msg = "❌ Request timed out. The API is taking too long.";
      if (error.response?.status === 429) msg = "❌ Rate limit hit. Please try again later.";
      
      message.reply(`${msg}\nDetails: ${error.message}`);
    } finally {
      // 5. Clean up file safely
      setTimeout(() => {
          if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
          }
      }, 5000); // Small delay to ensure the file is finished being sent
    }
  }
};