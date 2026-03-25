const axios = require('axios');
const fs = require('fs-extra');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
  config: {
    name: "gcgirl",
    aliases: ["girls"],
    version: "1.1",
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴",
    role: 0,
    shortDescription: {
      en: "List all girls in group"
    },
    longDescription: {
      en: "Displays a list of all female members in the group with a grid banner of their profile pictures"
    },
    category: "Group",
    guide: {
      en: "!gcgirl"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      // লিঙ্গ চেক করা (কিছু ক্ষেত্রে 'female' ছোট হাতের হতে পারে)
      const females = threadInfo.userInfo.filter(u => u.gender === 'FEMALE' || u.gender === 'female');

      if (females.length === 0) {
        return api.sendMessage("𝙱𝙰𝙳 𝙻𝚄𝙲𝙺 𝙽𝙾 𝙶𝙸𝚁𝙻𝚂 𝙷𝙴𝚁𝙴 𝚃𝙷𝙸𝚂 𝙶𝚁𝙾𝚄𝙿 🍭", event.threadID);
      }

      let nameList = females.map((girl, index) => `${index + 1}. ${girl.name}`).join("\n");

      // গ্রিড কনফিগারেশন
      const avatarSize = 120; // ছবির সাইজ
      const spacing = 15; // ছবির মাঝখানের গ্যাপ
      const itemsPerRow = 5; // প্রতি লাইনে কয়টি ছবি থাকবে
      const totalItems = females.length;
      const rows = Math.ceil(totalItems / itemsPerRow);
      
      const canvasWidth = (avatarSize + spacing) * itemsPerRow + spacing;
      const canvasHeight = (avatarSize + spacing) * rows + spacing;

      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d');

      // ব্যাকগ্রাউন্ড কালার
      ctx.fillStyle = "#1c1c1c"; // ডার্ক ব্যাকগ্রাউন্ড
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ছবিগুলো ড্রয়িং করা
      for (let i = 0; i < females.length; i++) {
        const userID = females[i].id;
        const url = `https://graph.facebook.com/${userID}/picture?width=${avatarSize}&height=${avatarSize}&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        
        const row = Math.floor(i / itemsPerRow);
        const col = i % itemsPerRow;
        
        const x = spacing + col * (avatarSize + spacing);
        const y = spacing + row * (avatarSize + spacing);

        try {
          const img = await loadImage(url);
          
          // গোল করে প্রোফাইল পিকচার ড্র করা (ঐচ্ছিক কিন্তু সুন্দর দেখায়)
          ctx.save();
          ctx.beginPath();
          ctx.arc(x + avatarSize/2, y + avatarSize/2, avatarSize/2, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, x, y, avatarSize, avatarSize);
          ctx.restore();
          
          // ছবির বর্ডার
          ctx.strokeStyle = "#ff4757";
          ctx.lineWidth = 3;
          ctx.stroke();
          
        } catch (e) {
          console.error(`Failed to load image for userID ${userID}`);
          // যদি ছবি লোড না হয় তবে একটি ডিফল্ট কালার দেওয়া
          ctx.fillStyle = "#555";
          ctx.fillRect(x, y, avatarSize, avatarSize);
        }
      }

      const buffer = canvas.toBuffer('image/png');
      const imagePath = path.join(__dirname, `girls_${event.threadID}.png`);
      fs.writeFileSync(imagePath, buffer);

      const message = `💌 𝙶𝙲 𝙰𝙻𝙻 𝙶𝙸𝚁𝙻𝚂 𝙻𝙸𝚂𝚃 💌\n\n${nameList}\n\n🐱𝚃𝙾𝚃𝙰𝙻 𝙲𝚄𝚃𝙴𝙿𝙸𝙴 : ${females.length} 𝙲𝙾𝚄𝙽𝚃𝙴𝙳`;
      
      api.sendMessage({
        body: message,
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });

    } catch (error) {
      console.error(error);
      api.sendMessage("𝙽𝙾 𝙸𝙽𝙵𝙾 𝙲𝙾𝙻𝙻𝙴𝙲𝚃𝙴𝙳 𝙲𝚄𝚉 𝙰𝙿𝙸 𝙿𝚁𝙾𝙱𝙻𝙴𝙼 🍰 ", event.threadID);
    }
  }
};