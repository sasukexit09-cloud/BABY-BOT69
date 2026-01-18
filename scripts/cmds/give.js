const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "give",
    version: "1.1",
    author: "Shaon Ahmed & Gemini",
    countDown: 5,
    role: 2, // Admin only
    shortDescription: { en: "Upload command files to Pastebin" },
    category: "utility",
    guide: { en: "{pn} <filename>" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (args.length === 0) {
      return api.sendMessage("📁 অনুগ্রহ করে ফাইলের নাম দিন।\nব্যবহার: {pn} <filename>", threadID, messageID);
    }

    const fileName = args[0];
    // GoatBot এ কমান্ডগুলো সাধারণত scripts ফোল্ডারে থাকে
    const scriptsPath = path.join(process.cwd(), "scripts");
    
    let filePath = path.join(scriptsPath, fileName);
    if (!filePath.endsWith(".js")) {
      filePath += ".js";
    }

    // ১. ফাইল চেক করা
    if (!fs.existsSync(filePath)) {
      return api.sendMessage(`❌ scripts ফোল্ডারে '${path.basename(filePath)}' ফাইলটি খুঁজে পাওয়া যায়নি।`, threadID, messageID);
    }

    try {
      // ২. ফাইল রিড করা
      const fileContent = fs.readFileSync(filePath, "utf8");

      api.sendMessage("📤 ফাইল আপলোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...", threadID, async (error, info) => {
        try {
          const pastebinAPI = "https://pastebin-api.vercel.app";
          
          // ৩. এপিআই কল
          const response = await axios.post(`${pastebinAPI}/paste`, { text: fileContent });

          // ৪. প্রসেসিং মেসেজ আনসেন্ড করা
          setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 2000);

          if (response.data && response.data.id) {
            const link = `${pastebinAPI}/raw/${response.data.id}`;
            return api.sendMessage(`📄 ফাইল: ${path.basename(filePath)}\n✅ সফলভাবে লিংক তৈরি হয়েছে:\n🔗 ${link}`, threadID, messageID);
          } else {
            return api.sendMessage("⚠️ আপলোড ব্যর্থ হয়েছে। সার্ভার থেকে সঠিক রেসপন্স পাওয়া যায়নি।", threadID, messageID);
          }
        } catch (apiErr) {
          console.error(apiErr);
          return api.sendMessage("❌ এপিআই সার্ভারে সমস্যা হয়েছে।", threadID, messageID);
        }
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❗ ফাইলটি পড়তে বা আপলোড করতে সমস্যা হয়েছে।", threadID, messageID);
    }
  }
};