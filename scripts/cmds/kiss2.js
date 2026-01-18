const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");

module.exports.config = {
    name: "kiss2",
    version: "2.3.0",
    role: 0,
    author: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 & Gemini",
    description: "Kiss the person you want (Fixed Error)",
    category: "Love",
    guide: { en: "{pn} @tag or reply" },
    countDown: 5
};

async function circle(image) {
    const img = await Jimp.read(image);
    img.circle();
    return await img.getBufferAsync(Jimp.MIME_PNG);
}

async function makeImage({ one, two }) {
    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const bgPath = path.join(cacheDir, "hon0.jpeg");
    const outPath = path.join(cacheDir, `kiss_${one}_${two}_${Date.now()}.png`);

    // ১. ব্যাকগ্রাউন্ড ইমেজ ডাউনলোড লজিক (Error Fix)
    const bgURL = "https://i.imgur.com/j96ooUs.jpeg";
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

        bg.resize({ w: 700, h: 440 });
        avtOne.resize({ w: 150, h: 150 });
        avtTwo.resize({ w: 150, h: 150 });

        bg.composite(avtOne, 390, 23);
        bg.composite(avtTwo, 115, 130);

        await bg.writeAsync(outPath);
        return outPath;
    } catch (err) {
        // যদি ব্যাকগ্রাউন্ড ফাইলটি কারাপ্ট হয় তবে তা ডিলিট করে দিবে যাতে পরের বার ফ্রেশ ডাউনলোড হয়
        if (fs.existsSync(bgPath)) fs.unlinkSync(bgPath);
        throw err;
    }
}

module.exports.onStart = async function ({ event, api }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;
    
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
            "প্রিয় তুমি কি আমার জীবনের সেই গল্প হবে? যেই গল্পের শুরু থাকবে, কিন্তু কোনো শেষ থাকবে না!♥️",
            "ভালোবাসা যদি কোনো অনুভূতি হয়, তাহলে তোমার প্রতি আমার অনুভূতি পৃথিবীর সেরা অনুভূতি।🌻ღ🌺"
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
        api.sendMessage(`❌ এরর: ছবি তৈরি করা সম্ভব হয়নি।\n\nসম্ভাব্য কারণ: এপিআই সমস্যা বা ইন্টারনেটের ধীরগতি।`, threadID, messageID);
    }
};