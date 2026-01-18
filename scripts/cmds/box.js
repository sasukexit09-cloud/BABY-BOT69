const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "group",
        version: "1.2.0",
        author: "CYBER & Gemini",
        countDown: 5,
        role: 0,
        shortDescription: { en: "Manage group chat settings" },
        category: "box",
        guide: { en: "{pn} [name/emoji/admin/image/info]" }
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, senderID, mentions, messageReply } = event;

        if (!args.length) {
          return api.sendMessage(
            `💠 গ্রুফ সেটিংস মেনু 💠\n━━━━━━━━━━━━━\n` +
            `🔹 {pn} name [নতুন নাম] -> নাম পরিবর্তন\n` +
            `🔹 {pn} emoji [আইকন] -> ইমোজি পরিবর্তন\n` +
            `🔹 {pn} image [রিপ্লাই ছবি] -> গ্রুফ ফটো পরিবর্তন\n` +
            `🔹 {pn} admin [ট্যাগ/রিপ্লাই] -> এডমিন দেওয়া/নেওয়া\n` +
            `🔹 {pn} info -> গ্রুফ ডিটেইলস দেখা\n` +
            `🔹 {pn} me admin -> নিজেকে এডমিন করা (এডমিন হতে হবে)`,
            threadID, messageID
          );
        }

        const threadInfo = await api.getThreadInfo(threadID);
        const isAdmin = threadInfo.adminIDs.some(ad => ad.id === senderID);
        const botIsAdmin = threadInfo.adminIDs.some(ad => ad.id === api.getCurrentUserID());

        // ১. নাম পরিবর্তন
        if (args[0] === "name") {
            const newName = args.slice(1).join(" ") || (messageReply && messageReply.body);
            if (!newName) return api.sendMessage("❌ নতুন নামটি লিখুন!", threadID, messageID);
            return api.setTitle(newName, threadID);
        }

        // ২. ইমোজি পরিবর্তন
        if (args[0] === "emoji") {
            const emoji = args[1] || (messageReply && messageReply.body);
            if (!emoji) return api.sendMessage("❌ একটি ইমোজি দিন!", threadID, messageID);
            return api.changeThreadEmoji(emoji, threadID);
        }

        // ৩. নিজেকে এডমিন করা
        if (args[0] === "me" && args[1] === "admin") {
            if (!botIsAdmin) return api.sendMessage("❌ আগে বটকে এডমিন করুন!", threadID, messageID);
            const botAdmins = global.GoatBot.config.adminBot;
            if (!botAdmins.includes(senderID)) return api.sendMessage("❌ আপনি বটের ওনার নন!", threadID, messageID);
            return api.changeAdminStatus(threadID, senderID, true);
        }

        // ৪. ইউজারকে এডমিন দেওয়া বা রিমুভ করা
        if (args[0] === "admin") {
            if (!isAdmin) return api.sendMessage("❌ আপনি গ্রুফ এডমিন নন!", threadID, messageID);
            if (!botIsAdmin) return api.sendMessage("❌ বট এডমিন না হলে পারমিশন দিতে পারবে না!", threadID, messageID);

            let targetID;
            if (Object.keys(mentions).length) targetID = Object.keys(mentions)[0];
            else if (messageReply) targetID = messageReply.senderID;
            else targetID = args[1];

            if (!targetID) return api.sendMessage("❌ ইউজার ট্যাগ করুন বা রিপ্লাই দিন!", threadID, messageID);
            const targetIsAdmin = threadInfo.adminIDs.some(ad => ad.id === targetID);
            return api.changeAdminStatus(threadID, targetID, !targetIsAdmin);
        }

        // ৫. গ্রুফ ইমেজ পরিবর্তন
        if (args[0] === "image") {
            if (!messageReply || !messageReply.attachments || !messageReply.attachments.length)
                return api.sendMessage("❌ একটি ছবিতে রিপ্লাই দিয়ে {pn} image লিখুন।", threadID, messageID);
            
            const imgUrl = messageReply.attachments[0].url;
            const cachePath = path.join(process.cwd(), "cache", `gc_image_${threadID}.png`);

            try {
                const response = await axios.get(imgUrl, { responseType: "arraybuffer" });
                fs.writeFileSync(cachePath, Buffer.from(response.data));
                return api.changeGroupImage(fs.createReadStream(cachePath), threadID, () => fs.unlinkSync(cachePath));
            } catch (err) {
                return api.sendMessage("❌ ছবি আপলোড করতে সমস্যা হয়েছে।", threadID, messageID);
            }
        }

        // ৬. গ্রুফ ইনফো (ছবিসহ)
        if (args[0] === "info") {
            const totalMembers = threadInfo.participantIDs.length;
            const adminCount = threadInfo.adminIDs.length;
            const approvalStatus = threadInfo.approvalMode ? 'অন ✅' : 'অফ ❎';
            
            const infoMsg = `📌 গ্রুফ নাম: ${threadInfo.threadName}\n` +
                            `🆔 আইডি: ${threadID}\n` +
                            `👥 সদস্য: ${totalMembers} জন\n` +
                            `👮 এডমিন: ${adminCount} জন\n` +
                            `✅ মেম্বার অ্যাপ্রুভাল: ${approvalStatus}\n` +
                            `😀 বর্তমান ইমোজি: ${threadInfo.emoji || "ডিফল্ট"}`;

            const imgUrl = threadInfo.imageSrc;
            if (imgUrl) {
                const imgPath = path.join(process.cwd(), "cache", `info_${threadID}.png`);
                const getImg = await axios.get(imgUrl, { responseType: "arraybuffer" });
                fs.writeFileSync(imgPath, Buffer.from(getImg.data));
                return api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(imgPath) }, threadID, () => fs.unlinkSync(imgPath));
            }
            return api.sendMessage(infoMsg, threadID);
        }
    }
};