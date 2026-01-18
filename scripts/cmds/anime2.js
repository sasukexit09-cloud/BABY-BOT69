const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "anime2",
    version: "1.0.1",
    author: "AYAN & Gemini",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Send random anime video"
    },
    longDescription: {
      en: "Sends a random anime video from Google Drive links."
    },
    category: "group",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, message }) {
    const messages = ["☆《ANIME VIDEO》☆"];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    const videoUrls = [
      "https://drive.google.com/uc?export=download&id=1gI265E7VL9cdyk6TuuFav2uA1HifQs5Y",
      "https://drive.google.com/uc?export=download&id=1gMAKxgOmW8KHCGZHHgdy9oVbAQlwju1R",
      "https://drive.google.com/uc?export=download&id=1gSBzIdm6lys5uU25xLfO2eJ2T9j5USqB",
      "https://drive.google.com/uc?export=download&id=1gT7IaIa7OGZ6DqFaIkZ9wDInscdPM19i",
      "https://drive.google.com/uc?export=download&id=1gZ_yXg7-nhugrDFRu3eod7WkqdRx7__z",
      "https://drive.google.com/uc?export=download&id=1g_W88siZAAa9t0dfoh4MN_yS1EZi6LES",
      "https://drive.google.com/uc?export=download&id=1gagkI-OzhhFp96lgu92zFUe7eRfI-HYB",
      "https://drive.google.com/uc?export=download&id=1gaz8T8mZ5I9wjnEkalM_YWe0RKjSjHon",
      "https://drive.google.com/uc?export=download&id=1ghSYY81_y75d13dCNVBgsN-KknWFqZPe",
      "https://drive.google.com/uc?export=download&id=1grPs_ZOxRLJjeckE_18ufIuXmO4JiqX8",
      "https://drive.google.com/uc?export=download&id=1h2LUncQ1EY-qPpvu3jBoIwYpzkcCT3-f",
      "https://drive.google.com/uc?export=download&id=1h7wXAn7UCoGjki__OC3KCe7P5YtkSL5",
      "https://drive.google.com/uc?export=download&id=1i67IloPzLl4sm1M_-pYF27fmO7ietqwF",
      "https://drive.google.com/uc?export=download&id=1oRSrxjBy3TpoJuqvLlr2G-rarEXmpfqb",
      "https://drive.google.com/uc?export=download&id=1o_52X4nBwE-ZhNBoELquEpJVNt8s4Nlw",
      "https://drive.google.com/uc?export=download&id=1oZYPzoa-nrv86wcHLYJCKDgxyB0WoBlB",
      "https://drive.google.com/uc?export=download&id=1oTXBxT0Wgk4fn92lZQww34aPyIOw4JsL",
      "https://drive.google.com/uc?export=download&id=1oUECTBiTT4oOV-fIeRCIngN0RDgHYynY",
      "https://drive.google.com/uc?export=download&id=1oZDfbjwKAZ8qzy1oOp9bwN6LZfNrWhR9",
      "https://drive.google.com/uc?export=download&id=1oJzK17HPM4kWbz4PCmTCZ0Js3dZRoTVI"
    ];

    const videoUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];
    const cacheDir = path.join(__dirname, "cache");
    const outputPath = path.join(cacheDir, `anime_${event.messageID}.mp4`);

    try {
      // ক্যাশ ফোল্ডার না থাকলে তৈরি করা
      fs.ensureDirSync(cacheDir);

      // ইউজারকে একটি ওয়েটিং মেসেজ দেওয়া (অপশনাল)
      const waiting = await message.reply("⏳ Sending random anime video...");

      const response = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body: `「 ${randomMessage} 」`,
            attachment: fs.createReadStream(outputPath)
          },
          event.threadID,
          () => {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            // ওয়েটিং মেসেজটি ডিলিট করতে চাইলে: api.unsendMessage(waiting.messageID);
          },
          event.messageID
        );
      });

      writer.on("error", (err) => {
        console.error(err);
        message.reply("❌ Video download error!");
      });

    } catch (e) {
      console.error(e);
      message.reply("⚠️ গুগল ড্রাইভ থেকে ভিডিওটি ডাউনলোড করতে সমস্যা হচ্ছে।");
    }
  }
};