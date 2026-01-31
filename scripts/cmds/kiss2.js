const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");

module.exports = {
    config: {
        name: "kiss4",
        version: "2.0",
        author: "CYBER-BOT & Gemini",
        countDown: 5,
        role: 0,
        category: "fun",
        shortDescription: { en: "Kiss with FB new mention style" },
        longDescription: { en: "Generate a kiss image by mentioning or replying to someone." },
        guide: { en: "{pn} @tag or reply to a message" }
    },

    onStart: async function ({ api, event, message, args }) {
        const { threadID, messageID, senderID, mentions, messageReply } = event;

        // ১. টার্গেট আইডি এবং নাম ডিটেকশন
        let uid2 = messageReply ? messageReply.senderID : Object.keys(mentions)[0];
        if (!uid2) return message.reply("দয়া করে একজনকে মেনশন করুন অথবা মেসেজে রিপ্লাই দিন।");

        let targetName = mentions[uid2] ? mentions[uid2].replace("@", "") : "User";

        const cacheDir = path.join(__dirname, "cache", "canvas");
        const bgPath = path.join(cacheDir, "kissv3.png");
        const outPath = path.join(cacheDir, `kiss_${Date.now()}.png`);

        try {
            await fs.ensureDir(cacheDir);

            // ২. ব্যাকগ্রাউন্ড চেক ও ডাউনলোড
            if (!fs.existsSync(bgPath)) {
                const getBG = await axios.get("https://i.imgur.com/3laJwc1.jpg", { responseType: "arraybuffer" });
                await fs.writeFile(bgPath, Buffer.from(getBG.data));
            }

            // ৩. স্মার্ট ইমেজ ফেচার (Circle Crop + Rate Limit Bypass)
            const getAvt = async (uid) => {
                const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
                const hdUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${token}`;
                const normalUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;

                try {
                    const res = await axios.get(hdUrl, { responseType: 'arraybuffer', timeout: 8000 });
                    const img = await Jimp.read(Buffer.from(res.data));
                    return img.circle();
                } catch (e) {
                    const res = await axios.get(normalUrl, { responseType: 'arraybuffer' });
                    const img = await Jimp.read(Buffer.from(res.data));
                    return img.circle();
                }
            };

            const [baseImg, avt1, avt2] = await Promise.all([
                Jimp.read(bgPath),
                getAvt(senderID),
                getAvt(uid2)
            ]);

            // ৪. ইমেজ কম্পোজিট
            baseImg.composite(avt1.resize(350, 350), 200, 300);
            baseImg.composite(avt2.resize(350, 350), 600, 80);

            const buffer = await baseImg.getBufferAsync(Jimp.MIME_PNG);
            await fs.writeFile(outPath, buffer);

            // ৫. ক্যাপশন লিস্ট
            const captions = [
                "কারণে অকারণে প্রতিদিন নিয়ম করে, তোমার মায়াতে জড়িয়ে পড়ছি আমি বারেবার!🌷",
                "তোমাকে কেন ভালোবাসি তার কোন বিশেষ কারণ আমার জানা নাই! কিন্তু তোমার কাছে সারাজীবন থেকে যাওয়ার হাজারটা কারণ আমার কাছে আছে!💚",
                "প্রিয় তুমি কি আমার জীবনের সেই গল্প হবে? যেই গল্পের শুরু থাকবে, কিন্তু কোনো শেষ থাকবে না!♥️",
                "ভালোবাসা যদি কোনো অনুভূতি হয়, তাহলে তোমার প্রতি আমার অনুভূতি পৃথিবীর সেরা অনুভূতি।🌻ღ🌺"
            ];
            const caption = captions[Math.floor(Math.random() * captions.length)];

            // ৬. FB New Mention Style এ রিপ্লাই পাঠানো
            return message.reply({
                body: `${targetName}, ${caption}`,
                mentions: [{
                    tag: targetName,
                    id: uid2
                }],
                attachment: fs.createReadStream(outPath)
            }, () => {
                if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
            });

        } catch (err) {
            console.error(err);
            return message.reply("ছবি বানাতে সমস্যা হয়েছে। সার্ভার সম্ভবত বিজি।");
        }
    }
};