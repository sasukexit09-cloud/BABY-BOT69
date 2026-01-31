const userResponses = {};

module.exports = {
    config: {
        name: "bully",
        version: "2.5",
        author: "Rimon & Gemini",
        countDown: 5,
        role: 2, // শুধুমাত্র এডমিনদের জন্য (Config অনুযায়ী)
        category: "automation",
        shortDescription: "Auto roast target whenever they chat",
        longDescription: "Mentions or replies to a user to start an automated roasting session.",
        guide: { en: "{pn} @tag | To stop: {pn} stop @tag" }
    },

    onStart: async function ({ api, event, args, message }) {
        const botAdmins = ['61584308632995']; // আপনার UID
        const { senderID, threadID, mentions, messageReply } = event;

        if (!botAdmins.includes(senderID)) {
            return message.reply("তুই কে রে? ভাগ এখান থেকে! এটা শুধু বসের জন্য। 😾");
        }

        let targetID;
        let targetName = "";

        // ১. টার্গেট ডিটেকশন (Stop Logic সহ)
        if (args[0] === "stop") {
            targetID = messageReply ? messageReply.senderID : Object.keys(mentions)[0];
            if (!targetID || !userResponses[targetID]) return message.reply("কাকে থামাবো? মেনশন বা রিপ্লাই দাও।");
            delete userResponses[targetID];
            return message.reply("যাহ্! মাফ করে দিলাম। আর জোকস শোনাবো না। 🕊️");
        }

        if (messageReply) {
            targetID = messageReply.senderID;
            targetName = "Target"; 
        } else if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
            targetName = mentions[targetID].replace("@", "");
        } else {
            return message.reply("কারে bully করবি? মেনশন বা রিপ্লাই কর আগে!");
        }

        // ২. রোস্ট লিস্ট সেটআপ
        if (!userResponses[targetID]) {
            userResponses[targetID] = {
                index: 0,
                threadID: threadID,
                active: true
            };

            const msgBody = `কি খবর ${targetName}? রোস্টিং শুরু হলো! এখন মেসেজ দিলেই খবর আছে... 😈`;
            return api.sendMessage({
                body: msgBody,
                mentions: [{ tag: targetName, id: targetID }]
            }, threadID);
        } else {
            return message.reply("এই ইউজার অলরেডি রোস্টিং লিস্টে আছে! 💀");
        }
    },

    onChat: async function ({ api, event }) {
        const { senderID, threadID, body, messageID } = event;

        // ৩. অটো রিপ্লাই লজিক (FB New Style)
        if (userResponses[senderID] && userResponses[senderID].active && userResponses[senderID].threadID === threadID && body) {
            
            const insults = [
                "তোর বুদ্ধি দিয়া Calculator এ Snake খেললে Calculator হ্যাং করবে!",
                "তুই এমন এক ক্যারেক্টার, যারে দেইখা ফিচার ফোনও স্মার্ট হইতে ভয় পায়!",
                "তোর চোখে চোখ রাখলে আমার WiFi এর স্পিড কমে যায়! 📶",
                "তোর IQ এত কম যে বাল্ব তো দূরে থাক, মোমবাতিও তোর পাশে জ্বলে না!",
                "তুই কথা বললে ডিকশনারি নিজেই লজ্জা পেয়ে বন্ধ হয়ে যায়!",
                "তোর চেহারা দেইখা আয়না বলে: '404 Face Not Found'!",
                "তুই হাসলে মানুষ ভিপিএন খুঁজে, কারণ তোর হাসি সেন্সর করা দরকার!",
                "তোর ফ্যাশন সেন্স দেখে ছেঁড়া রুমালও কান্নাকাটি শুরু করে! 😭",
                "তোর স্ক্রিনশট নিতে গেলে ইন্সটাগ্রাম বলে: 'Cringe content not allowed!'",
                "তুই সেই রত্ন যারে দেখে টাইটানিক ডুবে নাই, নিজেই সুইসাইড করছে!"
            ];

            const currentIndex = userResponses[senderID].index;
            const replyMsg = insults[currentIndex % insults.length];

            userResponses[senderID].index++;

            return api.sendMessage(replyMsg, threadID, messageID);
        }
    }
};