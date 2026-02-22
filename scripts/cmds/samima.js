module.exports = {
    config: {
        name: "samima_logic",
        version: "2.2",
        author: "Gemini",
        countDown: 0,
        role: 0,
        category: "automation",
        shortDescription: "Special logic for Samima and Ayan Boss",
        longDescription: "Automatically greets Samima or reminds users to show respect when her name is mentioned, with cooldowns.",
        guide: { en: "Auto-detection, no command needed." }
    },

    cooldowns: new Map(), // Thread-specific keyword mention cooldown
    samimaCooldowns: new Map(), // Samima's 1-hour reply cooldown

    onChat: async function ({ api, event, message }) {
        const { body, senderID, threadID } = event;
        if (!body) return;

        const samimaUID = "61578295556160"; 
        const input = body.toLowerCase().replace(/[.,!?]/g, ''); // punctuation removed
        const keywords = ["samima", "সামিমা", "শামীমা"];
        const now = Date.now();

        // 1️⃣ Samima's own message handling with 1-hour cooldown
        if (senderID === samimaUID) {
            const lastReply = this.samimaCooldowns.get(threadID) || 0;
            const ONE_HOUR = 60 * 60 * 1000;

            if (now - lastReply > ONE_HOUR) {
                this.samimaCooldowns.set(threadID, now);
                await message.reply("আসসালামু আলাইকুম ভাবী! 💌🙈");
                await new Promise(resolve => setTimeout(resolve, 1500));
                return api.sendMessage("আয়ান বস আপনার জন্য অপেক্ষা করছে। 👑", threadID);
            }
            // If within 1 hour, do nothing
            return;
        }

        // 2️⃣ Other users mentioning Samima
        const isMentioned = keywords.some(word => input.includes(word));
        if (isMentioned && senderID !== api.getCurrentUserID()) {
            const lastSent = this.cooldowns.get(threadID) || 0;
            const FIVE_SECONDS = 5000;

            if (now - lastSent > FIVE_SECONDS) {
                this.cooldowns.set(threadID, now);
                return message.reply("উনি আয়ান বসের বউ, সম্মান দিয়ে কথা বল! 🤫🔥");
            }
        }
    }
};