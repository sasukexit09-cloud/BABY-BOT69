const axios = require("axios");

module.exports = {
  config: {
    name: "alya",
    aliases: ["elisa"],
    version: "3.0.0",
    author: "Maya",
    countDown: 5,
    role: 0,
    shortDescription: "Send a random Alya/Elisa image with fancy text",
    longDescription: "Sends a random cute Alya/Elisa picture with a beautiful fancy text before showing the image.",
    category: "fun",
    guide: "{p}alya বা {p}elisa"
  },

  onStart: async function ({ api, event }) {
    try {
      const images = [
        "https://files.catbox.moe/b6c6na.jpg",
        "https://files.catbox.moe/5x459g.jpeg",
        "https://files.catbox.moe/em2rgi.jpg",
        "https://files.catbox.moe/2ko29a.jpeg",
        "https://files.catbox.moe/fc8z2o.jpg",
        "https://files.catbox.moe/9ge6nf.jpg",
        "https://files.catbox.moe/xtsu3n.jpeg",
        "https://files.catbox.moe/mhr708.jpeg",
        "https://files.catbox.moe/722rzw.jpeg",
        "https://files.catbox.moe/scrpnr.jpeg",
        "https://files.catbox.moe/6taivl.jpeg",
        "https://files.catbox.moe/9zkvli.jpeg",
        "https://files.catbox.moe/tnodbj.jpeg",
        "https://files.catbox.moe/bnumsy.jpeg",
        "https://files.catbox.moe/kmhida.jpeg",
        "https://files.catbox.moe/yik2rl.jpeg",
        "https://files.catbox.moe/21biuu.jpeg",
        "https://files.catbox.moe/s5se09.jpeg",
        "https://files.catbox.moe/6fgfk7.jpeg",
        "https://files.catbox.moe/tf1zs1.jpeg",
        "https://files.catbox.moe/7crik2.jpeg",
        "https://files.catbox.moe/m09hb6.jpeg",
        "https://files.catbox.moe/w0z5vt.jpeg",
        "https://files.catbox.moe/tmk24c.jpeg",
        "https://files.catbox.moe/xj0d54.jpeg",
        "https://files.catbox.moe/jvq9rw.jpeg",
        "https://files.catbox.moe/a0evzu.jpeg",
        "https://files.catbox.moe/rsevpa.jpeg",
        "https://files.catbox.moe/yboen1.jpeg",
        "https://files.catbox.moe/zu2wnc.jpeg",
        "https://files.catbox.moe/t2qm8n.jpeg",
        "https://files.catbox.moe/z8wlbv.jpeg",
        "https://files.catbox.moe/az6u1h.jpeg",
        "https://files.catbox.moe/7k60jb.jpeg",
        "https://files.catbox.moe/unm13h.jpeg",
        "https://files.catbox.moe/diapuw.jpeg",
        "https://files.catbox.moe/pasw8k.jpeg",
        "https://files.catbox.moe/e9dxp1.jpeg",
        "https://files.catbox.moe/081wjp.jpeg"
      ];

      const randomImage = images[Math.floor(Math.random() * images.length)];
      const fancyText = "✨ 𝓐𝓵𝔂𝓪 𝓲𝓼 𝓬𝓾𝓽𝓮 💖 𝓐 𝓹𝓮𝓻𝓯𝓮𝓬𝓽 𝓿𝓲𝓼𝓾𝓪𝓵 ✨";

      // Send fancy text first
      api.sendMessage(fancyText, event.threadID, async (err, info) => {
        if (err) return api.sendMessage("❌ কিছু ভুল হয়েছে, আবার চেষ্টা করো।", event.threadID);

        // Wait a moment before sending image
        setTimeout(async () => {
          const img = await axios.get(randomImage, { responseType: "stream" });

          api.sendMessage(
            { attachment: img.data },
            event.threadID,
            () => {
              // Delete fancy text message after image is sent
              api.unsendMessage(info.messageID);
            }
          );
        }, 1200);
      });
    } catch (error) {
      console.error(error);
      api.sendMessage("❌ কিছু ভুল হয়েছে, আবার চেষ্টা করো।", event.threadID);
    }
  }
};
