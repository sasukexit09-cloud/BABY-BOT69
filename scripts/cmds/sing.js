const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// 🔥 MAIN API
const baseApi1 = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
  return base.data.api;
};

// 🔥 BACKUP API
const baseApi2 = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.api;
};

module.exports = {
  config: {
    name: "sing",
    version: "4.5.0",
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴",
    role: 0,
    category: "media",
    guide: "{pn} <song name | link>"
  },

  onStart: async function ({ api, event, args }) {
    if (!args[0]) return api.sendMessage("🍓 | 𝙿𝚕𝚎𝚊𝚜𝚎 𝚎𝚗𝚝𝚎𝚛 𝚊 𝚜𝚘𝚗𝚐 𝚗𝚊𝚖𝚎 🍧", event.threadID, event.messageID);

    const isUrl = /youtu\.be|youtube\.com/.test(args[0]);

    try {
      let apiUrl;
      try { apiUrl = await baseApi1(); } catch (e) { apiUrl = await baseApi2(); }

      if (isUrl) {
        api.setMessageReaction("⏳", event.messageID, () => {}, true);
        const { data } = await axios.get(`${apiUrl}/ytDl3?link=${encodeURIComponent(args[0])}&format=mp3`);
        return handleDownload(api, event, data.downloadLink, data.title);
      }

      const keyword = args.join(" ");
      const { data: result } = await axios.get(`${apiUrl}/ytFullSearch?songName=${encodeURIComponent(keyword)}`);
      const topResults = result.slice(0, 6);

      if (!topResults.length) return api.sendMessage("🍧 | 𝙽𝚘 𝚛𝚎𝚜𝚞𝚕𝚝 😢", event.threadID, event.messageID);

      let msg = "🍓 𝙼𝙸𝙺𝙾 𝙼𝚄𝚂𝙸𝙲 𝙻𝙸𝚂𝚃 🍧\n\n";
      const attachments = [];

      for (let i = 0; i < topResults.length; i++) {
        msg += `🎂 ${i + 1}. ${topResults[i].title}\n⏱ ${topResults[i].time}\n\n`;
        try {
          const img = (await axios.get(topResults[i].thumbnail, { responseType: "stream" })).data;
          attachments.push(img);
        } catch (e) {}
      }

      api.sendMessage({ 
        body: msg + "🍧 𝚁𝙴𝙿𝙻𝚈 𝙰 𝙽𝚄𝙼𝙱𝙴𝚁 𝚃𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 🍓", 
        attachment: attachments 
      }, event.threadID, (err, info) => {
        if (err) return console.error(err);
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: event.senderID,
          result: topResults,
          messageID: info.messageID // ড্যাশবোর্ডের আইডি সেভ রাখা হলো
        });
      }, event.messageID);

    } catch (err) {
      api.sendMessage("🍓 | 𝚂𝙾𝚁𝚁𝚈 𝙱𝙱𝙴 𝙰𝙿𝙸 𝙴𝚁𝚁𝙾𝚁 😅", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { result, author, messageID } = Reply;
    if (event.senderID !== author) return;

    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > result.length) return;

    // ১. মেসেজ পাওয়ার সাথে সাথে ড্যাশবোর্ড মেসেজ ডিলিট (unsend) করা
    api.unsendMessage(messageID).catch(err => console.log("Unsend failed:", err));

    // ২. রিঅ্যাকশন দেওয়া
    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    
    try {
      let apiUrl;
      try { apiUrl = await baseApi1(); } catch (e) { apiUrl = await baseApi2(); }

      const selected = result[choice - 1];
      const { data } = await axios.get(`${apiUrl}/ytDl3?link=${encodeURIComponent(selected.id)}&format=mp3`);

      if (!data || !data.downloadLink) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("🍧 | 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚕𝚒𝚗𝚔 𝚊𝚛𝚎 𝚗𝚘𝚝 𝚏𝚘𝚞𝚗𝚍!", event.threadID, event.messageID);
      }

      await handleDownload(api, event, data.downloadLink, data.title);

    } catch (err) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("🍧 | 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙵𝙰𝙸𝙻𝙴𝙳 𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝙰𝙸𝚃 𝙱𝙱𝙴 𝙰𝙽𝙳 𝚃𝚁𝚈 𝙰𝙶𝙸𝙽 💌", event.threadID, event.messageID);
    }
  }
};

// 🔥 FAST DOWNLOAD HANDLER
async function handleDownload(api, event, url, title) {
  const filePath = path.join(__dirname, `tmp_${Date.now()}.mp3`);
  
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      const stats = fs.statSync(filePath);
      if (stats.size > 26214400) { // 25MB Limit
        api.sendMessage("🍧 | গানটি অনেক বড় (২৫ মেগাবাইটের বেশি), তাই পাঠানো সম্ভব নয়।", event.threadID, event.messageID);
        return fs.unlinkSync(filePath);
      }

      api.sendMessage({
        body: `🍓 𝙽𝙾𝚆 𝙿𝙻𝙰𝚈𝙸𝙽𝙶 🍧\n\n🎂 ${title}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, (err) => {
        if (!err) {
            api.setMessageReaction("🦋", event.messageID, () => {}, true);
            fs.unlinkSync(filePath);
        }
      }, event.messageID);
    });

    writer.on('error', (e) => {
      api.sendMessage("🍧 | File System Error!", event.threadID);
    });

  } catch (e) {
    api.sendMessage("🍧 | 𝚂𝚎𝚛𝚟𝚎𝚛 𝙴𝚛𝚛𝚘𝚛 𝚠𝚑𝚒𝚕𝚎 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐!", event.threadID);
  }
}