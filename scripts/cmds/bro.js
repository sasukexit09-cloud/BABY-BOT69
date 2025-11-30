const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports.config = {
  name: "bro",
  version: "7.3.2",
  hasPermssion: 0,
  credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
  description: "Get Pair From Mention",
  commandCategory: "png",
  usages: "[@mention]",
  cooldowns: 5,
  dependencies: { axios: "", "fs-extra": "", path: "", jimp: "" }
};

// Preload template image on start
module.exports.onStart = async () => {
  const dirMaterial = path.join(__dirname, "cache", "canvas");
  const templatePath = path.join(dirMaterial, "sis.png");

  if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
  if (!fs.existsSync(templatePath)) {
    const { downloadFile } = global.utils;
    await downloadFile("https://i.imgur.com/n2FGJFe.jpg", templatePath);
  }
};

// Helper: Make circular avatar
async function circle(imagePath) {
  const image = await jimp.read(imagePath);
  image.circle();
  return await image.getBufferAsync("image/png");
}

// Helper: Create combined image
async function makeImage({ one, two }) {
  const dir = path.join(__dirname, "cache", "canvas");
  const template = await jimp.read(path.join(dir, "sis.png"));

  const pathImg = path.join(dir, `bro_${one}_${two}.png`);
  const avatarOnePath = path.join(dir, `avt_${one}.png`);
  const avatarTwoPath = path.join(dir, `avt_${two}.png`);

  // Download avatars
  const [avatarOne, avatarTwo] = await Promise.all([
    axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
    axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })
  ]);

  fs.writeFileSync(avatarOnePath, Buffer.from(avatarOne.data));
  fs.writeFileSync(avatarTwoPath, Buffer.from(avatarTwo.data));

  // Apply circle mask
  const [circleOne, circleTwo] = await Promise.all([
    jimp.read(await circle(avatarOnePath)),
    jimp.read(await circle(avatarTwoPath))
  ]);

  template.composite(circleOne.resize(191, 191), 93, 111)
          .composite(circleTwo.resize(190, 190), 434, 107);

  const buffer = await template.getBufferAsync("image/png");
  fs.writeFileSync(pathImg, buffer);

  // Cleanup avatars
  fs.unlinkSync(avatarOnePath);
  fs.unlinkSync(avatarTwoPath);

  return pathImg;
}

// Command run
module.exports.run = async ({ event, api }) => {
  const mention = Object.keys(event.mentions);
  if (!mention[0]) return api.sendMessage("আপনার ভাইকে মেনশন করুন ❤️‍🩹😙", event.threadID, event.messageID);

  const one = event.senderID;
  const two = mention[0];

  try {
    const imagePath = await makeImage({ one, two });
    api.sendMessage({
      body: `🌸•❖•━━━━━━━━━•❖•🌸
✧•❁ 𝐓𝐞𝐫𝐚 𝐁𝐚𝐢 ❁•✧
🌸•❖•━━━━━━━━━•❖•🌸

🤝 বন্ধুত্বের বাঁধন আজ আরও শক্ত হলো 💖
🫱 এই নে! রাখ তোর ভাইরে ❤️
👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 🩷
🌸•❖•━━━━━━━━━━•❖•🌸`,
      attachment: fs.createReadStream(imagePath)
    }, event.threadID, () => fs.unlinkSync(imagePath), event.messageID);
  } catch (error) {
    console.error("Error creating BRO image:", error);
    api.sendMessage("❌ কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।", event.threadID, event.messageID);
  }
};
