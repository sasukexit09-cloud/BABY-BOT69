module.exports = {
    config: {
        name: "samima_logic",
        version: "2.0",
        author: "Gemini",
        countDown: 0,
        role: 0,
        category: "automation",
        shortDescription: "Special logic for Samima and Ayan Boss",
        longDescription: "Automatically greets Samima or reminds users to show respect when her name is mentioned.",
        guide: { en: "Auto-detection, no command needed." }
    },

    onChat: async function ({ api, event, message }) {
        const { body, senderID, threadID } = event;
        if (!body) return;

        // শামীমার অরিজিনাল UID
        const samimaUID = "61578295556160"; 
        const input = body.toLowerCase();
        const keywords = ["samima", "সামিমা", "শামীমা"];

        // ১. শামীমা নিজে কোনো গ্রুপে মেসেজ দিলে (সালাম ও বসের অপেক্ষা)
        if (senderID === samimaUID) {
            await message.reply("আসসালামু আলাইকুম ভাবী! 💌🙈");
            
            // ১.৫ সেকেন্ড বিরতি দিয়ে দ্বিতীয় মেসেজ
            return setTimeout(() => {
                api.sendMessage("আয়ান বস আপনার জন্য অপেক্ষা করছে। 👑", threadID);
            }, 1500);
        }

        // ২. অন্য কেউ সামিমার নাম নিলে (সম্মান দেওয়ার নির্দেশ)
        const isMentioned = keywords.some(word => input.includes(word));
        if (isMentioned && senderID !== api.getCurrentUserID()) {
            return message.reply("উনি আয়ান বসের বউ, সম্মান দিয়ে কথা বল! 🤫🔥");
        }
    }
};