const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "married",
    aliases: ["married"],
    version: "1.1",
    author: "kivv",
    countDown: 5,
    role: 0,
    shortDescription: "Get a wife",
    longDescription: "",
    category: "married",
    guide: "{@mention}"
  },

  onLoad: async function () {
    const { existsSync, mkdirSync } = fs;
    const __root = path.resolve(__dirname, "cache", "canvas");
    const pathImg = path.join(__root, "marriedv5.png");

    if (!existsSync(__root)) mkdirSync(__root, { recursive: true });
    if (!existsSync(pathImg)) {
      const res = await axios.get("https://i.ibb.co/mhxtgwm/49be174dafdc259030f70b1c57fa1c13.jpg", { responseType: "arraybuffer" });
      await fs.writeFile(pathImg, res.data);
    }
  },

  circle: async function (image) {
    const img = await jimp.read(image);
    img.circle();
    return img.getBufferAsync("image/png");
  },

  makeImage: async function ({ one, two }) {
    const __root = path.resolve(__dirname, "cache", "canvas");
    const template = path.join(__root, "marriedv5.png");
    const pathImg = path.join(__root, `married_${one}_${two}.png`);

    const avatarOnePath = path.join(__root, `avt_${one}.png`);
    const avatarTwoPath = path.join(__root, `avt_${two}.png`);

    // Download avatars (high-res)
    const avatarOneData = await axios.get(`https://graph.facebook.com/${one}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' });
    await fs.writeFile(avatarOnePath, avatarOneData.data);

    const avatarTwoData = await axios.get(`https://graph.facebook.com/${two}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' });
    await fs.writeFile(avatarTwoPath, avatarTwoData.data);

    const baseImg = await jimp.read(template);
    const circleOne = await jimp.read(await this.circle(avatarOnePath));
    const circleTwo = await jimp.read(await this.circle(avatarTwoPath));

    baseImg.composite(circleOne.resize(130, 130), 300, 150)
           .composite(circleTwo.resize(130, 130), 170, 230);

    await baseImg.writeAsync(pathImg);

    // Cleanup avatars
    await fs.unlink(avatarOnePath);
    await fs.unlink(avatarTwoPath);

    return pathImg;
  },

  onStart: async function ({ event, api }) {
    const { threadID, messageID, senderID, mentions } = event;
    const mentionIDs = Object.keys(mentions || {});

    if (!mentionIDs[0]) return api.sendMessage("⚠️ Please mention 1 person.", threadID, messageID);

    const one = senderID;
    const two = mentionIDs[0];

    this.makeImage({ one, two })
      .then(pathImg => api.sendMessage({ body: "", attachment: fs.createReadStream(pathImg) }, threadID, () => fs.unlinkSync(pathImg), messageID))
      .catch(err => api.sendMessage("❌ Error: " + err.message, threadID, messageID));
  }
};
