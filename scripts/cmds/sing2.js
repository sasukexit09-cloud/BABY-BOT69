const axios = require("axios");
const fs = require("fs");
const fsp = require("fs").promises;

// ===== BASE API =====
const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json"
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "sing2",
    version: "1.2.0",
    credits: "AYAN BBE💋 (VIP removed by Maya)",
    countDown: 5,
    hasPermssion: 0,
    description: "Download YouTube video/audio/info (FREE)",
    category: "media",
    commandCategory: "media",
    usePrefix: true,
    prefix: true,
    usages:
      "{pn} -v <name/link>\n" +
      "{pn} -a <name/link>\n" +
      "{pn} -i <name/link>"
  },

  run: async ({ api, args, event }) => {
    const { threadID, messageID, senderID } = event;

    // ===== ACTION =====
    let action = args[0]?.toLowerCase() || "-v";
    if (!["-v", "video", "mp4", "-a", "audio", "mp3", "-i", "info"].includes(action)) {
      args.unshift("-v");
      action = "-v";
    }

    // ===== YT URL CHECK =====
    const ytbRegex =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/;
    const isUrl = args[1] && ytbRegex.test(args[1]);

    // ===== DIRECT LINK =====
    if (isUrl) {
      const format = ["-v", "video", "mp4"].includes(action)
        ? "mp4"
        : ["-a", "audio", "mp3"].includes(action)
        ? "mp3"
        : null;

      if (!format)
        return api.sendMessage("❌ Invalid format.", threadID, messageID);

      try {
        const videoID = args[1].match(ytbRegex)[1];
        const path = `yt_${videoID}.${format}`;

        const { data } = await axios.get(
          `${await baseApiUrl()}/ytDl3?link=${videoID}&format=${format}&quality=3`
        );

        await api.sendMessage(
          {
            body: `🎵 ${data.title}\n📥 Quality: ${data.quality}`,
            attachment: await downloadFile(data.downloadLink, path)
          },
          threadID,
          async () => await fsp.unlink(path),
          messageID
        );
        return;
      } catch (e) {
        console.error(e);
        return api.sendMessage("❌ Download failed.", threadID, messageID);
      }
    }

    // ===== SEARCH =====
    args.shift();
    const keyword = args.join(" ");
    if (!keyword)
      return api.sendMessage("❌ Provide song name.", threadID, messageID);

    try {
      const search = (
        await axios.get(
          `${await baseApiUrl()}/ytFullSearch?songName=${encodeURIComponent(keyword)}`
        )
      ).data.slice(0, 6);

      if (!search.length)
        return api.sendMessage("❌ No result found.", threadID, messageID);

      let msg = "";
      const thumbs = [];

      search.forEach((v, i) => {
        msg += `${i + 1}. ${v.title}\n⏱ ${v.time}\n📺 ${v.channel.name}\n\n`;
        thumbs.push(streamImage(v.thumbnail, `thumb_${i}.jpg`));
      });

      api.sendMessage(
        {
          body: msg + "👉 Reply with number",
          attachment: await Promise.all(thumbs)
        },
        threadID,
        (err, info) => {
          if (err) return;
          global.client.handleReply.push({
            name: "sing",
            messageID: info.messageID,
            author: senderID,
            result: search,
            action
          });
        },
        messageID
      );
    } catch (e) {
      console.error(e);
      api.sendMessage("❌ Search error.", threadID, messageID);
    }
  },

  handleReply: async ({ event, api, handleReply }) => {
    const { senderID, body, threadID, messageID } = event;
    if (senderID !== handleReply.author) return;

    const index = parseInt(body);
    if (isNaN(index) || index < 1 || index > handleReply.result.length)
      return api.sendMessage("❌ Invalid number.", threadID, messageID);

    const video = handleReply.result[index - 1];
    const videoID = video.id;

    try {
      await api.unsendMessage(handleReply.messageID);
    } catch {}

    if (handleReply.action === "-i" || handleReply.action === "info") {
      const { data } = await axios.get(
        `${await baseApiUrl()}/ytfullinfo?videoID=${videoID}`
      );
      return api.sendMessage(
        {
          body:
            `🎵 ${data.title}\n` +
            `⏱ ${(data.duration / 60).toFixed(2)} mins\n` +
            `👀 ${data.view_count}\n👍 ${data.like_count}\n` +
            `📺 ${data.channel}`,
          attachment: await streamImage(data.thumbnail, "info.jpg")
        },
        threadID,
        messageID
      );
    }

    const format = ["-v", "video", "mp4"].includes(handleReply.action)
      ? "mp4"
      : "mp3";
    const path = `yt_${videoID}.${format}`;

    const { data } = await axios.get(
      `${await baseApiUrl()}/ytDl3?link=${videoID}&format=${format}&quality=3`
    );

    api.sendMessage(
      {
        body: `🎶 ${data.title}`,
        attachment: await downloadFile(data.downloadLink, path)
      },
      threadID,
      async () => await fsp.unlink(path),
      messageID
    );
  }
};

// ===== HELPERS =====
async function downloadFile(url, path) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  await fsp.writeFile(path, res.data);
  return fs.createReadStream(path);
}

async function streamImage(url, path) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  await fsp.writeFile(path, res.data);
  return fs.createReadStream(path);
}
