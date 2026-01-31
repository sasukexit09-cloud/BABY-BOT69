const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "slap",
        version: "2.0",
        author: "AYAN & Gemini",
        countDown: 5,
        role: 0,
        shortDescription: "Batslap with new mention style",
        longDescription: "Automatically detects sender and target with FB new update mention style.",
        category: "image",
        guide: {
            en: "{pn} @tag"
        }
    },

    onStart: async function ({ event, message, args }) {
        const { senderID, mentions } = event;
        const mentionIDs = Object.keys(mentions);

        // ১. চেক: কাউকে মেনশন করা হয়েছে কি না
        if (mentionIDs.length === 0) {
            return message.reply("দয়া করে একজনকে মেনশন করুন যাকে আপনি থাপ্পড় মারতে চান।");
        }

        const targetID = mentionIDs[0];
        const targetName = mentions[targetID].replace("@", "");

        // ২. নির্দিষ্ট আইডি বা নিজের ক্ষেত্রে রেস্ট্রিকশন
        if (targetID === senderID) {
            return message.reply("নিজেকে থাপ্পড় মারতে চান? পাগল নাকি! 🐸");
        }
        if (targetID === "61584308632995") {
            return message.reply("Slap yourself Dude 🐸🐸!");
        }

        // ৩. টোকেন ও ইমেজ ইউআরএল (High Quality)
        const accessToken = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
        const avatarURL1 = `https://graph.facebook.com/${senderID}/picture?width=1500&height=1500&access_token=${accessToken}`;
        const avatarURL2 = `https://graph.facebook.com/${targetID}/picture?width=1500&height=1500&access_token=${accessToken}`;

        const pathSave = path.join(__dirname, "tmp", `slap_${Date.now()}.png`);

        try {
            // ৪. ইমেজ জেনারেশন
            const img = await new DIG.Batslap().getImage(avatarURL1, avatarURL2);
            await fs.ensureDir(path.join(__dirname, "tmp"));
            await fs.writeFile(pathSave, Buffer.from(img));

            // ৫. FB New Style Mention Logic
            // এখানে বডি টেক্সটে নামের জায়গায় ট্যাগ কাজ করবে
            const msgBody = `এই নে কড়া থাপ্পড় ${targetName}! 😵‍💫`;

            return message.reply({
                body: msgBody,
                mentions: [{
                    tag: targetName,
                    id: targetID
                }],
                attachment: fs.createReadStream(pathSave)
            }, () => {
                if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave);
            });

        } catch (error) {
            console.error(error);
            return message.reply("ছবি তৈরি করতে সমস্যা হয়েছে। সম্ভবত টোকেনটি কাজ করছে না।");
        }
    }
};