const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");

module.exports.config = {
    name: "kiss3",
    version: "2.5.0",
    role: 0,
    author: "—͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 & Gemini",
    description: "Kiss the person you want (Supports Mention & Reply)",
    category: "Love",
    guide: { en: "{pn} @tag or reply to a message" },
    countDown: 5
};

// গোল প্রোফাইল পিকচার তৈরির ফাংশন
async function circle(image) {
    const img = await Jimp.read(image);
    img.circle();
    return await img.getBufferAsync(Jimp.MIME_PNG);
}

// ইমেজ এডিটিং ফাংশন
async function makeImage({ one, two }) {
    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const bgPath = path.join(cacheDir, "hon_kiss3.png");
    const outPath = path.join(cacheDir, `kiss3_${one}_${two}_${Date.now()}.png`);

    // ব্যাকগ্রাউন্ড ইমেজ ডাউনলোড লজিক
    const bgURL = "https://i.imgur.com/BtSlsSS.jpg";
    if (!fs.existsSync(bgPath) || fs.statSync(bgPath).size < 100) {
        const res = await axios.get(bgURL, { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, Buffer.from(res.data));
    }

    const getAvt = async (uid) => {
        const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const circleBuffer = await circle(res.data);
        return await Jimp.read(circleBuffer);
    };

    try {
        const [bg, avtOne, avtTwo] = await Promise.all([
            Jimp.read(bgPath),
            getAvt(one),
            getAvt(two)
        ]);

        // আপনার অরিজিনাল পজিশন অনুযায়ী সাইজ এবং কম্পোজিট
        bg.resize({ w: 700, h: 440 });
        avtOne.resize({ w: 200, h: 200 });
        avtTwo.resize({ w: 180, h: 180 });

        bg.composite(avtOne, 390, 23);
        bg.composite(avtTwo, 140, 80);

        await bg.writeAsync(outPath);
        return outPath;
    } catch (err) {
        if (fs.existsSync(bgPath)) fs.unlinkSync(bgPath);
        throw err;
    }
}

module.exports.onStart = async function ({ event, api }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;
    
    // --- রিপ্লাই এবং মেনশন মেথড ---
    let targetID;
    if (type === "message_reply") {
        targetID = messageReply.senderID;
    } else {
        const mention = Object.keys(mentions);
        targetID = mention[0];
    }

    if (!targetID) {
        return api.sendMessage("দয়া করে কাউকে ট্যাগ করুন অথবা তার মেসেজে রিপ্লাই দিন! 🥰", threadID, messageID);
    }

    try {
        api.setMessageReaction("⌛", messageID, () => {}, true);
        const imagePath = await makeImage({ one: senderID, two: targetID });

        const captions = [
            "কারণে অকারণে প্রতিদিন নিয়ম করে, তোমার মায়াতে জড়িয়ে পড়ছি আমি বারেবার!🌷",
            "তোমাকে কেন ভালোবাসি তার কোন বিশেষ কারণ আমার জানা নাই!💚",
            "প্রিয় তুমি কি আমার জীবনের সেই গল্প হবে? যেই গল্পের শুরু থাকবে, কিন্তু কোনো শেষ থাকবে না!♥️",
            "ভালোবাসা যদি কোনো অনুভূতি হয়, তাহলে তোমার প্রতি আমার অনুভূতি পৃথিবীর সেরা অনুভূতি।🌻ღ🌺",
            "তুমি পাশে থাকলে সবকিছু সুন্দর মনে হয়, জীবন যেন একটা মধুর কবিতায় রূপ নেয়!😍",
            "তোমাকে ছাড়া জীবনটা অসম্পূর্ণ, তুমি আমার ভালোবাসার পূর্ণতা!🧡"
        ];
        const caption = captions[Math.floor(Math.random() * captions.length)];

        api.sendMessage({
            body: caption,
            attachment: fs.createReadStream(imagePath)
        }, threadID, () => {
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            api.setMessageReaction("✅", messageID, () => {}, true);
        }, messageID);

    } catch (e) {
        console.error(e);
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage(`❌ এরর: ছবি তৈরি করা সম্ভব হয়নি।\nসম্ভাব্য কারণ: এপিআই সমস্যা বা ফোল্ডার পারমিশন।`, threadID, messageID);
    }
};