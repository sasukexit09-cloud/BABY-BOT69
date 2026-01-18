module.exports.config = {
    name: "listbox2",
    version: "1.1.0",
    role: 2, // Admin only
    author: "—͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 & Gemini",
    description: "বট যেসব গ্রুপে আছে সেগুলোর তালিকা দেখুন এবং আউট/ব্যান করুন",
    category: "System",
    guide: { en: "{pn}" },
    countDown: 5
};

module.exports.handleReply = async function({ api, event, Threads, handleReply }) {
    const { threadID, messageID, senderID, body } = event;

    // শুধুমাত্র যে কমান্ড দিয়েছে সে রিপ্লাই দিতে পারবে
    if (parseInt(senderID) !== parseInt(handleReply.author)) return;

    const args = body.split(" ");
    const action = args[0].toLowerCase();
    const index = parseInt(args[1]);
    const targetID = handleReply.groupid[index - 1];

    if (!targetID || isNaN(index)) {
        return api.sendMessage("⚠ ভুল নম্বর! উদাহরণ: out 1 বা ban 2", threadID, messageID);
    }

    try {
        if (action === "ban") {
            const data = (await Threads.getData(targetID)).data || {};
            data.banned = true;
            await Threads.setData(targetID, { data });
            
            if (global.data && global.data.threadBanned) {
                global.data.threadBanned.set(targetID, true);
            }
            
            return api.sendMessage(`✅ গ্রুপ ব্যান করা হয়েছে!\n🆔 TID: ${targetID}`, threadID, messageID);
        }

        if (action === "out") {
            return api.removeUserFromGroup(api.getCurrentUserID(), targetID, (err) => {
                if (err) return api.sendMessage(`❌ গ্রুপ থেকে বের হওয়া সম্ভব হয়নি: ${err}`, threadID, messageID);
                return api.sendMessage(`✅ গ্রুপ থেকে বের হয়েছি!\n🆔 TID: ${targetID}`, threadID, messageID);
            });
        }
    } catch (e) {
        console.error(e);
        return api.sendMessage("❌ অপারেশনটি সফল হয়নি।", threadID, messageID);
    }
};

module.exports.onStart = async function({ api, event }) {
    const { threadID, messageID, senderID } = event;

    try {
        const inbox = await api.getThreadList(100, null, ['INBOX']);
        let list = inbox.filter(group => group.isSubscribed && group.isGroup);

        let listthread = [];
        for (const groupInfo of list) {
            listthread.push({
                id: groupInfo.threadID,
                name: groupInfo.name || "Unnamed Group",
                members: groupInfo.participantIDs.length
            });
        }

        // মেম্বার সংখ্যা অনুযায়ী বড় থেকে ছোট সাজানো
        listthread.sort((a, b) => b.members - a.members);

        let msg = "📊 বট যেসব গ্রুপে জয়েন আছে:\n━━━━━━━━━━━━━━━\n";
        let groupid = [];
        let i = 1;

        for (const group of listthread) {
            msg += `${i++}. ${group.name}\n🧩 TID: ${group.id}\n👥 Members: ${group.members}\n\n`;
            groupid.push(group.id);
        }

        return api.sendMessage(msg + '👉 গ্রুপ থেকে বের হতে লিখুন: "out [নম্বর]"\n👉 গ্রুপ ব্যান করতে লিখুন: "ban [নম্বর]"', threadID, (err, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                author: senderID,
                messageID: info.messageID,
                groupid,
                type: 'reply'
            });
        }, messageID);

    } catch (e) {
        console.error(e);
        return api.sendMessage("❌ লিস্ট লোড করতে সমস্যা হয়েছে।", threadID, messageID);
    }
};