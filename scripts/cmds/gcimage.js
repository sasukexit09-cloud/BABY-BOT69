const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "gcimage",
    aliases: ["groupimage", "gcpic"],
    version: "1.0.2",
    author: "CYBER BOT TEAM & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Change group profile picture" },
    category: "box",
    guide: { en: "Reply to a photo with {pn}" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, type, messageReply } = event;

    // ১. কন্ডিশন চেক (Reply এবং Photo আছে কি না)
    if (type !== "message_reply") {
      return api.sendMessage("❌ দয়া করে একটি ছবির রিপ্লাইয়ে কমান্ডটি লিখুন!", threadID, messageID);
    }

    if (!messageReply.attachments || messageReply.attachments.length == 0) {
      return api.sendMessage("❌ আপনি যে মেসেজে রিপ্লাই দিয়েছেন তাতে কোনো ছবি নেই!", threadID, messageID);
    }

    if (messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("❌ দয়া করে শুধুমাত্র ছবির রিপ্লাই দিন (ভিডিও বা ফাইল নয়)!", threadID, messageID);
    }

    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);

      const imageUrl = messageReply.attachments[0].url;
      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const pathImg = path.join(cacheDir, `gc_image_${threadID}.png`);

      // ২. ছবি ডাউনলোড
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(pathImg, Buffer.from(response.data));

      // ৩. গ্রুপ ইমেজ পরিবর্তন
      return api.changeGroupImage(fs.createReadStream(pathImg), threadID, (err) => {
        if (err) {
          if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
          return api.sendMessage("❌ গ্রুপ ইমেজ পরিবর্তন করতে সমস্যা হয়েছে। নিশ্চিত করুন বট অ্যাডমিন কি না।", threadID, messageID);
        }
        
        if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage("🔨 সফলভাবে গ্রুপের প্রোফাইল পিকচার পরিবর্তন করা হয়েছে!", threadID, messageID);
      });

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ এরর: ছবি প্রসেস করতে সমস্যা হয়েছে।", threadID, messageID);
    }
  }
};