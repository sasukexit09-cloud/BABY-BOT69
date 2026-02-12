const axios = require("axios");

const cache = new Map(); // 🔥 simple memory cache

module.exports = {
  config: {
    name: "sing",
    version: "4.0.0",
    author: "AYAN | Premium Upgrade",
    countDown: 2,
    role: 0,
    category: "media",
    guide: { en: "{pn} [song name]" }
  },

  onStart: async function ({ args, message, event, commandName }) {
    const { getStreamFromURL } = global.utils;
    const keyWord = args.join(" ");

    if (!keyWord) return message.reply("🎵 | Please type a song name.");

    try {
      let result;

      // 🔥 CACHE SYSTEM (30 min)
      if (cache.has(keyWord)) {
        const data = cache.get(keyWord);
        if (Date.now() - data.time < 30 * 60 * 1000) {
          result = data.result;
        } else cache.delete(keyWord);
      }

      if (!result) {
        result = (await search(keyWord)).slice(0, 6);
        cache.set(keyWord, { result, time: Date.now() });
      }

      if (!result.length)
        return message.reply("❌ | No results found.");

      const thumbs = await Promise.all(
        result.map(v => getStreamFromURL(v.thumbnail))
      );

      let msg = "╔═════ 🍒 MUSIC SEARCH 🍒 ═════╗\n\n";
      result.forEach((v, i) => {
        msg += `${i + 1}. ${v.title}\n⏱ ${v.time}\n\n`;
      });

      msg += "━━━━━━━━━━━━━━━━━━\n";
      msg += "Reply: number | quality\nExample: 1 320";

      message.reply(
        { body: msg, attachment: thumbs },
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            result
          });
        }
      );
    } catch {
      message.reply("⚠️ Search failed.");
    }
  },

  onReply: async function ({ event, Reply, message }) {
    const { getStreamFromURL } = global.utils;
    const { result } = Reply;

    const input = event.body.split(" ");
    const choice = parseInt(input[0]);
    const quality = input[1] === "320" ? "320" : "128";

    if (isNaN(choice) || choice <= 0 || choice > result.length)
      return message.reply("🍒 Invalid selection.");

    try {
      await message.unsend(Reply.messageID);
      const loading = await message.reply("⏳ Downloading...");

      const video = result[choice - 1];
      const ytUrl = `https://www.youtube.com/watch?v=${video.id}`;

      const apis = [
        `https://yt-mp3-imran.vercel.app/api?url=${encodeURIComponent(ytUrl)}&quality=${quality}`,
        `https://api.samirxp.repl.co/ytdl?url=${ytUrl}`,
        `https://xnilapi-glvi.onrender.com/xnil/ytmp3?url=${ytUrl}`
      ];

      let audioUrl = null;

      for (const apiUrl of apis) {
        try {
          const res = await axios.get(apiUrl, { timeout: 15000 });
          if (!res.data || typeof res.data !== "object") continue;

          audioUrl =
            res.data.download_link ||
            res.data.data?.media ||
            res.data.link ||
            res.data.url ||
            res.data.audio ||
            res.data.result?.download;

          if (audioUrl && audioUrl.startsWith("http")) break;
        } catch {
          continue;
        }
      }

      if (!audioUrl) throw new Error("All APIs failed");

      await message.unsend(loading.messageID);

      await message.reply({
        body:
          `╔═════ 🍓 NOW PLAYING 🍓 ═════╗\n\n` +
          `🎧 Title: ${video.title}\n` +
          `💿 Quality: ${quality}kbps\n` +
          `━━━━━━━━━━━━━━━━━━`,
        attachment: await getStreamFromURL(audioUrl)
      });

      global.GoatBot.onReply.delete(Reply.messageID);

    } catch {
      message.reply("⚠️ Currently unavailable.");
    }
  }
};

// 🔎 SAFE SEARCH
async function search(keyword) {
  try {
    const res = await axios.get(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        keyword
      )}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        },
        timeout: 10000
      }
    );

    const match = res.data.match(/ytInitialData\s*=\s*(\{.*?\});/s);
    if (!match) return [];

    const json = JSON.parse(match[1]);

    const contents =
      json?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

    return contents
      .filter(v => v.videoRenderer)
      .map(v => ({
        id: v.videoRenderer.videoId,
        title: v.videoRenderer.title?.runs?.[0]?.text || "No title",
        thumbnail:
          v.videoRenderer.thumbnail?.thumbnails?.pop()?.url || null,
        time: v.videoRenderer.lengthText?.simpleText || "N/A"
      }));
  } catch {
    return [];
  }
}