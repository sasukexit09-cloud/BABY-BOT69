const axios = require("axios");

module.exports = {
    config: {
        name: "Alya",
        version: "1.5",
        author: "Arafat & Gemini",
        countDown: 10,
        role: 0,
        category: "Anime",
        shortDescription: { en: "Alya Short Video" },
        longDescription: { en: "Fetches and sends a random short video of Alya from API." },
        guide: { en: "{pn} | {pn} <keyword>" }
    },

    onStart: async function ({ api, event, message, args }) {
        const { threadID, messageID } = event;

        const EMOJIS = ["🎀", "💖", "✨", "🌸", "💫", "💝", "🩷", "🌷"];
        const EMOJI = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

        const FONT = {
            title: `${EMOJI} 𝐀𝐥𝐲𝐚 𝐕𝐢𝐝𝐞𝐨`,
            notFound: "𝐤𝐨𝐧𝐨 𝐯𝐢𝐝𝐞𝐨 𝐩𝐚𝐰𝐚 𝐣𝐚𝐲 𝐧𝐚𝐢 ❌",
            error: "𝐀𝐢 𝐭𝐚 𝐤𝐢 𝐤𝐨𝐫𝐥𝐚 😒",
            blocked: "❌ 𝐘𝐨𝐮𝐫 𝐛𝐨𝐭 𝐢𝐬 𝐭𝐞𝐦𝐩𝐨𝐫𝐚𝐫𝐢𝐥𝐲 𝐮𝐧𝐬𝐞𝐧𝐝 𝐛𝐥𝐨𝐜𝐤 𝐨𝐫 𝐧𝐞𝐭𝐰𝐨𝐫𝐤 𝐞𝐫𝐫𝐨𝐫"
        };

        let keyword = "alya";
        if (args.length) keyword = `alya ${args.join(" ")}`;

        try {
            // ১. লোডিং রিঅ্যাকশন
            api.setMessageReaction("⌛", messageID, () => {}, true);

            const res = await axios.get(
                `https://short-video-api-by-arafat.vercel.app/arafat?keyword=${encodeURIComponent(keyword)}`,
                { timeout: 15000 }
            );

            // ২. ডেটা চেক
            if (!Array.isArray(res.data) || res.data.length === 0) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return message.reply(FONT.notFound);
            }

            const data = res.data[Math.floor(Math.random() * res.data.length)];
            if (!data.videoUrl) return message.reply(FONT.error);

            // ৩. ভিডিও স্ট্রিম তৈরি ও পাঠানো
            const videoStream = await global.utils.getStreamFromURL(data.videoUrl);

            return message.reply({
                body: `${FONT.title}\n⏱ 𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧: ${data.duration || "?"}𝐬`,
                attachment: videoStream
            }, () => {
                // সাকসেস রিঅ্যাকশন
                api.setMessageReaction("✅", messageID, () => {}, true);
            });

        } catch (err) {
            console.error(err);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return message.reply(FONT.blocked);
        }
    }
};