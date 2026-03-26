const axios = require('axios');

// Dynamic API URL fetch
const getBaseApiUrl = async () => {
    try {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
    } catch (e) {
        return "https://noobs-api.top";
    }
};

// Triggers: Added all your requested words
const triggerWords = ["bby", "বট", "baby", "bot", "janu", "miko", "yea miko"];

module.exports = {
    config: {
        name: "baby",
        version: "15.0.0",
        author: "AYAN BBE",
        countDown: 0,
        role: 2,
        description: "Bot responds to specific nicknames with funny dialogues.",
        category: "fun",
        guide: { 
            en: "{pn} [text]\n{pn} teach [ask] - [reply]" 
        }
    },

    onStart: async function ({ api, event, args, usersData, commandName }) {
        const { threadID, messageID, senderID } = event;
        const baseUrl = await getBaseApiUrl();
        try {
            const name = await usersData.getName(senderID);

            if (!args[0]) {
                return api.sendMessage({
                    body: `「 ${name} 」\nজ্বি জানু বলো! আমাকে ডাকছো কেন? 😘`,
                    mentions: [{ tag: name, id: senderID }]
                }, threadID, (err, info) => {
                    if (!err) global.GoatBot?.onReply?.set(info.messageID, { commandName, author: senderID });
                }, messageID);
            }

            const action = args[0].toLowerCase();

            if (action === "teach") {
                const input = args.slice(1).join(" ");
                const [trigger, ...responsesArr] = input.split(" - ");
                const responses = responsesArr.join(" - ");
                if (!trigger || !responses) return api.sendMessage("⚠️ Format: teach ask - reply", threadID, messageID);
                await axios.post(`${baseUrl}/api/jan/teach`, { trigger, responses, userID: senderID });
                return api.sendMessage(`✅ শিখিয়ে দিলে তো! এখন থেকে কেউ "${trigger}" বললে আমি "${responses}" বলবো।`, threadID, messageID);
            }

            const res = await axios.post(`${baseUrl}/api/hinata`, { 
                text: args.join(" "), 
                style: 3, 
                attachments: event.attachments || [] 
            });
            return api.sendMessage(res.data.message, threadID, (err, info) => {
                if (!err) global.GoatBot?.onReply?.set(info.messageID, { commandName, author: senderID });
            }, messageID);

        } catch (err) {
            return api.sendMessage("API Busy! ❌", threadID, messageID);
        }
    },

    onReply: async function ({ api, event, commandName }) {
        if (api.getCurrentUserID() == event.senderID) return;
        try {
            const baseUrl = await getBaseApiUrl();
            const res = await axios.post(`${baseUrl}/api/hinata`, { 
                text: event.body?.toLowerCase() || "হাই", 
                style: 3, 
                attachments: event.attachments || [] 
            });
            return api.sendMessage(res.data.message, event.threadID, (err, info) => {
                if (!err) global.GoatBot?.onReply?.set(info.messageID, { commandName, author: event.senderID });
            }, event.messageID);
        } catch (err) {}
    },

    onChat: async function ({ api, event, usersData, commandName }) {
        const { body, senderID, threadID, messageID } = event;
        if (!body) return;
        const lowerBody = body.toLowerCase().trim();

        // Check if message starts with any trigger word
        const matchedTrigger = triggerWords.find(word => lowerBody.startsWith(word));

        if (matchedTrigger) {
            const text = body.slice(matchedTrigger.length).trim();

            if (!text) {
                const name = await usersData.getName(senderID);
                const randomReplies = [
                    "-𝙂𝙖𝙮𝙚𝙨-🤗-যৌবনের কসম দিয়ে আমারে 𝐁𝐥𝐚𝐜𝐤𝐦𝐚𝐢𝐥 করা হচ্ছে-🥲🤦🏻", 
                    "-বেশি বেবি বেবি করলে এমন লাথি দিমু বংশের বাতি নিভে যাবে-😾😎", 
                    "𝗕𝗯𝘆 না বলে 𝗕𝗼𝘄 𝗫𝗮𝗮'𝗻 বলো-🫣🥺",
                    "-আম গাছে আম নাই ঢিল কেন মারো-🙄-তোমার সাথে প্রেম নাই-🥺-বেবি কেন ডাকো-😐🤭", 
                    "-মন সুন্দর বানাও-🤗-মুখের জন্য snapchat তো আছেই-🙂👻",
                    "-আমি তোমার সিনিয়র আপু ওকে-😼-সম্মান দেও-😽🤗", 
                    "-এই এই তোর পরীক্ষা কবে?_শুধু 𝗕𝗯𝘆 𝗯𝗯𝘆 করিস-😾🫡",
                    "শুনবো না😼তুমি আমাকে প্রেম করাই দাও নাই🥺পচা তুমি🥺", 
                    "-কতদিন হয়ে গেলো বিছানায় মুতি না-😿-মিস ইউ নেংটা কাল-🥺🤧",
                    "-তোরা যে হারে 𝗕𝗯𝘆 ডাকছিস আমিতো সত্যি বাচ্চা হয়ে যাবো-☹️🤭", 
                    "তোর বাড়ি কি মাল দিপ গ্রামে? 😵‍💫",
                    "𝗢𝗶𝗶 ঘুমানোর আগে তোমার মনটা কোথায় রেখে ঘুমাও..!!🤔_নাহ মানে একটু চুরি করতাম-😘🍓", 
                    "তুই এত স্মার্ট না-🤧-গুগলও তোকে সার্চ দিলে ভাবে “𝗔𝗿𝗲 𝘆𝗼𝘂 𝘀𝘂𝗿𝗲?”🐸",
                    "🍺 এই নাও জুস খাও..! জানু বলতে বলতে হাপাই গেছো না-🥺😴", 
                    "আজকে প্রপোজ করে দেখো রাজি হইয়া যামু-😌🤗😇", 
                    "-𝗢𝗶𝗶 মামা_আর ডাকিস না প্লিজ ৩২ তারিখ আমার বিয়ে-🥹🐤",
                    "𝗛𝗮𝗮 জানু_এইদিক এ আসো 𝗞𝗶𝘀𝘀 দেই-🤭😘",
                    "-আমাকে বেশি ডাকলে_আমি কিন্তু 𝗞𝗶𝘀𝘀 করে দেবো-😘🥱", 
                    "-তোর তো বিয়ে হয় নাই বেবি পাইলি কই-🤦🏻-পরকিয়া করছোছ নাকি শালা-🥲🤧"
                ];
                const rand = randomReplies[Math.floor(Math.random() * randomReplies.length)];

                return api.sendMessage({
                    body: `「 ${name} 」\n\n${rand}`,
                    mentions: [{ tag: name, id: senderID }]
                }, threadID, (err, info) => {
                    if (!err) global.GoatBot?.onReply?.set(info.messageID, { commandName, author: senderID });
                }, messageID);
            }

            try {
                const baseUrl = await getBaseApiUrl();
                const { data } = await axios.post(`${baseUrl}/api/hinata`, { text: text, style: 3 });
                api.sendMessage(data.message, threadID, (err, info) => {
                    if (!err) global.GoatBot?.onReply?.set(info.messageID, { commandName, author: senderID });
                }, messageID);
            } catch (err) {}
        }
    }
};