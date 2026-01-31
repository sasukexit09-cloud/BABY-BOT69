const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "buttslap",
    aliases: ["butslap"],
    version: "2.0",
    author: "MahMUD & Gemini",
    role: 0,
    category: "fun",
    cooldown: 8,
    guide: {
      en: "{pn} @tag or reply"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, mentions, senderID } = event;

    let id1 = senderID;
    let id2;
    let name2 = "";

    // ১. টার্গেট আইডি এবং নাম ডিটেক্ট করা
    if (messageReply) {
      id2 = messageReply.senderID;
      // রিপ্লাই থেকে নাম সংগ্রহ (ফেসবুকের নতুন নিয়মে নাম বের করা)
      name2 = "this person"; 
    } else if (Object.keys(mentions).length > 0) {
      id2 = Object.keys(mentions)[0];
      name2 = mentions[id2].replace("@", "");
    } else if (args[0]) {
      id2 = args[0];
      name2 = "User";
    } else {
      return api.sendMessage("দয়া করে একজনকে মেনশন করুন বা মেসেজে রিপ্লাই দিন।", threadID, messageID);
    }

    // ২. নিজেকে থাপ্পড় মারা আটকানো
    if (id1 == id2) return api.sendMessage("নিজেকে নিজে কি এসব করা ঠিক? 🐸", threadID, messageID);

    try {
      const baseUrl = await baseApiUrl();
      const url = `${baseUrl}/api/dig?type=buttslap&user=${id1}&user2=${id2}`;

      const response = await axios.get(url, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, "tmp", `buttslap_${Date.now()}.png`);
      
      await fs.ensureDir(path.join(__dirname, "tmp"));
      fs.writeFileSync(filePath, Buffer.from(response.data));

      // ৩. FB New Mention Style Logic
      // এখানে বডি টেক্সট এবং মেনশন অবজেক্ট পাঠানো হচ্ছে
      const msgBody = `Effect: Buttslap successful! 💥\nএই নে কড়া ডোজ!`;

      // ৪. রিপ্লাই পাঠানো (All users can see the mention/tag)
      return api.sendMessage({
        body: msgBody,
        mentions: name2 !== "this person" && name2 !== "User" ? [{
          tag: name2,
          id: id2
        }] : [],
        attachment: fs.createReadStream(filePath)
      }, threadID, (err) => {
        if (!err && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage(`🥹 API তে সমস্যা হয়েছে, পরে চেষ্টা করুন।`, threadID, messageID);
    }
  }
};