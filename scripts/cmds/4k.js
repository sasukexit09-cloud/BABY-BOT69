module.exports = {
  config: {
    name: "enhance",
    aliases: ["4k", "enhance4k"],
    version: "6.0",
    author: "AyanHost",
    role: 0,
    shortDescription: "Enhance uploaded image to 4K-like + stylish presets + countdown delete (Node.js 16 compatible)",
    category: "image",
    guide: ".enhance [preset]\nPresets: cinematic, anime, nature, soft-glow\nReply to an image or upload one."
  },

  onStart: async function({ api, event, args }) {
    const fs = require("fs-extra");
    const path = require("path");
    const Jimp = require("jimp");
    const axios = require("axios");

    const { threadID, messageReply } = event;
    const __root = path.resolve(__dirname, "cache", "enhance");
    if (!fs.existsSync(__root)) fs.mkdirSync(__root, { recursive: true });

    // Step 1: Detect preset
    const presets = ["cinematic", "anime", "nature", "soft-glow"];
    let preset = "default";
    if (args.length > 0 && presets.includes(args[0].toLowerCase())) {
      preset = args[0].toLowerCase();
    }

    // Step 2: Detect uploaded/reply image
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("⚠️ Please reply to an image or upload one!", threadID);
    }

    const imageURL = messageReply.attachments[0].url;

    // Step 3: Send fancy message
    const sentMsg = await api.sendMessage(`✨ Enhancing your image with preset: ${preset} ... ✨`, threadID);

    // Step 4: Download image
    const fileExt = ".jpg";
    const inputPath = path.join(__root, `input_${Date.now()}${fileExt}`);
    const outputPath = path.join(__root, `enhanced_${Date.now()}.jpg`);

    try {
      const response = await axios.get(imageURL, { responseType: "arraybuffer" });
      fs.writeFileSync(inputPath, Buffer.from(response.data));

      // Step 5: Load image with Jimp
      let image = await Jimp.read(inputPath);

      // Step 6: Resize to 4K-like (approximation)
      image = image.resize(3840, Jimp.AUTO);

      // Step 7: Apply preset filters
      switch (preset) {
        case "cinematic":
          image = image.color([{ apply: "mix", params: ["#ffccaa", 20] }]).brightness(0.1).contrast(0.1);
          break;
        case "anime":
          image = image.color([{ apply: "saturate", params: [40] }]).brightness(0.15);
          break;
        case "nature":
          image = image.color([{ apply: "saturate", params: [30] }]).brightness(0.05);
          break;
        case "soft-glow":
          image = image.blur(2).brightness(0.1).contrast(0.05);
          break;
        default:
          image = image.brightness(0.1).contrast(0.1);
      }

      // Step 8: Save enhanced image
      await image.writeAsync(outputPath);

      // Step 9: Send enhanced image
      await api.sendMessage({
        body: `✨ Your enhanced image is ready! Preset applied: ${preset}`,
        attachment: fs.createReadStream(outputPath)
      }, threadID);

      // Step 10: Countdown animation + delete fancy message
      setTimeout(async () => {
        const countdownMsg = await api.sendMessage("🔥 Deleting fancy message in 3...", threadID);
        setTimeout(() => api.editMessage("⚡ Deleting fancy message in 2...", countdownMsg.messageID), 1000);
        setTimeout(() => api.editMessage("💫 Deleting fancy message in 1...", countdownMsg.messageID), 2000);
        setTimeout(() => {
          api.unsendMessage(sentMsg.messageID);
          api.unsendMessage(countdownMsg.messageID);
        }, 3000);
      }, 1000);

    } catch (err) {
      console.error("Enhance error:", err);
      await api.sendMessage("⚠️ Failed to enhance image!", threadID);
    }

    // Step 11: Clean cache
    try {
      const files = await fs.readdir(__root);
      for (const file of files) fs.unlinkSync(path.join(__root, file));
    } catch (err) {
      console.error("Cache clear error:", err.message);
    }
  }
};