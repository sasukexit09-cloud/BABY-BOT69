const moment = require('moment-timezone');
const axios = require('axios');

module.exports = {
  config: {
    name: "info",
    aliases: ["inf", "in4"],
    version: "2.0",
    author: " 𝙰𝚈𝙰𝙽 𝙱𝙱𝙴",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Sends information about the bot and admin along with a video."
    },
    longDescription: {
      en: "Sends information about the bot and admin along with a video."
    },
    category: "Information",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message }) {
    this.sendInfo(message);
  },

  onChat: async function ({ event, message }) {
    if (event.body && event.body.toLowerCase() === "info") {
      this.sendInfo(message);
    }
  },

  sendInfo: async function (message) {
    const botName = "🍨 𝚈𝙴𝙰 𝙼𝙸𝙺𝙾 🍨";
    const authorName = "𝙰𝚈𝙰𝙽𝙾 𝙺𝚄𝙹𝙾💌";
    const authorFB = "https://www.facebook.com/profile.php?id=61580589916867";
    const authorInsta = "wahat_12am";
    const status = "💗 𝙼𝙸𝙽𝙶𝙴𝙻 💗";

    const now = moment().tz('Asia/Dhaka');
    const time = now.format('h:mm:ss A');

    const uptime = process.uptime();
    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const hours = Math.floor((uptime / (60 * 60)) % 24);
    const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

    const videoUrl = "https://files.catbox.moe/jioszd.mp4"; /*dont use imgur url for this cmd*/

    const body = `

┏━━━━━━━━━━━━━━━━┓
┃   🝮︎︎︎︎︎︎︎ 𝙰𝙳𝙼𝙸𝙽 𝙸𝙽𝙵𝙾 🝮︎︎︎︎︎︎︎
┃ ╰➤ ɴᴀᴍᴇ: ${authorName}
┃ ╰➤ ғᴀᴄᴇʙᴏᴏᴋ: ${authorFB}
┃ ╰➤ ɪɴsᴛᴀ: ${authorInsta}
┃ ╰➤ sᴛᴀᴛᴜs: ${status}
┃
┃   ❣︎ 𝙱𝙾𝚃 𝙳𝙴𝚃𝙰𝙸𝙻𝚂 ❣︎
┃ ╰➤ ɴᴀᴍᴇ: ${botName}
┃ ╰➤ ᴛɪᴍᴇ: ${time}
┃ ╰➤ ᴜᴘᴛɪᴍᴇ: ${uptimeString}
┗━━━━━━━━━━━━━━━━┛

💌 𝙸 𝙼𝙰𝚈 𝙽𝙾𝚃 𝙱𝙴 𝙿𝙴𝚁𝙵𝙴𝙲𝚃 💌,
  🍓 𝙱𝚄𝚃 𝙸 𝚆𝙸𝙻𝙻 𝙰𝙻𝚆𝙰𝚈𝚂 𝚁𝙴𝙿𝙻𝚈 𝚃𝙾 𝚈𝙾𝚄 🍨`;

    const response = await axios.get(videoUrl, { responseType: 'stream' });

    message.reply({
      body,
      attachment: response.data
    });
  }
};
