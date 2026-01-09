const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "buttslap",
        version: "1.4",
        author: "Amit max ⚡ & Gemini",
        countDown: 5,
        role: 0,
        shortDescription: "Buttslap image with high quality avatar",
        longDescription: "Generate a funny buttslap image with auto-detected mentions and HQ avatars.",
        category: "fun",
        guide: { en: "{pn} @tag" }
    },

    langs: {
        vi: { noTag: "Bạn phải tag người muốn đánh mông" },
        en: { noTag: "You must tag the person you want to slap" }
    },

    onStart: async function ({ event, message, args, getLang }) {
        const { senderID, mentions } = event;
        const mentionIDs = Object.keys(mentions);

        // ১. মেনশন চেক এবং সেন্ডার ডিটেকশন
        if (mentionIDs.length === 0) return message.reply(getLang("noTag"));

        const uid1 = senderID; // যে কমান্ড দিচ্ছে তার আইডি
        const uid2 = mentionIDs[0]; // যাকে মেনশন করা হয়েছে তার আইডি

        // ২. আপনার দেওয়া Access Token এবং High Quality লিঙ্ক
        const accessToken = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
        const avatar1 = `https://graph.facebook.com/${uid1}/picture?width=1500&height=1500&access_token=${accessToken}`;
        const avatar2 = `https://graph.facebook.com/${uid2}/picture?width=1500&height=1500&access_token=${accessToken}`;

        try {
            // ৩. ইমেজ জেনারেশন (Spank mode)
            const imgBuffer = await new DIG.Spank().getImage(avatar1, avatar2);

            const tmpDir = path.join(__dirname, "tmp");
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            const filePath = path.join(tmpDir, `${uid1}_${uid2}_spank.png`);
            fs.writeFileSync(filePath, Buffer.from(imgBuffer));

            // ৪. মেসেজ থেকে মেনশন নাম রিমুভ করা
            let content = args.join(" ");
            for (const id in mentions) {
                const name = mentions[id];
                content = content.replace(name, "").replace("@", "");
            }

            // ৫. রিপ্লাই পাঠানো এবং ফাইল ডিলিট করা
            message.reply({ 
                body: content.trim() || "এই নে কড়া ডোজ! 🍑👋", 
                attachment: fs.createReadStream(filePath) 
            }, () => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });

        } catch (err) {
            console.error("❌ buttslap command error:", err);
            message.reply("ছবি তৈরি করতে সমস্যা হয়েছে। আপনার টোকেন বা ইউজার আইডি চেক করুন।");
        }
    }
};