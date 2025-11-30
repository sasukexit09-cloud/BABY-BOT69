const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Jimp = require('jimp');

module.exports.onStart = {
  config: {
    name: "mpair",
    version: "1.5",
    description: "Merge sender and mentioned user's profile pictures onto a romantic template",
    credits: "Tarek Modified by Imran",
    author: "Tarek",
  },

  onStart: async function ({ api, event }) {
    try {
      const senderID = event.senderID;
      let targetID = null;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (event.messageReply && event.messageReply.senderID) {
        targetID = event.messageReply.senderID;
      }

      if (!targetID) {
        return api.sendMessage(
          'দয়া করে কাউকে mention করো বা কারো message reply করে `mpair` লিখে পাঠাও 💞',
          event.threadID,
          event.messageID
        );
      }

      const senderName = (await api.getUserInfo(senderID))[senderID].name;
      const targetName = (await api.getUserInfo(targetID))[targetID].name;

      // 🎨 Template Image
      const TEMPLATE_URL = 'https://drive.google.com/uc?export=download&id=1W051qCSs33UNB0aCTw9ozW0LOGzjLvZn';

      const POSITIONS = {
        left: { x: 90, y: 60, w: 140, h: 140 },
        right: { x: 500, y: 200, w: 140, h: 140 }
      };

      // Helper: download template
      async function downloadImageBuffer(url) {
        const res = await axios.get(url, { responseType: 'arraybuffer', maxRedirects: 5 });
        return Buffer.from(res.data, 'binary');
      }

      // Helper: fetch profile picture
      async function fetchProfilePic(uid) {
        try {
          const picUrl = `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
          const response = await axios.get(picUrl, { responseType: 'arraybuffer', maxRedirects: 5 });
          return Buffer.from(response.data, 'binary');
        } catch (err) {
          console.error(`Failed to fetch profile for ${uid}: ${err.message}`);
          const placeholder = await new Jimp(512, 512, 0xddddddff);
          return await placeholder.getBufferAsync(Jimp.MIME_PNG);
        }
      }

      // Load template
      const templateBuffer = await downloadImageBuffer(TEMPLATE_URL);
      const template = await Jimp.read(templateBuffer);

      // Load both profile pictures
      const [bufSender, bufTarget] = await Promise.all([
        fetchProfilePic(senderID),
        fetchProfilePic(targetID)
      ]);

      const imgSender = await Jimp.read(bufSender);
      const imgTarget = await Jimp.read(bufTarget);

      imgSender.cover(POSITIONS.left.w, POSITIONS.left.h);
      imgTarget.cover(POSITIONS.right.w, POSITIONS.right.h);

      // Circular mask
      function createCircularMask(w, h) {
        const mask = new Jimp(w, h, 0x00000000);
        const centerX = w / 2, centerY = h / 2, radius = Math.min(w, h) / 2;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const dx = x - centerX, dy = y - centerY;
            if (dx * dx + dy * dy <= radius * radius) mask.setPixelColor(0xffffffff, x, y);
          }
        }
        return mask;
      }

      imgSender.mask(createCircularMask(POSITIONS.left.w, POSITIONS.left.h), 0, 0);
      imgTarget.mask(createCircularMask(POSITIONS.right.w, POSITIONS.right.h), 0, 0);

      // Composite images
      template.composite(imgSender, POSITIONS.left.x, POSITIONS.left.y);
      template.composite(imgTarget, POSITIONS.right.x, POSITIONS.right.y);

      // ✨ Texts
      const fontBig = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
      const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
      const fontPink = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

      // Main title
      template.print(fontBig, 220, 20, { text: "💞 Perfect Couple 💞", alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, 400);

      // Sender & Target name
      template.print(fontSmall, POSITIONS.left.x - 10, POSITIONS.left.y + POSITIONS.left.h + 10, senderName);
      template.print(fontSmall, POSITIONS.right.x - 10, POSITIONS.right.y + POSITIONS.right.h + 10, targetName);

      // Random % for fun 😁
      const percent = Math.floor(Math.random() * 50) + 50; // 50–100%
      template.print(fontSmall, 310, 430, `💘 Peasant Rate: ${percent}%`);

      const outDir = path.join(__dirname, '..', 'cache');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const outPath = path.join(outDir, `mpair_${Date.now()}.png`);
      await template.writeAsync(outPath);

      await api.sendMessage({
        body: `🎀 Perfect Couple here 🎀!\n❤️ ${senderName} \n🎀 ${targetName}\n🔥 Compatibility: ${percent}%`,
        attachment: fs.createReadStream(outPath)
      }, event.threadID, () => fs.unlinkSync(outPath), event.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage('⚠️ কিছু একটা ভুল হয়েছে: ' + err.message, event.threadID, event.messageID);
    }
  }
};
