const axios = require("axios");

const baseApiUrl = async () => {
  try {
    const base = await axios.get(
      "https://raw.githubusercontent.com/ARYAN-AROHI-STORE/A4YA9-A40H1/refs/heads/main/APIRUL.json",
      { timeout: 5000 }
    );
    return base.data.api;
  } catch (e) {
    throw new Error("Base API URL fetch failed");
  }
};

module.exports.config = {
  name: "tiksr2",
  version: "1.1",
  author: "Mesbah Bb'e",
  countDown: 5,
  role: 0,
  description: {
    en: "Search & download TikTok videos (VIP only)",
  },
  category: "MEDIA",
  guide: {
    en:
      "{pn} <search> - <optional limit>\n" +
      "Example:\n" +
      "{pn} caredit - 20",
  },
};

module.exports.onStart = async function ({ api, args, event, usersData }) {
  const { senderID, threadID } = event;

  // ===== VIP CHECK =====
  const userData = await usersData.get(senderID);
  if (!userData || userData.vip !== true) {
    return api.sendMessage(
      "🔒 | **VIP ONLY COMMAND**\n\n🥺 Baby, তুমি VIP না\n✨ আগে VIP নাও তারপর tiksr2 use করো 💋",
      threadID
    );
  }
  // =====================

  if (!args.length) {
    return api.sendMessage(
      "❌ | Please provide a search keyword.\nExample:\n`tiksr2 caredit - 20`",
      threadID
    );
  }

  let search = args.join(" ");
  let searchLimit = 20;

  const match = search.match(/^(.+?)\s*-\s*(\d+)$/);
  if (match) {
    search = match[1].trim();
    searchLimit = Math.min(parseInt(match[2]), 50);
  }

  try {
    const apiUrl = `${await baseApiUrl()}/tiktoksearch?search=${encodeURIComponent(
      search
    )}&limit=${searchLimit}`;

    const res = await axios.get(apiUrl, { timeout: 15000 });
    const data = res.data?.data;

    if (!Array.isArray(data) || data.length === 0) {
      return api.sendMessage(
        "⚠️ | No TikTok videos found. Try another keyword.",
        threadID
      );
    }

    const videoData = data[Math.floor(Math.random() * data.length)];

    const videoStream = await axios({
      method: "GET",
      url: videoData.video,
      responseType: "stream",
      timeout: 20000,
    });

    const message = 
`🎵 TikTok Video Found!
━━━━━━━━━━━━━━
📌 Title: ${videoData.title || "N/A"}
🔗 Link: ${videoData.video}
━━━━━━━━━━━━━━`;

    api.sendMessage(
      {
        body: message,
        attachment: videoStream.data,
      },
      threadID
    );
  } catch (err) {
    console.error("TikSR2 Error:", err.message);
    api.sendMessage(
      "❌ | Failed to fetch TikTok video.\nPlease try again later.",
      threadID
    );
  }
};
