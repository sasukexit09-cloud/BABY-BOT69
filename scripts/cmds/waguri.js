const fs = require("fs/promises");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "waguri",
    aliases: ["kauroko"],
    version: "2.1.0",
    author: "Maya",
    countDown: 5,
    role: 0,
    shortDescription: "VIP only waguri image",
    longDescription: "Random waguri/kauroko image (VIP only)",
    category: "fun",
    guide: {
      en: "{pn} (VIP only)",
    },
  },

  onStart: async function ({ message, event }) {
    const uid = event.senderID;

    // 🔐 VIP CHECK (edit according to your system)
    if (!global.vipUsers || !global.vipUsers.includes(uid)) {
      return message.reply(
        "🥺💔 Baby, এই কমান্ডটা শুধু VIP user দের জন্য\n✨ আগে VIP নাও, তারপর waguri ব্যবহার করো 💋"
      );
    }

    const IMAGES = [
      "https://files.catbox.moe/5mnf27.jpg",
      "https://files.catbox.moe/40v458.jpeg",
      "https://files.catbox.moe/ockeq4.jpeg",
      "https://files.catbox.moe/uzozad.jpeg",
      "https://files.catbox.moe/y9oj9z.jpeg",
      "https://files.catbox.moe/janubw.jpeg",
      "https://files.catbox.moe/otf62s.jpg",
      "https://files.catbox.moe/jn39yv.jpg",
      "https://files.catbox.moe/7o5xgz.jpeg",
      "https://files.catbox.moe/z6vg2f.jpeg",
    ];

    const fancyTexts = [
      "🌸 𝐖𝐚𝐠𝐮𝐫𝐢 💫",
      "💖 𝓒𝓾𝓽𝓮 𝓿𝓲𝓫𝓮𝓼 𝓸𝓷𝓵𝔂 💕",
      "✨ 𝐊𝐚𝐮𝐫𝐨𝐤𝐨 𝐬𝐭𝐲𝐥𝐞 💫",
      "🌷 Sweet & Soft vibes 💞",
    ];

    const imageUrl = IMAGES[Math.floor(Math.random() * IMAGES.length)];
    const caption = fancyTexts[Math.floor(Math.random() * fancyTexts.length)];
    const filePath = path.join(__dirname, `waguri_${Date.now()}.jpg`);

    try {
      const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
      await fs.writeFile(filePath, res.data);

      await message.reply({
        body: caption,
        attachment: require("fs").createReadStream(filePath),
      });
    } catch (e) {
      console.error(e);
      message.reply("❌ কিছু ভুল হয়েছে, আবার চেষ্টা করো!");
    } finally {
      fs.unlink(filePath).catch(() => {});
    }
  },
};
