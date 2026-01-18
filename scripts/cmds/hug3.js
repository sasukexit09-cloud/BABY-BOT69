const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { Jimp } = require("jimp"); // Fix for Jimp.read error

module.exports.config = {
  name: "hug3",
  version: "4.2.0",
  role: 0,
  author: "𝐀𝐘𝐀𝐍 𝐀𝐇𝐌𝐄𝐃𝐙",
  description: "Original position hug frame generator",
  category: "img",
  guide: { en: "{pn} @mention or reply" },
  countDown: 5
};

module.exports.onStart = async function ({ event, api }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;

  let targetID;
  if (type === "message_reply") {
    targetID = messageReply.senderID;
  } else {
    const mention = Object.keys(mentions);
    targetID = mention[0];
  }

  if (!targetID) {
    return api.sendMessage("Please mention 1 person or reply to their message! 🤧", threadID, messageID);
  }

  const cacheDir = path.join(process.cwd(), "cache", "canvas");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  const bgPath = path.join(cacheDir, "hugv2.png");
  const outPath = path.join(cacheDir, `hug_${senderID}_${targetID}.png`);

  try {
    api.setMessageReaction("⌛", messageID, () => {}, true);

    // ১. ব্যাকগ্রাউন্ড ইমেজ ডাউনলোড
    if (!fs.existsSync(bgPath)) {
      const imgURL = "https://i.ibb.co/zRdZJzG/1626342271-28-kartinkin-com-p-anime-obnimashki-v-posteli-anime-krasivo-30.jpg";
      const res = await axios.get(imgURL, { responseType: "arraybuffer" });
      fs.writeFileSync(bgPath, Buffer.from(res.data));
    }

    // ২. প্রোফাইল পিকচার ডাউনলোড ও গোল করার ফাংশন
    const getAvt = async (uid) => {
      const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(url, { responseType: "arraybuffer" });
      const img = await Jimp.read(Buffer.from(res.data));
      img.circle();
      return img;
    };

    // ৩. সব ইমেজ রিড করা
    const [bg, avtOne, avtTwo] = await Promise.all([
      Jimp.read(bgPath),
      getAvt(senderID),
      getAvt(targetID)
    ]);

    // ৪. আপনার অরিজিনাল পজিশন অনুযায়ী বসানো
    // বাম পাশের পিকচার (One) - (X: 370, Y: 40)
    avtOne.resize({ w: 100, h: 100 });
    bg.composite(avtOne, 370, 40); 

    // ডান পাশের পিকচার (Two) - (X: 330, Y: 150)
    avtTwo.resize({ w: 100, h: 100 });
    bg.composite(avtTwo, 330, 150);

    // ৫. সেভ করা
    await bg.write(outPath);

    const captions = [
      "ভালোবাসা যদি কোনো অনুভূতি হয়, তাহলে তোমার প্রতি আমার অনুভূতি পৃথিবীর সেরা অনুভূতি!🌺",
      "তুমি আমার জীবনের সেরা অধ্যায়, যেই অধ্যায় বারবার পড়তে ইচ্ছে করে!😘",
      "তোমাকে চেয়েছিলাম, আর তোমাকেই চাই!🖤",
      "আমার কাছে তোমাকে ভালোবাসার কোনো সংজ্ঞা নেই!😍"
    ];
    const caption = captions[Math.floor(Math.random() * captions.length)];

    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage({
      body: caption,
      attachment: fs.createReadStream(outPath)
    }, threadID, () => {
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    }, messageID);

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ এরর: ${error.message}`, threadID, messageID);
  }
};