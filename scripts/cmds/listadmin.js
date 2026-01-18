module.exports.config = {
    name: "listadmin",
    version: '1.2.0',
    role: 0,
    author: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 & Gemini",
    description: "গ্রুপের সকল এডমিনের তালিকা দেখুন",
    category: "group",
    guide: {
        en: "{pn}"
    },
    countDown: 5
};

module.exports.onStart = async function({ api, event }) {
    const { threadID, messageID } = event;

    try {
        // ১. গ্রুপের তথ্য সংগ্রহ
        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = threadInfo.adminIDs.map(item => item.id);
        const adminCount = adminIDs.length;

        if (adminCount === 0) {
            return api.sendMessage("এই গ্রুপে কোনো এডমিন পাওয়া যায়নি।", threadID, messageID);
        }

        // ২. সকল এডমিনের প্রোফাইল তথ্য সংগ্রহ (একবারে)
        const allUsersInfo = await api.getUserInfo(adminIDs);
        
        let msg = `✨ এই গ্রুপে মোট ${adminCount} জন এডমিন আছেন:\n━━━━━━━━━━━━━━━━━━\n`;
        let count = 1;

        for (const id of adminIDs) {
            const name = allUsersInfo[id].name;
            msg += `${count++}. ${name}\n`;
        }

        msg += `━━━━━━━━━━━━━━━━━━`;

        // ৩. মেসেজ পাঠানো
        return api.sendMessage(msg, threadID, messageID);

    } catch (error) {
        console.error("Listadmin Error:", error);
        return api.sendMessage("❌ এডমিন লিস্ট লোড করতে সমস্যা হয়েছে। সম্ভবত আপনার বট গ্রুপ এডমিন নয়।", threadID, messageID);
    }
};