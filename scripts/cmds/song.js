const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "song",
  version: "2.3.1",
  aliases: ["music", "play"],
  author: "AYAN & Gemini",
  countDown: 5,
  role: 0,
  description: "ইউটিউব থেকে গান ডাউনলোড করুন (সার্চ বা লিংক)",
  category: "media",
  guide: {
    en: "{pn} [song name or YouTube link]"
  }
};

const baseApiUrl = async () => {
  const base = await axios.get(`https://raw.githubusercontent.com/rummmmna21/rx-api/main/baseApiUrl.json`);
  return base.data.api;
};

module.exports.onStart = async function ({ api, args, event }) {
  const { threadID, messageID } = event;
  const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;

  if (!args[0]) return api.sendMessage("🎵 গানের নাম বা ইউটিউব লিংক দিন।", threadID, messageID);

  const searchingMsg = await api.sendMessage("> 🎀\n𝐒𝐞𝐚𝐫𝐜𝐡𝐢𝐧𝐠... 𝐩𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭!", threadID);
  api.setMessageReaction("🔍", searchingMsg.messageID);

  try {
    const apiBase = await baseApiUrl();
    let videoID;
    let songInfo;

    // ইউটিউব লিঙ্ক চেক
    if (checkurl.test(args[0])) {
      const match = args[0].match(checkurl);
      videoID = match ? match[1] : null;
    } else {
      // কীওয়ার্ড দিয়ে সার্চ
      const keyWord = args.join(" ");
      const searchResult = (await axios.get(`${apiBase}/ytFullSearch?songName=${encodeURIComponent(keyWord)}`)).data;
      
      if (!searchResult || searchResult.length === 0) {
        api.unsendMessage(searchingMsg.messageID);
        return api.sendMessage(`❌ '${keyWord}' এর জন্য কোনো গান পাওয়া যায়নি।`, threadID, messageID);
      }
      videoID = searchResult[0].id;
      songInfo = searchResult[0];
    }

    // ডাউনলোড লিঙ্ক সংগ্রহ
    const { data } = await axios.get(`${apiBase}/ytDl3?link=${videoID}&format=mp3`);
    
    if (!data.downloadLink) {
      throw new Error("Download link not found");
    }

    // ক্যাশ ডিরেক্টরি তৈরি ও ফাইল পাথ (ইউনিক আইডি সহ)
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const fileName = `audio_${Date.now()}_${threadID}.mp3`;
    const filePath = path.join(cacheDir, fileName);

    // অডিও ডাউনলোড
    const audioRes = await axios.get(data.downloadLink, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(audioRes.data));

    api.unsendMessage(searchingMsg.messageID);

    const bodyMsg = songInfo 
      ? `🎧 Title: ${data.title}\n📺 Channel: ${songInfo.channel.name}\n🎶 Quality: ${data.quality}`
      : `🎧 Title: ${data.title}\n🎶 Quality: ${data.quality}`;

    const sentMsg = await api.sendMessage({
      body: bodyMsg,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

    api.setMessageReaction("✅", sentMsg.messageID);

  } catch (err) {
    console.error(err);
    if (searchingMsg.messageID) api.unsendMessage(searchingMsg.messageID);
    return api.sendMessage("⚠️ গানটি খুঁজে পাওয়া যায়নি বা এটি অনেক বড় (২৫MB এর বেশি)।", threadID, messageID);
  }
};