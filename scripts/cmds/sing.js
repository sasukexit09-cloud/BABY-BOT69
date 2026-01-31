const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "sing",
    version: "2.0.0",
    author: "xnil6x | Raha",
    countDown: 2, // Fast command cooldown
    role: 0,
    category: "media",
    guide: { en: "{pn} [song name]" }
  },

  onStart: async function({ args, message, event, commandName }) {
    const { getStreamFromURL } = global.utils;
    let keyWord = args.join(" ");
    if (!keyWord) return message.reply("please type a song name 🍓🍒");

    try {
      // Step 1: Search and Parallel Thumbnail Fetching
      const result = (await search(keyWord)).slice(0, 6);
      if (result.length === 0) return message.reply("🍓Kono result pawa jayni.");

      // Parallel streaming for faster thumbnail loading
      const thumbnails = await Promise.all(result.map(info => getStreamFromURL(info.thumbnail)));

      let msg = "▭ [ Fast Search ] ▭\n\n";
      result.forEach((info, index) => {
        msg += `${index + 1}. ${info.title}\n[-] Duration: ${info.time}\n\n`;
      });

      message.reply({
        body: msg + "▭ Reply with a number.",
        attachment: thumbnails
      }, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          result
        });
      });
    } catch (err) {
      return message.reply(" [😿] YouTube logic error.");
    }
  },

  onReply: async ({ event, api, Reply, message }) => {
    const { getStreamFromURL } = global.utils;
    const { result } = Reply;
    const choice = parseInt(event.body);

    if (isNaN(choice) || choice > result.length || choice <= 0) return;

    try {
      await message.unsend(Reply.messageID);
      const loading = await message.reply("[🍓] Downloading Audio...");
      
      const id = result[choice - 1].id;
      const title = result[choice - 1].title;

      // Fast API List (Try multiple if one fails)
      const apis = [
        `https://api.samirxp.repl.co/ytdl?url=https://www.youtube.com/watch?v=${id}`,
        `https://xnilapi-glvi.onrender.com/xnil/ytmp3?url=https://www.youtube.com/watch?v=${id}`,
        `https://api.dipto.info/yt?url=https://www.youtube.com/watch?v=${id}`
      ];

      let audioUrl = null;
      for (const apiUrl of apis) {
        try {
          const res = await axios.get(apiUrl, { timeout: 10000 }); // 10s timeout
          audioUrl = res.data.download_link || res.data.data?.media || res.data.link;
          if (audioUrl) break;
        } catch (e) { continue; }
      }

      if (!audioUrl) throw new Error("All APIs failed.");

      await message.unsend(loading.messageID);
      await message.reply({
        body: `🍓 [ BABY SINGED ] 🍓\n[-] Title: ${title}`,
        attachment: await getStreamFromURL(audioUrl)
      });
    } catch (error) {
      message.reply("▭ [!] Currently unavailable. Try again later.");
    }
  }
};

async function search(keyWord) {
  // Ultra fast direct scraping
  const res = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(keyWord)}`);
  const html = res.data;
  const json = JSON.parse(html.split('ytInitialData = ')[1].split(';</script>')[0]);
  const contents = json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
  
  return contents
    .filter(v => v.videoRenderer)
    .map(v => ({
      id: v.videoRenderer.videoId,
      title: v.videoRenderer.title.runs[0].text,
      thumbnail: v.videoRenderer.thumbnail.thumbnails.pop().url,
      time: v.videoRenderer.lengthText?.simpleText || "N/A"
    }));
}