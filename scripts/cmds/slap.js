const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "slap",
        version: "1.4",
        author: "NTKhang & Gemini",
        countDown: 5,
        role: 0,
        shortDescription: "Batslap image with auto-sender detection",
        longDescription: "Automatically detects the person who uses the command and the person mentioned.",
        category: "image",
        guide: {
            en: "   {pn} @tag"
        }
    },

    onStart: async function ({ event, message, args }) {
        // ১. যে কমান্ড দিচ্ছে (Sender) তার আইডি অটো ডিটেক্ট
        const uid1 = event.senderID; 
        
        // ২. যাকে মেনশন করা হয়েছে তার আইডি ডিটেক্ট
        const mentionIDs = Object.keys(event.mentions);

        if (mentionIDs.length === 0) {
            return message.reply("দয়া করে একজনকে মেনশন করুন যাকে আপনি থাপ্পড় মারতে চান।");
        }

        const uid2 = mentionIDs[0]; 

        // ৩. নির্দিষ্ট আইডি রেস্ট্রিকশন
        if (uid2 === "61584308632995") {
            return message.reply("Slap yourself Dude 🐸🐸!");
        }

        // ৪. আপনার দেওয়া হাই-কোয়ালিটি Access Token ইউআরএল
        const accessToken = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
        const avatarURL1 = `https://graph.facebook.com/${uid1}/picture?width=1500&height=1500&access_token=${accessToken}`;
        const avatarURL2 = `https://graph.facebook.com/${uid2}/picture?width=1500&height=1500&access_token=${accessToken}`;

        const pathSave = path.join(__dirname, "tmp", `slap_${uid1}_${uid2}.png`);

        try {
            // ৫. ইমেজ জেনারেট করা
            const img = await new DIG.Batslap().getImage(avatarURL1, avatarURL2);
            
            // ফোল্ডার না থাকলে তৈরি করা
            fs.ensureDirSync(path.join(__dirname, "tmp"));
            fs.writeFileSync(pathSave, Buffer.from(img));

            // ৬. টেক্সট থেকে মেনশন করা নাম সরিয়ে ফেলা
            let content = args.join(" ");
            for (const id in event.mentions) {
                const name = event.mentions[id];
                content = content.replace(name, "").replace("@", "");
            }

            // ৭. রিপ্লাই পাঠানো
            message.reply({
                body: content.trim() || "এই নে কড়া থাপ্পড়! 😵‍💫",
                attachment: fs.createReadStream(pathSave)
            }, () => {
                if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave);
            });

        } catch (error) {
            console.error("Error:", error);
            message.reply("ছবি তৈরি করতে সমস্যা হয়েছে। সম্ভবত টোকেন বা লিঙ্কে সমস্যা আছে।");
        }
    }
};