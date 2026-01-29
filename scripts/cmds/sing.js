const axios = require("axios");
const fs = require("fs");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json"
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "sing",
    version: "1.1.6",
    aliases: ["music", "play"],
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴 (fixed by Maya)",
    countDown: 5,
    role: 0,
    description: {
      en: "Download audio from YouTube"
    },
    category: "media",
    guide: {
      en:
        "{pn} [<song name>|<song link>]\nExample:\n{pn} chipi chipi chapa chapa"
    }
  },

  onStart: async ({ api, args, event, commandName }) => {
    if (!args[0])
      return api.sendMessage(
        "❌ 𝚂𝙾𝙽𝙶 𝙽𝙰𝙼𝙴 বা 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝙻𝙸𝙽𝙺 দাও",
        event.threadID,
        event.messageID
      );

    const checkurl =
      /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/;

    const isUrl = checkurl.test(args[0]);

    try {
      /* ===== DIRECT LINK ===== */
      if (isUrl) {
        const videoID = args[0].match(checkurl)[1];
        const { data } = await axios.get(
          `${await baseApiUrl()}/ytDl3?link=${videoID}&format=mp3`
        );

        return api.sendMessage(
          {
            body: data.title,
            attachment: await dipto(data.downloadLink, "audio.mp3")
          },
          event.threadID,
          () => fs.unlinkSync("audio.mp3"),
          event.messageID
        );
      }

      /* ===== SEARCH ===== */
      const keyWord = encodeURIComponent(args.join(" "));
      const result = (
        await axios.get(
          `${await baseApiUrl()}/ytFullSearch?songName=${keyWord}`
        )
      ).data.slice(0, 6);

      if (!result.length)
        return api.sendMessage(
          "😅𝙽𝙾 𝚂𝙰𝚁𝙲𝙷 𝚁𝙴𝚂𝚄𝙻𝚃 𝙵𝙾𝚄𝙽𝙳𝙴𝙳",
          event.threadID,
          event.messageID
        );

      let msg = "";
      let i = 1;
      const thumbs = [];

      for (const info of result) {
        msg += `${i++}. ${info.title}\n⏱ ${info.time}\n📺 ${
          info.channel.name
        }\n\n`;
        thumbs.push(await diptoSt(info.thumbnail, "thumb.jpg"));
      }

      api.sendMessage(
        {
          body: msg + "🔁 𝙿𝙻𝙴𝙰𝚂𝙴 𝚁𝙴𝙿𝙻𝙰𝚈 𝚃𝙷𝙴 𝙽𝚄𝙼𝙱𝙴𝚁",
          attachment: thumbs
        },
        event.threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            author: event.senderID,
            messageID: info.messageID,
            result
          });
        },
        event.messageID
      );
    } catch (e) {
      api.sendMessage(
        "❌ Error: " + e.message,
        event.threadID,
        event.messageID
      );
    }
  },

  onReply: async ({ event, api, Reply }) => {
    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > Reply.result.length)
      return api.sendMessage(
        "🍓 𝙿𝙻𝙴𝙰𝚂𝙴 𝙲𝙷𝙾𝙸𝙲𝙴 𝙰 𝙽𝚄𝙼𝙱𝙴𝚁 1 𝚃𝙾 6",
        event.threadID,
        event.messageID
      );

    try {
      const info = Reply.result[choice - 1];
      const { data } = await axios.get(
        `${await baseApiUrl()}/ytDl3?link=${info.id}&format=mp3`
      );

      await api.unsendMessage(Reply.messageID);

      api.sendMessage(
        {
          body: `🎵 ${data.title}\n🎧 Quality: ${data.quality}`,
          attachment: await dipto(data.downloadLink, "audio.mp3")
        },
        event.threadID,
        () => fs.unlinkSync("audio.mp3"),
        event.messageID
      );
    } catch (err) {
      api.sendMessage(
        "😅 𝚃𝙷𝙸𝚂 𝚂𝙾𝙽𝙶 𝙳𝙾𝙴𝚂𝙽'𝚃 𝙰𝚅𝙰𝙸𝙻𝙰𝙱𝙻𝙴 (size limit / api issue)",
        event.threadID,
        event.messageID
      );
    }
  }
};

/* ===== HELPERS ===== */
async function dipto(url, pathName) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(pathName, Buffer.from(res.data));
  return fs.createReadStream(pathName);
}

async function diptoSt(url, pathName) {
  const res = await axios.get(url, { responseType: "stream" });
  res.data.path = pathName;
  return res.data;
}
