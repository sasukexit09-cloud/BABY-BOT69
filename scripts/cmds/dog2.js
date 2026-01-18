const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "dog2",
    version: "1.0.2",
    author: "CYBER & Gemini",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Get a random cute dog picture" },
    category: "img",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const cacheDir = path.join(process.cwd(), "cache");
    
    // ১. ক্যাশ ডিরেক্টরি চেক করা
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    try {
      // ২. এপিআই থেকে কুকুরের ছবির লিঙ্ক নেওয়া
      const res = await axios.get('https://nekos.life/api/v2/img/woof');
      const imgURL = res.data.url;
      const ext = imgURL.split('.').pop(); // এক্সটেনশন বের করা (jpg/png)
      const filePath = path.join(cacheDir, `dog_${Date.now()}.${ext}`);

      // ৩. ছবি ডাউনলোড করা
      const imageRes = await axios({
        url: imgURL,
        method: 'GET',
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(filePath);
      imageRes.data.pipe(writer);

      writer.on('finish', () => {
        // ৪. ছবি পাঠানো এবং ডিলিট করা
        return api.sendMessage({
          body: "এখানে আপনার কিউট ডগি! 🐶",
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, messageID);
      });

      writer.on('error', (err) => {
        throw err;
      });

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ এপিআই থেকে ছবি আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", threadID, messageID);
    }
  }
};