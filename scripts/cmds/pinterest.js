const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'pinterest',
    aliases: ['pin', 'pinter'],
    version: '2.0.0',
    author: '𝙰𝚈𝙰𝙽 𝙱𝙱𝙴',
    cooldown: 5,
    role: 0,
    shortDescription: 'Pinterest Image Search (Multi-API)',
    longDescription: 'Search and download images from Pinterest with fallback support.',
    category: 'search'
  },

  onStart: async function ({ api, args, event }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    if (!query) {
      return api.sendMessage("Usage: .pinterest <search query> <amount>\nExample: .pinterest anime girl 10", threadID, messageID);
    }

    // সংখ্যা চেক করা (ডিফল্ট ৬টি ছবি, সর্বোচ্চ ৯টি)
    let limit = 6;
    const lastArg = args[args.length - 1];
    if (!isNaN(lastArg) && args.length > 1) {
      limit = parseInt(lastArg);
      if (limit > 9) limit = 9; // ফেসবুক রেস্ট্রিকশন এড়াতে
    }

    const searchQuery = !isNaN(lastArg) ? args.slice(0, -1).join(" ") : query;
    const loadingMsg = await api.sendMessage(`🔎 Searching for '${searchQuery}'... Please wait.`, threadID);

    // মাল্টিপল API লিস্ট (একটি কাজ না করলে অন্যটি কাজ করবে)
    const apiEndpoints = [
      `https://api.vyturex.com/pinterest?query=${encodeURIComponent(searchQuery)}`,
      `https://sensui-useless-apis.vercel.app/pinterest?search=${encodeURIComponent(searchQuery)}`,
      `https://api.shadi-api.xyz/pinterest?search=${encodeURIComponent(searchQuery)}`
    ];

    let images = [];

    // API থেকে ডাটা খোঁজার লুপ
    for (const url of apiEndpoints) {
      try {
        const res = await axios.get(url, { timeout: 10000 });
        let data = res.data;

        // বিভিন্ন API এর ডাটা ফরম্যাট হ্যান্ডেল করা
        if (Array.isArray(data)) images = data;
        else if (data.data && Array.isArray(data.data)) images = data.data;
        else if (data.results && Array.isArray(data.results)) images = data.results;

        if (images.length > 0) break; // যদি ছবি পাওয়া যায় তাহলে লুপ থামিয়ে দিবে
      } catch (err) {
        continue; // একটি ফেইল করলে পরেরটা ট্রাই করবে
      }
    }

    // যদি কোনো API ই কাজ না করে
    if (images.length === 0) {
      api.unsendMessage(loadingMsg.messageID);
      return api.sendMessage(`❌ '${searchQuery}' এর জন্য কোনো ছবি পাওয়া যায়নি। অন্য কিছু লিখে চেষ্টা করুন।`, threadID, messageID);
    }

    const attachments = [];
    const tempDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    try {
      const sendLimit = Math.min(limit, images.length);
      
      for (let i = 0; i < sendLimit; i++) {
        let imgUrl = typeof images[i] === 'string' ? images[i] : (images[i].url || images[i].image);
        
        if (imgUrl && imgUrl.startsWith('http')) {
          const filePath = path.join(tempDir, `pin_${Date.now()}_${i}.jpg`);
          const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
          fs.writeFileSync(filePath, Buffer.from(response.data, 'binary'));
          attachments.push(fs.createReadStream(filePath));
        }
      }

      api.unsendMessage(loadingMsg.messageID);

      if (attachments.length > 0) {
        await api.sendMessage({
          body: `✅ Results for: ${searchQuery}\n📸 Images Found: ${attachments.length}`,
          attachment: attachments
        }, threadID);
        
        // ফাইল পাঠানোর পর ক্যাশ ক্লিয়ার করা
        setTimeout(() => {
          attachments.forEach(file => {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          });
        }, 5000);

      } else {
        api.sendMessage("❌ ছবিগুলো প্রসেস করা সম্ভব হয়নি।", threadID, messageID);
      }

    } catch (error) {
      console.error(error);
      api.unsendMessage(loadingMsg.messageID);
      api.sendMessage("⚠️ ছবি পাঠানোর সময় একটি ত্রুটি ঘটেছে।", threadID, messageID);
    }
  }
};