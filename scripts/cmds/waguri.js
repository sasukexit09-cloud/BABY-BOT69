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
    longDescription: "Random cute or aesthetic image with fancy caption",
    category: "fun",
    guide: {
      en: "{pn} / {pn} kauroko",
    },
  },

  onStart: async function ({ message }) {
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
      "https://files.catbox.moe/73a9w2.tmp",
      "https://files.catbox.moe/ovebkl.jpeg",
      "https://files.catbox.moe/8aaefb.jpeg",
    ];

    const fancyTexts = [
      "🌸 𝐖𝐚𝐠𝐮𝐫𝐢 💫",
      "💖 𝓒𝓾𝓽𝓮 𝓿𝓲𝓫𝓮𝓼 𝓸𝓷𝓵𝔂 💕",
      "🩵 𝙅𝙪𝙨𝙩 𝙖 𝙙𝙧𝙤𝙥 𝙤𝙛 𝙗𝙚𝙖𝙪𝙩𝙮 🌷",
      "✨ 𝐊𝐚𝐮𝐫𝐨𝐤𝐨 𝐬𝐭𝐲𝐥𝐞 𝐚𝐜𝐭𝐢𝐯𝐚𝐭𝐞𝐝 💫",
      "💘 𝓐𝓷𝓸𝓽𝓱𝓮𝓻 𝓭𝓸𝓼𝓮 𝓸𝓯 𝓬𝓾𝓽𝓮𝓷𝓮𝓼𝓼 🩷",
      "🌹 𝐁𝐞𝐚𝐮𝐭𝐲 𝐛𝐞𝐠𝐢𝐧𝐬 𝐰𝐢𝐭𝐡 𝐚 𝐬𝐦𝐢𝐥𝐞 💫",
      "🌷 𝙎𝙬𝙚𝙚𝙩 𝙖𝙨 𝙥𝙚𝙩𝙖𝙡𝙨, 𝙨𝙤𝙛𝙩 𝙖𝙨 𝙙𝙧𝙚𝙖𝙢𝙨 💞",
    ];

    const randomImg = IMAGES[Math.floor(Math.random() * IMAGES.length)];
    const caption = fancyTexts[Math.floor(Math.random() * fancyTexts.length)];
    const filePath = path.join(__dirname, `waguri_${Date.now()}.jpg`);

    try {
      const res = await axios.get(randomImg, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));
      await message.reply({
        body: caption,
        attachment: fs.createReadStream(filePath),
      });
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(err);
      message.reply("❌ কিছু ভুল হয়েছে, আবার চেষ্টা করো!");
    }
  },
};
