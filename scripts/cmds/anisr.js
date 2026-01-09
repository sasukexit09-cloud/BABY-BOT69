const axios = require("axios");

/* ===== Stream from URL ===== */
async function getStreamFromURL(url) {
  try {
    const response = await axios.get(url, { responseType: "stream" });
    return response.data;
  } catch (err) {
    console.error("Stream fetch error:", err.message);
    throw new Error("Failed to fetch stream");
  }
}

/* ===== Fetch TikTok anime edit videos ===== */
async function fetchTikTokVideos(query) {
  try {
    const res = await axios.get(
      `https://lyric-search-neon.vercel.app/kshitiz?keyword=${encodeURIComponent(query)}`
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("TikTok fetch error:", err.message);
    return [];
  }
}

module.exports = {
  config: {
    name: "anisr",
    aliases: ["anisr", "as"],
    author: "Vex_kshitiz • Edited by Maya",
    version: "2.1",
    shortDescription: { en: "Get anime edit videos" },
    longDescription: { en: "Search and send anime edit videos from TikTok" },
    category: "anime",
    guide: { en: "{p}{n} <search query>" },
    usePrefix: false
  },

  onStart: async function ({ api, event, args }) {
    try {
      const query = args.join(" ").trim();
      if (!query) {
        return api.sendMessage(
          "⚠️ অনুগ্রহ করে একটি search query দাও!",
          event.threadID,
          event.messageID
        );
      }

      const finalQuery = `${query} anime edit`;

      /* ===== Reaction (optional) ===== */
      try {
        if (api.setMessageReaction) {
          api.setMessageReaction("⏳", event.messageID, () => {}, true);
        }
      } catch {}

      const videos = await fetchTikTokVideos(finalQuery);

      if (!videos.length) {
        return api.sendMessage(
          `❌ '${query}' এর জন্য কোনো ভিডিও পাওয়া যায়নি।`,
          event.threadID,
          event.messageID
        );
      }

      const selected =
        videos[Math.floor(Math.random() * videos.length)];

      if (!selected?.videoUrl) {
        return api.sendMessage(
          "❌ ভিডিও লিংক পাওয়া যায়নি।",
          event.threadID,
          event.messageID
        );
      }

      const videoStream = await getStreamFromURL(selected.videoUrl);

      await api.sendMessage(
        {
          body: "✨ Anime edit video",
          attachment: videoStream
        },
        event.threadID,
        event.messageID
      );

    } catch (err) {
      console.error("XANISAR CMD ERROR:", err);
      api.sendMessage(
        "❌ ভিডিও পাঠাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করো।",
        event.threadID,
        event.messageID
      );
    }
  }
};
