const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "fblink",
    version: "1.2.0",
    author: "Shahadat SAHU & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Get FB profile link with HD picture" },
    category: "info",
    guide: { en: "{pn} @mention or reply" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // ১. টার্গেট আইডি নির্ধারণ (Reply > Mention > Self)
    let targetID;
    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      targetID = senderID;
    }

    // ২. আপনার দেওয়া HD টোকেন ও লিঙ্ক লজিক
    const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
    const avtURL = `https://graph.facebook.com/${targetID}/picture?height=1500&width=1500&access_token=${token}`;
    const fbLink = `https://www.facebook.com/profile.php?id=${targetID}`;
    
    const cachePath = path.join(process.cwd(), "cache", `avt_${targetID}.jpg`);

    try {
      // ৩. ছবি ডাউনলোড করা
      const response = await axios({
        url: avtURL,
        method: 'GET',
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(cachePath);
      response.data.pipe(writer);

      writer.on('finish', () => {
        // ৪. লিঙ্ক ও ছবি একসাথে পাঠানো
        return api.sendMessage({
          body: `👤 প্রোফাইল তথ্য\n━━━━━━━━━━━━━━\n🆔 আইডি: ${targetID}\n🔗 লিঙ্ক: ${fbLink}\n━━━━━━━━━━━━━━`,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);
      });

    } catch (err) {
      // যদি টোকেন বা লিঙ্কে সমস্যা থাকে তবে শুধু লিঙ্ক পাঠাবে
      return api.sendMessage(`🔗 প্রোফাইল লিঙ্ক:\n${fbLink}`, threadID, messageID);
    }
  }
};