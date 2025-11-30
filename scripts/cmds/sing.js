const axios = require("axios");
const fs = require("fs");

const baseApiUrl = async () => {
  if (global.cachedBaseAPI) return global.cachedBaseAPI;
  const base = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
  return global.cachedBaseAPI = base.data.api;
};

module.exports = {
  config: {
    name: "sing",
    version: "2.0 FAST ✨",
    aliases: ["music", "play"],
    author: "Dipto | Optimized by Maya",
    countDown: 3,
    role: 0,
    noPrefix: true,
    description: { en: "Super Fast YouTube Audio Downloader (cute errors!)" },
    category: "media"
  },

  onStart: async ({ api, args, event, commandName }) => {
    const q = args.join(" ").trim();
    if (!q) return api.sendMessage(cuteError("গান নাম বা লিংক টাইপ করো 💬"), event.threadID, event.messageID);

    const ytCheck = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;

    // ========== If direct YouTube link ==========
    if (ytCheck.test(q)) {
      try {
        const { data } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${encodeURIComponent(q)}&format=mp3`);
        return fastSend(api, event, data.title, data.downloadLink);
      } catch (e) {
        console.error(e);
        return api.sendMessage(cuteError("ডাউনলোডে সমস্যা হয়েছে 🥺\nএকটু পরে আবার চেষ্টা করো"), event.threadID, event.messageID);
      }
    }

    // ========== Search ==========
    let search;
    try {
      search = (await axios.get(`${await baseApiUrl()}/ytFullSearch?songName=${encodeURIComponent(q)}`)).data.slice(0, 5);
    } catch (err) {
      console.error(err);
      return api.sendMessage(cuteError("সার্চ করতে পারছি না 😿\nইন্টারনেট বা API চেক করো"), event.threadID, event.messageID);
    }

    if (!search.length)
      return api.sendMessage(cuteError("কিছুই মিললো না ✨\nঅন্য করে বসাও"), event.threadID, event.messageID);

    let msg = "";
    const thumbs = [];

    for (let i = 0; i < search.length; i++) {
      const s = search[i];
      msg += `${i + 1}. ${s.title}\nTime: ${s.time}\nChannel: ${s.channel.name}\n\n`;
      thumbs.push(await fastImg(s.thumbnail));
    }

    api.sendMessage({
      body: msg + "➡️ এখানে নাম্বার রিপ্লাই করো!",
      attachment: thumbs
    }, event.threadID, (err, info) => {
      if (err) {
        console.error(err);
        api.sendMessage(cuteError("মেসেজ পাঠাতে সমস্যা 😵‍💫"), event.threadID, event.messageID);
        return;
      }
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: event.senderID,
        result: search
      });
    });
  },

  onReply: async ({ api, event, Reply }) => {
    const n = parseInt(event.body);
    if (!n || n < 1 || n > Reply.result.length)
      return api.sendMessage(cuteError("ভুল নম্বর 😅\n1-" + Reply.result.length + " এর মধ্যে দাও"), event.threadID, event.messageID);

    const pick = Reply.result[n - 1];

    try {
      const { data } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${pick.id}&format=mp3`);

      await api.unsendMessage(Reply.messageID);

      return fastSend(api, event, `• Title: ${data.title}\n• Quality: ${data.quality}`, data.downloadLink);

    } catch (e) {
      console.error(e);
      return api.sendMessage(cuteError("অডিওটা বড়, পাঠানো যায়নি 😞\nঅন্য গান ট্রাই করো"), event.threadID, event.messageID);
    }
  },

  onChat: async ({ event, api, commandName }) => {
    const body = event.body?.toLowerCase();
    const triggers = ["sing", "music", "play"];

    if (body && triggers.some(t => body.startsWith(t))) {
      const sliced = body.split(" ").slice(1);
      event.body = sliced.join(" ");
      await module.exports.onStart({ api, args: sliced, event, commandName });
    }
  }
};

// ================= FAST FUNCTIONS =================

async function fastSend(api, event, title, link) {
  try {
    const file = await fastBuffer(link);
    return api.sendMessage({
      body: title,
      attachment: fs.createReadStream(file)
    }, event.threadID, () => fs.unlinkSync(file), event.messageID);
  } catch (err) {
    console.error(err);
    return api.sendMessage(cuteError("ফাইল সেফ করা যায়নি 😵‍💫"), event.threadID, event.messageID);
  }
}

async function fastBuffer(url) {
  const file = "fast_audio.mp3";
  const data = (await axios.get(url, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(file, data);
  return file;
}

async function fastImg(url) {
  return (await axios.get(url, { responseType: "stream" })).data;
}

// ================= Cute / Stylish Error Text =================

function cuteError(msg) {
  // multiple templates — pick one randomly for variety
  const templates = [
    `❌✨ Oopsie! ✨\n${msg}\n🐾 Try again, pretty please!`,
    `🌸 𝓞𝓸𝓹𝓼! 𝓐 𝓣𝓲𝓷𝔂 𝓟𝓻𝓸𝓫𝓵𝓮𝓶:\n${msg}\n💖 Send another one~`,
    `🍥 𝓣𝓪𝓷𝓽𝓪𝓵𝓲𝔃𝓲𝓷𝓰 𝓔𝓻𝓻𝓸𝓻\n${msg}\n✨ Don't worry — try again!`,
    `😺 Cute-bot says:\n${msg}\n🎵 Ready when you are!`,
    `🌟 𝓗𝓮𝔂 𝓕𝓻𝓲𝓮𝓷𝓭!\n${msg}\n💫 Let's give it another go!`
  ];
  const pick = templates[Math.floor(Math.random() * templates.length)];
  return pick;
}
