const axios = require("axios");
const https = require("https");

module.exports = {
  config: {
    name: "flux2",
    version: "2.6.0",
    author: "Dipto & Gemini",
    countDown: 15,
    role: 0,
    shortDescription: { en: "High-quality Flux AI Image Generator (SSL Fixed)" },
    category: "AI-IMAGE",
    guide: { 
      en: "{pn} [prompt] --ratio 16:9\n{pn} [prompt]" 
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    
    // SSL সার্টিফিকেট এরর এড়াতে www বাদ দিয়ে ডিরেক্ট সাবডোমেইন ব্যবহার
    const diptoApi = "https://noobs-api.rf.gd/dipto";

    if (!args[0]) {
      return api.sendMessage("❌ দয়াকরে একটি প্রম্পট লিখুন!\nউদাহরণ: flux2 a cat wearing sunglasses --ratio 16:9", threadID, messageID);
    }

    try {
      const fullText = args.join(" ");
      const [prompt, ratio = "1:1"] = fullText.includes("--ratio")
        ? fullText.split("--ratio").map(s => s.trim())
        : [fullText, "1:1"];

      const startTime = Date.now();

      // ১. ওয়েটিং মেসেজ ও রিঅ্যাকশন
      const waitMessage = await api.sendMessage("🎨 𝗙𝗹𝘂𝘅 𝗔𝗜 আপনার ছবিটি তৈরি করছে, দয়াকরে অপেক্ষা করুন... ✨", threadID);
      api.setMessageReaction("🎨", messageID, () => {}, true);

      // ২. এপিআই কল (SSL Bypass যুক্ত করা হয়েছে)
      const apiurl = `${diptoApi}/flux?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}`;
      
      const response = await axios.get(apiurl, { 
        responseType: "stream",
        timeout: 90000, // ১.৫ মিনিট সময় দেওয়া হয়েছে বড় ইমেজের জন্য
        httpsAgent: new https.Agent({  
          rejectUnauthorized: false // এই লাইনটি আপনার SSL Certificate Altname এরর ফিক্স করবে
        })
      });

      const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

      // ৩. সাকসেস রিঅ্যাকশন ও আগের মেসেজ ডিলিট
      api.setMessageReaction("✅", messageID, () => {}, true);
      api.unsendMessage(waitMessage.messageID);

      // ৪. ইমেজ ও বিস্তারিত তথ্য পাঠানো
      return api.sendMessage({
        body: `✅ 𝗜𝗺𝗮𝗴𝗲 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱!\n━━━━━━━━━━━━━━\n📝 𝗣𝗿𝗼𝗺𝗽𝘁: ${prompt}\n📐 𝗥𝗮𝘁𝗶𝗼: ${ratio}\n⏱️ 𝗧𝗶𝗺𝗲: ${timeTaken}s\n━━━━━━━━━━━━━━`,
        attachment: response.data,
      }, threadID, messageID);

    } catch (e) {
      console.error(e);
      api.setMessageReaction("❌", messageID, () => {}, true);
      
      let errorMsg = "সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।";
      if (e.code === 'ECONNABORTED') errorMsg = "এপিআই রেসপন্স দিতে অনেক দেরি করছে।";
      if (e.response) errorMsg = `এপিআই এরর: ${e.response.statusText}`;

      return api.sendMessage(`❌ এরর: ${errorMsg}`, threadID, messageID);
    }
  }
};