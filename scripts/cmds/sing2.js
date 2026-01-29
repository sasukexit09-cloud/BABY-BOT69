const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ================= BASE API CACHE =================
let cachedBaseAPI = null;
async function baseApiUrl() {
  if (cachedBaseAPI) return cachedBaseAPI;
  const { data } = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
  cachedBaseAPI = data.api;
  return cachedBaseAPI;
}

// ================= YT ID EXTRACT =================
function extractVideoID(input) {
  const r =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const m = input.match(r);
  return m ? m[1] : null;
}

module.exports = {
  config: {
    name: "sing2",
    aliases: ["music", "play"],
    version: "2.2 STABLE 🚀",
    author: "Dipto | Fixed by Maya",
    countDown: 3,
    role: 0,
    noPrefix: true,
    description: { en: "Fast YouTube Music Downloader (Audio)" },
    category: "media"
  },

  onStart: async ({ api, args, event, commandName }) => {
    const q = args.join(" ").trim();
    if (!q)
      return api.sendMessage(
        cuteError("গান নাম বা YouTube লিংক দাও 🎧"),
        event.threadID,
        event.messageID
      );

    const ytID = extractVideoID(q);

    // ===== DIRECT LINK =====
    if (ytID) {
      try {
        const { data } = await axios.get(
          `${await baseApiUrl()}/ytDl3?link=${ytID}&format=mp3`
        );
        return fastSend(api, event, data.title, data.downloadLink);
      } catch (e) {
        console.error(e);
        return api.sendMessage(
          cuteError("ডাউনলোড করা যাচ্ছে না 🥺"),
          event.threadID,
          event.messageID
        );
      }
    }

    // ===== SEARCH =====
    let search;
    try {
      search = (
        await axios.get(
          `${await baseApiUrl()}/ytFullSearch?songName=${encodeURIComponent(q)}`
        )
      ).data.slice(0, 5);
    } catch (e) {
      console.error(e);
      return api.sendMessage(
        cuteError("সার্চ কাজ করছে না 😿"),
        event.threadID,
        event.messageID
      );
    }

    if (!search.length)
      return api.sendMessage(
        cuteError("কোনো গান পাওয়া যায়নি ✨"),
        event.threadID,
        event.messageID
      );

    let msg = "";
    const thumbs = [];

    for (let i = 0; i < search.length; i++) {
      const s = search[i];
      msg += `${i + 1}. ${s.title}\n⏱ ${s.time}\n📺 ${s.channel.name}\n\n`;
      thumbs.push(await fastImg(s.thumbnail));
    }

    api.sendMessage(
      {
        body: msg + "➡️ নাম্বার রিপ্লাই করো",
        attachment: thumbs
      },
      event.threadID,
      (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          author: event.senderID,
          messageID: info.messageID,
          result: search
        });
      }
    );
  },

  onReply: async ({ api, event, Reply }) => {
    if (event.senderID !== Reply.author) return;

    const n = parseInt(event.body);
    if (isNaN(n) || n < 1 || n > Reply.result.length)
      return api.sendMessage(
        cuteError("ভুল নাম্বার 😅"),
        event.threadID,
        event.messageID
      );

    const pick = Reply.result[n - 1];

    try {
      const { data } = await axios.get(
        `${await baseApiUrl()}/ytDl3?link=${pick.id}&format=mp3`
      );

      await api.unsendMessage(Reply.messageID);
      return fastSend(api, event, data.title, data.downloadLink);
    } catch (e) {
      console.error(e);
      return api.sendMessage(
        cuteError("অডিও পাঠানো যাচ্ছে না 😞"),
        event.threadID,
        event.messageID
      );
    }
  }
};

// ================= FAST HELPERS =================
async function fastBuffer(url) {
  const file = path.join(
    __dirname,
    crypto.randomBytes(8).toString("hex") + ".mp3"
  );
  const { data } = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(file, data);
  return file;
}

async function fastSend(api, event, title, link) {
  let file;
  try {
    file = await fastBuffer(link);
    return api.sendMessage(
      {
        body: `🎵 ${title}`,
        attachment: fs.createReadStream(file)
      },
      event.threadID,
      () => fs.existsSync(file) && fs.unlinkSync(file),
      event.messageID
    );
  } catch (e) {
    if (file && fs.existsSync(file)) fs.unlinkSync(file);
    return api.sendMessage(
      cuteError("ফাইল পাঠানো যায়নি 😵‍💫"),
      event.threadID,
      event.messageID
    );
  }
}

async function fastImg(url) {
  return (await axios.get(url, { responseType: "stream" })).data;
}

// ================= CUTE ERROR =================
function cuteError(msg) {
  const arr = [
    `❌ ${msg}\n🐾 আবার চেষ্টা করো`,
    `🌸 Oops!\n${msg}`,
    `😺 ${msg}\n🎵 Ready!`,
    `✨ ${msg}`
  ];
  return arr[Math.floor(Math.random() * arr.length)];
}
