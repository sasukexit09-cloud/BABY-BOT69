const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "waguri",
    aliases: ["kauroko"],
    version: "2.0.0",
    author: "Maya",
    countDown: 5,
    role: 0,
    shortDescription: "Send a random waguri/kauroko image",
    longDescription: "Random waguri/kauroko image (VIP only)",
    category: "fun",
    guide: {
      en: "{pn} / {pn} kauroko",
    },
  },

  onStart: async function ({ message, event }) {
    const uid = event.senderID;

    // 🔐 VIP CHECK
    if (!global.vipUsers || !global.vipUsers.includes(uid)) {
      return message.reply(
        "🥺💔 Baby, এই কমান্ডটা শুধু VIP user দের জন্য\n✨ আগে VIP নাও, তারপর ব্যবহার করো 💋"
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
      "https://files.catbox.moe/tb0nii.jpeg",
      "https://files.catbox.moe/sv6tuk.jpeg",
      "https://files.catbox.moe/3ca3m7.jpeg",
      "https://files.catbox.moe/jsihgg.jpg",
      "https://files.catbox.moe/zfr556.jpeg",
      "https://files.catbox.moe/9x1dp3.jpeg",
      "https://files.catbox.moe/btfq45.jpeg",
      "https://files.catbox.moe/2ixkpf.jpeg",
      "https://files.catbox.moe/3v69qk.jpeg",
      "https://files.catbox.moe/anid36.jpeg",
      "https://files.catbox.moe/2nv0my.jpeg",
      "https://files.catbox.moe/xocxsw.jpeg",
      "https://files.catbox.moe/0a62sr.jpeg",
      "https://files.catbox.moe/ktvx58.jpeg",
      "https://files.catbox.moe/ni62p5.jpeg",
      "https://files.catbox.moe/iw0uua.jpg",
      "https://files.catbox.moe/pml00k.jpg",
      "https://files.catbox.moe/0iftlu.jpg",
      "https://files.catbox.moe/y69dfc.jpeg",
      "https://files.catbox.moe/wyb387.jpeg",
      "https://files.catbox.moe/styo4d.jpeg",
      "https://files.catbox.moe/cw7t8k.jpeg",
      "https://files.catbox.moe/knks85.jpeg",
      "https://files.catbox.moe/qmwfjm.jpeg",
      "https://files.catbox.moe/ff2i0d.jpeg",
      "https://files.catbox.moe/bfgs4v.jpg",
      "https://files.catbox.moe/tfgzlp.jpeg",
      "https://files.catbox.moe/yts0bq.jpeg",
    ];

    const fancyTexts = [
      "🌸 𝐖𝐚𝐠𝐮𝐫𝐢 💫",
      "💖 Cute vibes only 💕",
      "✨ Kauroko style 💫",
      "🌷 Soft & sweet mood 💞",
    ];

    const img = IMAGES[Math.floor(Math.random() * IMAGES.length)];
    const caption = fancyTexts[Math.floor(Math.random() * fancyTexts.length)];
    const filePath = path.join(__dirname, `waguri_${Date.now()}.jpg`);

    try {
      const res = await axios.get(img, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, res.data);

      await message.reply({
        body: caption,
        attachment: fs.createReadStream(filePath),
      });
    } catch (e) {
      console.error(e);
      message.reply("❌ কিছু ভুল হয়েছে, আবার চেষ্টা করো!");
    } finally {
      fs.existsSync(filePath) && fs.unlinkSync(filePath);
    }
  },
};
