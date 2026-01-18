const path = require("path");

module.exports.config = {
    name: "load",
    version: "1.2.0",
    role: 2,
    author: "—͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 & Gemini",
    description: "বটের config.json ফাইল রিলোড করা",
    category: "Admin",
    guide: { en: "{pn}" },
    countDown: 10
};

module.exports.onStart = async function({ api, event }) {
    const { threadID, messageID } = event;

    try {
        // ১. কনফিগ ফাইলের পাথ নির্ধারণ (এটি সব বটের জন্য কাজ করবে)
        const configPath = global.client.configPath || path.join(process.cwd(), "config.json");

        // ২. ক্যাশ থেকে পুরনো ফাইল ডিলিট করা
        delete require.cache[require.resolve(configPath)];

        // ৩. নতুন করে লোড করা
        global.config = require(configPath);

        return api.sendMessage("✅ [SUCCESS] config.json সফলভাবে রিলোড হয়েছে।", threadID, messageID);
    } catch (error) {
        console.error(error);
        return api.sendMessage(`❌ [ERROR] ফাইল খুঁজে পাওয়া যায়নি বা পাথে সমস্যা আছে।`, threadID, messageID);
    }
};