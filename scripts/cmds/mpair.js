const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Jimp = require('jimp');

module.exports.config = {
  name: "mpair",
  version: "1.6",
  description: "Merge sender and mentioned user's profile pictures onto a romantic template",
  credits: "AYAN Modified by Maya",
  author: "AYAN",
};

module.exports.onStart = async function ({ api, event }) {
  try {
    const senderID = event.senderID;
    let targetID = Object.keys(event.mentions || {})[0] || (event.messageReply && event.messageReply.senderID);

    if (!targetID) {
      return api.sendMessage(
        '💞 দয়া করে কাউকে mention করো বা কারো message reply করে `mpair` লিখে পাঠাও!',
        event.threadID,
        event.messageID
      );
    }

    const users = await api.getUserInfo([senderID, targetID]);
    const senderName = users[senderID]?.name || "Unknown";
    const targetName = users[targetID]?.name || "Mystery";

    // 🎨 Template image
    const TEMPLATE_URL = 'https://i.postimg.cc/3rD0rQPT/love-template.png'; // safer than drive
    const POSITIONS = {
      left: { x: 90, y: 60, w: 140, h: 140 },
      right: { x: 500, y: 200, w: 140, h: 140 }
    };

    async function downloadImageBuffer(url) {
      const res = await axios.get(url, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' } });
      return Buffer.from(res.data);
    }

    async function fetchProfilePic(uid) {
      try {
        const url = `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(url, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' } });
        return Buffer.from(res.data);
      } catch {
        const placeholder = await new Jimp(512, 512, 0xddddddff);
        return await placeholder.getBufferAsync(Jimp.MIME_PNG);
      }
    }

    const [templateBuf, bufSender, bufTarget] = await Promise.all([
      downloadImageBuffer(TEMPLATE_URL),
      fetchProfilePic(senderID),
      fetchProfilePic(targetID)
    ]);

    const template = await Jimp.read(templateBuf);
    const imgSender = await Jimp.read(bufSender);
    const imgTarget = await Jimp.read(bufTarget);

    imgSender.cover(POSITIONS.left.w, POSITIONS.left.h).circle();
    imgTarget.cover(POSITIONS.right.w, POSITIONS.right.h).circle();

    template.composite(imgSender, POSITIONS.left.x, POSITIONS.left.y);
    template.composite(imgTarget, POSITIONS.right.x, POSITIONS.right.y);

    const fontBig = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

    template.print(fontBig, 220, 20, { text: "💞 Perfect Couple 💞", alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, 400);
    template.print(fontSmall, POSITIONS.left.x - 10, POSITIONS.left.y + POSITIONS.left.h + 10, senderName);
    template.print(fontSmall, POSITIONS.right.x - 10, POSITIONS.right.y + POSITIONS.right.h + 10, targetName);

    const percent = Math.floor(Math.random() * 50) + 50;
    template.print(fontSmall, 310, 430, `💘 Compatibility: ${percent}%`);

    const outDir = path.join(__dirname, '..', 'cache');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `mpair_${Date.now()}.png`);
    await template.writeAsync(outPath);

    await api.sendMessage({
      body: `🎀 Perfect Couple! 🎀\n❤️ ${senderName}\n🎀 ${targetName}\n🔥 Compatibility: ${percent}%`,
      attachment: fs.createReadStream(outPath)
    }, event.threadID, () => fs.unlinkSync(outPath), event.messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage('⚠️ কিছু একটা ভুল হয়েছে: ' + err.message, event.threadID, event.messageID);
  }
};
