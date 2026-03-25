const axios = require("axios");
const fs = require('fs');

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "sing",
    version: "2.1.0",
    aliases: ["music", "play"],
    author: "𝙰𝚈𝙰𝙽 𝙵𝙸𝚇𝙴𝙳",
    countDown: 5,
    role: 0,
    description: "Download audio from YouTube",
    category: "media",
    guide: "{pn} [song name | link]"
  },

  // 🔥 FIX HERE
  onStart: async function ({ api, args, event }) {

    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    let videoID;
    const urlYtb = checkurl.test(args[0]);

    if (urlYtb) {
      const match = args[0].match(checkurl);
      videoID = match ? match[1] : null;

      const { data: { title, downloadLink } } = await axios.get(
        `${await baseApiUrl()}/ytDl3?link=${videoID}&format=mp3`
      );

      return api.sendMessage({
        body: title,
        attachment: await dipto(downloadLink, 'audio.mp3')
      }, event.threadID, () => fs.unlinkSync('audio.mp3'), event.messageID);
    }

    let keyWord = args.join(" ");
    keyWord = keyWord.includes("?feature=share")
      ? keyWord.replace("?feature=share", "")
      : keyWord;

    const maxResults = 6;
    let result;

    try {
      result = ((await axios.get(
        `${await baseApiUrl()}/ytFullSearch?songName=${keyWord}`
      )).data).slice(0, maxResults);
    } catch (err) {
      return api.sendMessage("❌ Error: " + err.message, event.threadID, event.messageID);
    }

    if (result.length == 0)
      return api.sendMessage("⭕ No result found!", event.threadID, event.messageID);

    let msg = "";
    let i = 1;
    const thumbnails = [];

    for (const info of result) {
      thumbnails.push(diptoSt(info.thumbnail, `thumb${i}.jpg`));
      msg += `${i++}. ${info.title}\nTime: ${info.time}\nChannel: ${info.channel.name}\n\n`;
    }

    api.sendMessage({
      body: msg + "👉 Reply with a number",
      attachment: await Promise.all(thumbnails)
    }, event.threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: module.exports.config.name,
        author: event.senderID,
        result
      });
    }, event.messageID);
  },

  onReply: async function ({ event, api, Reply }) {
    try {
      const { result } = Reply;
      const choice = parseInt(event.body);

      if (!isNaN(choice) && choice > 0 && choice <= result.length) {
        const infoChoice = result[choice - 1];
        const idvideo = infoChoice.id;

        const { data: { title, downloadLink, quality } } = await axios.get(
          `${await baseApiUrl()}/ytDl3?link=${idvideo}&format=mp3`
        );

        await api.sendMessage({
          body: `• Title: ${title}\n• Quality: ${quality}`,
          attachment: await dipto(downloadLink, 'audio.mp3')
        }, event.threadID, () => fs.unlinkSync('audio.mp3'), event.messageID);

      } else {
        api.sendMessage("❌ Invalid choice", event.threadID, event.messageID);
      }

    } catch (error) {
      console.log(error);
      api.sendMessage("⭕ Audio too large or error!", event.threadID, event.messageID);
    }
  }
};

// download audio
async function dipto(url, pathName) {
  const response = (await axios.get(url, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(pathName, Buffer.from(response));
  return fs.createReadStream(pathName);
}

// download thumbnail
async function diptoSt(url, pathName) {
  const response = await axios.get(url, { responseType: "stream" });
  response.data.path = pathName;
  return response.data;
}