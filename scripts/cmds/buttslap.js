const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "buttslap",
        version: "2.1",
        author: "Amit max ⚡ & Gemini",
        countDown: 5,
        role: 0,
        shortDescription: "Buttslap image with FB new mention style",
        longDescription: "Generate a buttslap image by mentioning or replying to a user.",
        category: "fun",
        guide: { en: "{pn} @tag or reply to a message" }
    },

    onStart: async function ({ event, message, args }) {
        const { senderID, mentions, messageReply } = event;
        
        let uid1 = senderID; // যে কমান্ড দিচ্ছে
        let uid2;            // টার্গেট
        let targetName = "";

        // ১. আইডি ডিটেকশন (Reply অথবা Mention)
        if (messageReply) {
            uid2 = messageReply.senderID;
            targetName = "this person"; // রিপ্লাইয়ের ক্ষেত্রে নাম ডিফল্ট রাখা হয়েছে
        } else if (Object.keys(mentions).length > 0) {
            uid2 = Object.keys(mentions)[0];
            targetName = mentions[uid2].replace("@", "");
        } else {
            return message.reply("দয়া করে একজনকে মেনশন করুন অথবা যার ওপর ইফেক্ট দিতে চান তার মেসেজে রিপ্লাই দিন।");
        }

        // ২. নিজেকে নিজে ইফেক্ট দেওয়া আটকানো
        if (uid1 == uid2) return message.reply("নিজেকে নিজে কি এসব করা ঠিক? 🐸");

        // ৩. Access Token ও HQ Avatar URLs
        const accessToken = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
        const avatar1 = `https://graph.facebook.com/${uid1}/picture?width=1500&height=1500&access_token=${accessToken}`;
        const avatar2 = `https://graph.facebook.com/${uid2}/picture?width=1500&height=1500&access_token=${accessToken}`;

        const tmpDir = path.join(__dirname, "tmp");
        const filePath = path.join(tmpDir, `buttslap_${Date.now()}.png`);

        try {
            await fs.ensureDir(tmpDir);

            // ৪. ইমেজ জেনারেশন (Spank mode)
            const imgBuffer = await new DIG.Spank().getImage(avatar1, avatar2);
            await fs.writeFile(filePath, Buffer.from(imgBuffer));

            // ৫. FB New Style Mention Logic
            const msgBody = targetName !== "this person" ? `এই নে কড়া ডোজ ${targetName}! 🍑👋` : "এই নে কড়া ডোজ! 🍑👋";

            // ৬. সেন্ড মেথড
            return message.reply({
                body: msgBody,
                mentions: targetName !== "this person" ? [{
                    tag: targetName,
                    id: uid2
                }] : [],
                attachment: fs.createReadStream(filePath)
            }, () => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });

        } catch (err) {
            console.error(err);
            return message.reply("ছবি তৈরি করতে সমস্যা হয়েছে। আপনার টোকেন বা ইউজার আইডি চেক করুন।");
        }
    }
};