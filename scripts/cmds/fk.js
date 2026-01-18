const fs = require("fs-extra");
const axios = require("axios");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "fk",
    aliases: ["fuck"],
    version: "1.7",
    author: "Tarek + Maya + Gemini",
    countDown: 5,
    role: 0, 
    shortDescription: { en: "FK with Ultra HD image (1500x1500px)" },
    category: "funny",
    guide: { en: "{pn} @mention or reply" }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    // ১. টার্গেট আইডি নির্ধারণ (Reply > Mention)
    let targetID;
    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      return api.sendMessage("⚠️ দয়া করে একজনকে মেনশন করুন বা তার মেসেজে রিপ্লাই দিন!", threadID, messageID);
    }

    try {
      api.sendMessage("⌛ অরিজিনাল HD ছবি প্রসেস হচ্ছে... একটু অপেক্ষা করুন।", threadID, (err, info) => {
        setTimeout(() => api.unsendMessage(info.messageID), 3000);
      }, messageID);

      const senderData = await usersData.get(senderID);
      const targetData = await usersData.get(targetID);

      // ২. জেন্ডার ডিটেকশন
      const senderGender = (senderData.gender === 1 || senderData.gender === "female") ? "female" : "male";
      const targetGender = (targetData.gender === 1 || targetData.gender === "female") ? "female" : "male";

      let maleID = senderGender === "male" ? senderID : targetID;
      let femaleID = senderGender === "female" ? senderID : targetID;

      // ৩. আপনার দেওয়া সেই অরিজিনাল HD লিঙ্ক (1500x1500px)
      const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
      
      const getAvt = async (uid) => {
        // এখানে আপনার সেই স্পেশাল লিঙ্কটি সেট করা হয়েছে
        const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=${token}`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return await Canvas.loadImage(res.data);
      };

      const [avatarMale, avatarFemale] = await Promise.all([getAvt(maleID), getAvt(femaleID)]);

      // ৪. ক্যানভাস এডিটিং
      const bgUrl = "https://i.imgur.com/PlVBaM1.jpg";
      const bgRes = await axios.get(bgUrl, { responseType: "arraybuffer" });
      const bg = await Canvas.loadImage(bgRes.data);

      const canvas = Canvas.createCanvas(850, 600);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bg, 0, 0, 850, 600);

      const avatarSize = 170;

      // Female Avatar পজিশন
      const femaleX = 300, femaleY = 110;
      ctx.save();
      ctx.beginPath();
      ctx.arc(femaleX + 85, femaleY + 85, 85, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarFemale, femaleX, femaleY, avatarSize, avatarSize);
      ctx.restore();

      // Male Avatar পজিশন
      const maleX = 130, maleY = 350;
      ctx.save();
      ctx.beginPath();
      ctx.arc(maleX + 85, maleY + 85, 85, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarMale, maleX, maleY, avatarSize, avatarSize);
      ctx.restore();

      // ৫. সেভ এবং সেন্ড
      const imgPath = path.join(process.cwd(), "cache", `fk_hd_${senderID}.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      return api.sendMessage({
        body: "🔥 Ultra HD FUCK রেডি! 😈",
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ ছবি তৈরি করতে সমস্যা হয়েছে। টোকেনটি চেক করুন!", threadID, messageID);
    }
  }
};