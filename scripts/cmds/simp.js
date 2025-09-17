const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "simp",
    version: "1.0",
    author: "Xe Mo (Redwan)",
    shortDescription: "Generate an AI-powered video",
    longDescription: "Generates an AI 'simp-style' video based on your prompt.",
    category: "ai",
    guide: "{p}{n} <your prompt here>"
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ").trim();
    if (!prompt) {
      return api.sendMessage(
        "⚠️ Please provide a prompt to generate the video.",
        event.threadID,
        event.messageID
      );
    }

    const waitingMsg = await api.sendMessage(
      `🎥 Creating your video for: "${prompt}"...\nPlease wait a moment.`,
      event.threadID
    );

    try {
      const { data } = await axios.get(
        `https://xemo.up.railway.app/api/simpvideo?prompt=${encodeURIComponent(prompt)}`
      );

      if (!data.status || !data.data || !data.data.url) {
        api.unsendMessage(waitingMsg.messageID);
        return api.sendMessage(
          "❌ Sorry, something went wrong while generating the video.",
          event.threadID,
          event.messageID
        );
      }

      const videoUrl = data.data.url;
      const filePath = path.join(__dirname, `simp_${Date.now()}.mp4`);
      const videoStream = await axios.get(videoUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(filePath);

      videoStream.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      api.unsendMessage(waitingMsg.messageID);
      api.sendMessage(
        {
          body: `✅ Your video has been generated for: "${prompt}"`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );
    } catch (error) {
      console.error("Video generation error:", error);
      api.unsendMessage(waitingMsg.messageID);
      api.sendMessage(
        "❌ An unexpected error occurred while creating your video. Please try again later.",
        event.threadID,
        event.messageID
      );
    }
  }
};
