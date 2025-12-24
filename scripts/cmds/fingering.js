const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "fingering",
    aliases: ["fg"],
    version: "1.3",
    author: "Jun",
    countDown: 5,
    role: 0,
    shortDescription: "fingering image",
    longDescription: "18+ fingering image",
    category: "18+",
    guide: "{pn}"
  },

  onLoad: async function () {
    const pathImg = path.resolve(__dirname, "fingeringv2.png");
    if (!fs.existsSync(pathImg)) {
      try {
        const response = await axios.get(
          "https://drive.google.com/uc?export=download&id=1HEIUVZXrUgxbJOCkr7h6c9_eeyGgzr3V",
          { responseType: "arraybuffer" }
        );
        fs.writeFileSync(pathImg, response.data);
        console.log("✅ fingeringv2.png downloaded successfully");
      } catch (e) {
        console.error("❌ Failed to download fingeringv2.png", e.message);
      }
    }
  },

  circle: async function (image) {
    const img = await jimp.read(image);
    img.circle();
    return img.getBufferAsync("image/png");
  },

  makeImage: async function ({ one, two }) {
    const templatePath = path.resolve(__dirname, "fingeringv2.png");
    if (!fs.existsSync(templatePath)) throw new Error("Template missing");

    const pathImg = path.resolve(__dirname, `fingering_${one}_${two}.png`);
    const avatarOne = path.resolve(__dirname, `avt_${one}.png`);
    const avatarTwo = path.resolve(__dirname, `avt_${two}.png`);

    const downloadAvatar = async (uid, savePath) => {
      const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(url, { responseType: "arraybuffer" });
      await fs.writeFile(savePath, res.data);
    };

    await downloadAvatar(one, avatarOne);
    await downloadAvatar(two, avatarTwo);

    const circleOne = await jimp.read(await this.circle(avatarOne));
    const circleTwo = await jimp.read(await this.circle(avatarTwo));

    const baseImg = await jimp.read(templatePath);
    baseImg.composite(circleOne.resize(70, 70), 180, 110);
    baseImg.composite(circleTwo.resize(70, 70), 120, 140);

    await baseImg.writeAsync(pathImg);

    await fs.unlink(avatarOne);
    await fs.unlink(avatarTwo);

    return pathImg;
  },

  onStart: async function ({ event, api }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;

    const mentionIDs = Object.keys(mentions || {});
    const targetID = messageReply?.senderID || mentionIDs[0];
    if (!targetID) return api.sendMessage("⚠️ Please mention or reply to 1 person.", threadID, messageID);

    this.makeImage({ one: senderID, two: targetID })
      .then(filePath => api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID, () => fs.unlinkSync(filePath), messageID))
      .catch(err => api.sendMessage("❌ Error: " + err.message, threadID, messageID));
  }
};
