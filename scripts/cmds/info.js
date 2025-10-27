const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

module.exports = {
  config: {
    name: "info",
    version: "1.8", // Version updated
    author: "TAREK",
    shortDescription: "Display bot and owner info as an image card",
    longDescription: "Shows owner's and bot's details with an image in a visually appealing card format.",
    category: "INFO",
    guide: { en: "[user]" },
  },

  onStart: async function ({ api, event }) {
    const imageUrls = [
      // ✅ New Google Drive direct image link provided by Tarek
      "https://files.catbox.moe/phfk4g.jpg"
    ];

    const ownerName = "𝗔𝗬𝗔𝗡";
    const ownerAge = "18+"; // Updated to 19+
    const ownerEducation = "Diploma in Civil Engineering";
    const ownerSession = "2025-26";
    const ownerFrom = "𝗚𝗮𝘇𝗶𝗽𝘂𝗿";
    const ownerRelation = "𝗦𝗶𝗻𝗴𝗹𝗲";
    const ownerGender = "Male";
    const ownerHobbies = "GAMING • MUSIC";
    const botType = "GoatBot V2";

    const randomImage = imageUrls[Math.floor(Math.random() * imageUrls.length)];

    // --- ১. ক্যানভাস দিয়ে ইমেজ কার্ড তৈরি করা ---
    const width = 850; // কার্ডের প্রস্থ সামান্য বাড়ানো হলো
    const height = 1050; // কার্ডের উচ্চতা সামান্য বাড়ানো হলো
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // কালার প্যালেট (উজ্জ্বলতা বাড়ানো হলো)
    const BG_COLOR = '#0f0f1d'; // প্রায় কালো
    const CARD_COLOR = '#191933'; // গাঢ় নীল
    const TEXT_COLOR_PRIMARY = '#ffffff'; // পুরোপুরি সাদা
    const TEXT_COLOR_SECONDARY = '#b3b3cc'; // হালকা ধূসর-নীল
    const HIGHLIGHT_COLOR = '#FF3366'; // উজ্জ্বল হট পিঙ্ক
    const HEADER_COLOR = '#3366ff'; // উজ্জ্বল নীল হেডার

    // ব্যাকগ্রাউন্ড
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    // মেইন ইনফো কার্ডের জন্য একটি বড় বক্স আঁকা
    const cardX = 50;
    const cardY = 50;
    const cardWidth = width - 100;
    const cardHeight = height - 100;
    const cardRadius = 25; // রেডিয়াস বাড়ানো হলো

    // Rounded Card Function
    const drawRoundedRect = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    };

    ctx.fillStyle = CARD_COLOR;
    drawRoundedRect(cardX, cardY, cardWidth, cardHeight, cardRadius);

    // হেডার সেকশন
    ctx.fillStyle = HEADER_COLOR;
    drawRoundedRect(cardX, cardY, cardWidth, 90, cardRadius); // টপ হেডার
    ctx.fillStyle = TEXT_COLOR_PRIMARY;
    ctx.font = 'bold 40px sans-serif'; // ফন্ট সাইজ বাড়ানো হলো
    ctx.textAlign = 'center';
    ctx.fillText('⚡️ 𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢 ⚡️', width / 2, cardY + 60);

    // মালিকের ছবি যোগ করা
    try {
        const ownerImage = await loadImage(randomImage);
        const imgSize = 130; // ছবির আকার বাড়ানো হলো
        const imgX = width / 2 - imgSize / 2;
        const imgY = cardY + 130; // Y পজিশন অ্যাডজাস্ট করা হলো

        // ছবির জন্য বৃত্তাকার ক্লিপিং মাস্ক
        ctx.save();
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(ownerImage, imgX, imgY, imgSize, imgSize);
        ctx.restore();

        // ছবির চারপাশে বর্ডার
        ctx.strokeStyle = HIGHLIGHT_COLOR;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2 + 3, 0, Math.PI * 2, true);
        ctx.stroke();

    } catch (e) {
        console.error("Failed to load owner image:", e.message);
        ctx.fillStyle = HIGHLIGHT_COLOR;
        ctx.font = '24px sans-serif';
        ctx.fillText('Image Failed to Load', width / 2, cardY + 130 + 65);
    }

    // মালিকের তথ্য (Owner Info)
    let textY = cardY + 300;
    const lineHeight = 45; // লাইন স্পেসিং বাড়ানো হলো
    const labelIndent = cardX + 100; // লেবেলের বাম দিক থেকে দূরত্ব
    const valueIndent = cardX + cardWidth / 2 + 50; // মানের বাম দিক থেকে দূরত্ব

    const drawInfoLine = (label, value, isHighlight = false) => {
        const size = 24; // টেক্সট সাইজ বাড়ানো হলো

        ctx.font = `bold ${size}px sans-serif`;
        ctx.fillStyle = TEXT_COLOR_SECONDARY;
        ctx.textAlign = 'left';
        ctx.fillText(label, labelIndent, textY);

        ctx.font = `${size}px sans-serif`;
        ctx.fillStyle = isHighlight ? HIGHLIGHT_COLOR : TEXT_COLOR_PRIMARY;
        ctx.fillText(value, valueIndent, textY);
        textY += lineHeight;
    };

    textY += 20; // Initial spacing
    drawInfoLine('☁️ Name ➝', ownerName, true);
    drawInfoLine('🎂 Age ➝', ownerAge);
    drawInfoLine('🧠 Education ➝', ownerEducation);
    drawInfoLine('❄️ Session ➝', ownerSession);
    drawInfoLine('🏠 From ➝', ownerFrom);
    drawInfoLine('❤️ Relation ➝', ownerRelation, true);
    drawInfoLine('♂️ Gender ➝', ownerGender);

    // সেকশন সেপারেটর
    textY += 30;
    ctx.strokeStyle = TEXT_COLOR_SECONDARY;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 50, textY);
    ctx.lineTo(cardX + cardWidth - 50, textY);
    ctx.stroke();
    textY += 40;

    // শখের তথ্য (Hobbies)
    ctx.font = `bold 26px sans-serif`;
    ctx.fillStyle = HEADER_COLOR;
    ctx.textAlign = 'center';
    ctx.fillText('✦ 𝗛𝗼𝗯𝗯𝗶𝗲𝘀 ➝', width / 2 - 100, textY);
    ctx.fillStyle = TEXT_COLOR_PRIMARY;
    ctx.fillText(ownerHobbies, width / 2 + 50, textY);
    textY += lineHeight;

    // সেকশন সেপারেটর
    textY += 30;
    ctx.beginPath();
    ctx.moveTo(cardX + 50, textY);
    ctx.lineTo(cardX + cardWidth - 50, textY);
    ctx.stroke();
    textY += 40;

    // বট টাইপ (Bot Type)
    ctx.font = `bold 26px sans-serif`;
    ctx.fillStyle = HEADER_COLOR;
    ctx.textAlign = 'center';
    ctx.fillText('✨ 𝗕𝗼𝘁 𝗧𝘆𝗽𝗲 ➝', width / 2 - 100, textY);
    ctx.fillStyle = TEXT_COLOR_PRIMARY;
    ctx.fillText(botType, width / 2 + 50, textY);
    textY += lineHeight;

    // ফুটার মেসেজ
    textY += 50;
    ctx.font = `italic 28px sans-serif`;
    ctx.fillStyle = HIGHLIGHT_COLOR;
    ctx.fillText('💫 𝗧𝗵𝗮𝗻𝗸𝘀 𝗳𝗼𝗿 𝘂𝘀𝗶𝗻𝗴 𝗺𝗲 💫', width / 2, textY);


    // --- ২. ইমেজ বাফার তৈরি ও পাঠানো ---
    const buffer = canvas.toBuffer('image/png');
    const imagePath = path.join(__dirname, `info_card_${Date.now()}.png`);
    fs.writeFileSync(imagePath, buffer);

    try {
        await api.sendMessage({
            body: ``,
            attachment: fs.createReadStream(imagePath)
        }, event.threadID, event.messageID);
    } catch (e) {
        console.error("Failed to send image, falling back to text.", e);
        // Fallback message should be added here if needed
        await api.sendMessage({ body: "ইমেজ কার্ড তৈরি বা পাঠাতে ব্যর্থ হয়েছে। সম্ভবত ছবির লিঙ্ক কাজ করছে না।" }, event.threadID, event.messageID);
    }
    
    fs.unlinkSync(imagePath);
  },
};
