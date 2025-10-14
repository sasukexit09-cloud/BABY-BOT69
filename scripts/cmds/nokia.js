const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "nokia",
    version: "1.5",
    author: "TAREK x ASIF",
    countDown: 5,
    role: 0,
    shortDescription: "Show profile picture inside Nokia frame",
    longDescription: "Display sender, mentioned, or replied user's profile inside a Nokia phone frame with bottom corners clipped",
    category: "fun"
  },

  onStart: async function ({ api, event }) {
    try {
      let uid;
      const mention = Object.keys(event.mentions || {});

      if (mention.length > 0) {
        uid = mention[0];
      } else if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
      } else {
        uid = event.senderID;
      }

      const baseImage = await loadImage("https://files.catbox.moe/nxbzjx.jpeg");
      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatar = await loadImage(avatarURL);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0);

      // Nokia screen position
      const avatarX = 32;
      const avatarY = 125;
      const avatarWidth = 155;
      const avatarHeight = 115;

      // Clip bottom two corners
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(avatarX, avatarY); // Top-left
      ctx.lineTo(avatarX + avatarWidth, avatarY); // Top-right
      ctx.lineTo(avatarX + avatarWidth, avatarY + avatarHeight - 20); // Bottom-right before curve
      ctx.arcTo(
        avatarX + avatarWidth,
        avatarY + avatarHeight,
        avatarX + avatarWidth - 20,
        avatarY + avatarHeight,
        20
      ); // Bottom-right curve

      ctx.lineTo(avatarX + 20, avatarY + avatarHeight); // Bottom border before left corner
      ctx.arcTo(
        avatarX,
        avatarY + avatarHeight,
        avatarX,
        avatarY + avatarHeight - 20,
        20
      ); // Bottom-left curve

      ctx.lineTo(avatarX, avatarY); // Back to top-left
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(avatar, avatarX, avatarY, avatarWidth, avatarHeight);
      ctx.restore();

      const outputPath = path.join(__dirname, `nokia_${uid}.png`);
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        api.sendMessage(
          {
            attachment: fs.createReadStream(outputPath)
          },
          event.threadID,
          () => fs.unlinkSync(outputPath)
        );
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Error while generating image.", event.threadID);
    }
  }
};
