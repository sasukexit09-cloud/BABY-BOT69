const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

let lastPlayed = -1;

module.exports = {
  config: {
    name: "gan2",
    version: "1.0.1",
    author: "Shahadat Islam & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Play random song from list" },
    category: "music",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    const songLinks = [
      "https://drive.google.com/uc?export=download&id=1X_J00k_go_u3MKqKwvZOcypQ-dL6DMAm",
      "https://drive.google.com/uc?export=download&id=1nLq8wKxcxK6nb-8SmJ1nPxNHx9Fzabr8",
      "https://drive.google.com/uc?export=download&id=1w972wKW72haSYHhcIZ_CIpRRv0UAf5TS",
      "https://drive.google.com/uc?export=download&id=1KLAtG03-O7GObVSo7YhkUd84tSTXQOL7",
      "https://drive.google.com/uc?export=download&id=1a3qcxjTi6W6wL4vItVY-SZ7aRpJISpLC",
      "https://drive.google.com/uc?export=download&id=1R2thfTrK3Xk842axn1mPrJ8AdPh8xpLf",
      "https://drive.google.com/uc?export=download&id=1nde8BkUjfD7F5fAM6WvAj6usHGjra4Ln",
      "https://drive.google.com/uc?export=download&id=1JVrIeRhhLUg-qOkRzvZCtI-CGrdfrHvq",
      "https://drive.google.com/uc?export=download&id=1uObNiYcCBbpTNZejRYavBKZGlclD2k3v",
      "https://drive.google.com/uc?export=download&id=1FN1kr3jma9i8opILdeMpH67lHjeJ3NIT",
      "https://drive.google.com/uc?export=download&id=1V2wYr_sGIBckvVrwGmpQXoZ_bj1jR6DY",
      "https://drive.google.com/uc?export=download&id=1FsQbt14Jw7gpvaabkBSgJDCefMLU8Pxq",
      "https://drive.google.com/uc?export=download&id=1ylJsOdaJ53GDITZ6_X-ET5PdnFAW93g1",
      "https://drive.google.com/uc?export=download&id=1Gj7ls2QwDmM-3nN7AXUxPPcGV8hdm59w"
    ];

    if (songLinks.length === 0) {
      return api.sendMessage("❌ No songs available in the list!", threadID, messageID);
    }

    try {
      // ১. রিঅ্যাকশন এবং ডাউনলোড শুরু
      api.setMessageReaction("⌛", messageID, () => {}, true);

      let index;
      do {
        index = Math.floor(Math.random() * songLinks.length);
      } while (index === lastPlayed && songLinks.length > 1);

      lastPlayed = index;
      const url = songLinks[index];
      
      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      
      const filePath = path.join(cacheDir, `song_${threadID}_${Date.now()}.mp3`);

      // ২. Axios দিয়ে গান ডাউনলোড
      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(res.data));

      // ৩. গান পাঠানো
      return api.sendMessage({
        body: "🎶 আপনার পছন্দের গানটি পাঠানো হলো:",
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        // পাঠানোর পর ফাইল ডিলিট
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.setMessageReaction("✅", messageID, () => {}, true);
      }, messageID);

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ গানটি ডাউনলোড করতে সমস্যা হয়েছে। ড্রাইভ লিঙ্কটি চেক করুন।", threadID, messageID);
    }
  }
};