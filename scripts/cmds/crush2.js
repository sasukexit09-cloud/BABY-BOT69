module.exports.config = {
  name: "crush2",
  version: "7.3.2",
  hasPermssion: 0,
  credits: "𝐂𝐘𝐁𝐄𝐑 ☢️ - Modified by Maya",
  description: "Get Pair From Mention with romantic template",
  commandCategory: "love",
  usages: "[@mention]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "jimp": ""
  }
};

const fs = global.nodemodule["fs-extra"];
const path = global.nodemodule["path"];
const axios = global.nodemodule["axios"];
const jimp = global.nodemodule["jimp"];

const crushCaptions = [
  "প্রেমে যদি অপূর্ণতাই সুন্দর হয়, তবে পূর্ণতার সৌন্দর্য কোথায়?❤️",
  "যদি বৃষ্টি হতাম… তোমার দৃষ্টি ছুঁয়ে দিতাম! চোখে জমা বিষাদটুকু এক নিমেষে ধুয়ে দিতাম🤗",
  "তোমার ভালোবাসার প্রতিচ্ছবি দেখেছি বারে বার💖",
  "তোমার সাথে একটি দিন হতে পারে ভালো, কিন্তু তোমার সাথে সবগুলি দিন হতে পারে ভালোবাসা🌸",
  "এক বছর নয়, কয়েক জন্ম শুধু তোমার প্রেমে পরতে পরতে চলে যাবে😍",
  "কেমন করে এই মনটা দেব তোমাকে… বেসেছি যাকে ভালো আমি, মন দিয়েছি তাকে🫶",
  "পিছু পিছু ঘুরলে কি আর প্রেম হয়ে যায়… কাছে এসে বাসলে ভালো, মন পাওয়া যায়❤️‍🩹",
  "তুমি থাকলে নিজেকে এমন সুখী মনে হয়, যেনো আমার জীবনে কোনো দুঃখই নেই😊",
  "তোমার হাতটা ধরতে পারলে মনে হয় পুরো পৃথিবীটা ধরে আছি🥰",
  "তোমার প্রতি ভালো লাগা যেনো প্রতিনিয়ত বেড়েই চলছে😘"
];

module.exports.onStart = async () => {
  const dir = path.resolve(__dirname, "cache", "canvas");
  const bgPath = path.join(dir, "crush.png");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(bgPath)) {
    const { downloadFile } = global.utils;
    await downloadFile("https://i.imgur.com/PlVBaM1.jpg", bgPath);
  }
};

async function circle(imagePath) {
  const img = await jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync(jimp.MIME_PNG);
}

async function makeImage({ one, two }) {
  const dir = path.resolve(__dirname, "cache", "canvas");
  const baseImg = await jimp.read(path.join(dir, "crush.png"));
  const outPath = path.join(dir, `crush_${one}_${two}.png`);

  const avatarOnePath = path.join(dir, `avt_${one}.png`);
  const avatarTwoPath = path.join(dir, `avt_${two}.png`);

  // Fetch avatars
  async function fetchAvatar(uid, savePath) {
    try {
      const res = await axios.get(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer", headers: { "User-Agent": "Mozilla/5.0" } });
      fs.writeFileSync(savePath, res.data);
    } catch {
      const placeholder = await new jimp(512, 512, 0xddddddff);
      await placeholder.writeAsync(savePath);
    }
  }

  await Promise.all([
    fetchAvatar(one, avatarOnePath),
    fetchAvatar(two, avatarTwoPath)
  ]);

  const avatarOne = await jimp.read(await circle(avatarOnePath));
  const avatarTwo = await jimp.read(await circle(avatarTwoPath));

  baseImg.composite(avatarOne.resize(191, 191), 93, 111)
         .composite(avatarTwo.resize(190, 190), 434, 107);

  await baseImg.writeAsync(outPath);

  // Cleanup temp avatars
  fs.unlinkSync(avatarOnePath);
  fs.unlinkSync(avatarTwoPath);

  return outPath;
}

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions || {});

  if (!mention[0]) return api.sendMessage("একজনকে মেনশন করো!", threadID, messageID);

  const one = senderID, two = mention[0];
  const caption = crushCaptions[Math.floor(Math.random() * crushCaptions.length)];

  try {
    const imagePath = await makeImage({ one, two });
    await api.sendMessage({
      body: `✧•❁𝐂𝐫𝐮𝐬𝐡❁•✧\n\n${caption}`,
      attachment: fs.createReadStream(imagePath)
    }, threadID, () => fs.unlinkSync(imagePath), messageID);
  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Image generate করতে সমস্যা হয়েছে!", threadID, messageID);
  }
};
