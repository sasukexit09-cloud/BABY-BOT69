const { getTime, drive } = global.utils;

if (!global.temp.welcomeEvent)
    global.temp.welcomeEvent = {};

module.exports = {
    config: {
        name: "welcome",
        version: "4.0-ready",
        author: "Maya Fix",
        category: "events"
    },

    langs: {
        en: {
            session1: "morning",
            session2: "noon",
            session3: "afternoon",
            session4: "evening",

            multiple1: "you",
            multiple2: "all of you",

            defaultWelcomeMessage:
`✨ Welcome {multiple} ✨
{userList}

🌸 Welcome to {boxName} 🌸
Have a nice {session}!`
        }
    },

    // 🌸 Random Cute Messages
    cuteMessages: [
        "🌸 Hey cutie, welcome to the family! 🌸",
        "✨ A new star just entered our group! ✨",
        "💖 Welcome sweet soul, we’re happy you're here! 💖",
        "🌼 Someone special just joined… oh wait, it's YOU! 🌼",
        "🎀 Welcome baby! Make yourself comfortable. 🎀",
        "😇 An angel has arrived. Welcome! 😇",
        "💕 Hello lovely human, glad to have you here! 💕",
        "🌷 Our group just got more beautiful because of you! 🌷",
        "🐣 A cute new member hatched! Welcome! 🐣",
        "💫 Welcome! Your presence just made this place brighter. 💫",
        "🌈 Hey sunshine, welcome! 🌈",
        "🧸 A soft little cutie joined… hiiii! 🧸",
        "🥰 Welcome adorable! Hope you enjoy here! 🥰",
        "✨ Welcome! You’re officially part of our little chaos ✨",
        "💗 New member detected: 100% cute 💗",
        "🌙 Hello moonchild, welcome aboard 🌙",
        "🍭 Sweetest new member arrived! 🍭",
        "🌻 Welcome sunshine! Stay happy with us 🌻",
        "🎉 Yay! Someone awesome joined! 🎉",
        "❤️ Welcome dear, you’re lovable already! ❤️"
    ],

    // 🎥 Auto Detect (Image / Video)
    getMedia: async (fileId) => {
        const info = await drive.getFile(fileId, "info")
            .catch(() => null);

        if (!info) return null;

        const mime = info.mimeType || "";

        if (mime.includes("video"))
            return drive.getFile(fileId, "stream");

        if (mime.includes("image"))
            return drive.getFile(fileId, "buffer");

        return drive.getFile(fileId, "buffer");
    },

    onStart: async ({ threadsData, message, event, api, getLang }) => {

        if (event.logMessageType !== "log:subscribe") return;

        const { threadID } = event;
        const prefix = global.utils.getPrefix(threadID);
        const hours = getTime("HH");
        const dataAdded = event.logMessageData.addedParticipants;

        // Bot added
        if (dataAdded.some(i => i.userFbId == api.getCurrentUserID())) {

            const media = await module.exports.getMedia("1pY-tr_hKajxwhN9Jzl49hmTIBiZPmC8u");

            return message.send({
                body: `Thanks for adding me!\nMy prefix: ${prefix}`,
                attachment: media
            });
        }

        // Multi Join Cache
        if (!global.temp.welcomeEvent[threadID])
            global.temp.welcomeEvent[threadID] = { joinTimeout: null, list: [] };

        const temp = global.temp.welcomeEvent[threadID];
        temp.list.push(...dataAdded);

        clearTimeout(temp.joinTimeout);

        temp.joinTimeout = setTimeout(async () => {

            const threadData = await threadsData.get(threadID);
            if (threadData.settings.sendWelcomeMessage === false) return;

            const joined = temp.list;
            const banned = threadData.data.banned_ban || [];
            const names = [];
            const mentions = [];

            for (const user of joined) {
                if (banned.some(b => b.id == user.userFbId)) continue;

                names.push(user.fullName);
                mentions.push({ tag: user.fullName, id: user.userFbId });
            }

            if (!names.length) return;

            const threadName = threadData.threadName;
            const isMulti = names.length > 1;

            // Cute random msg
            const randomCute = module.exports.cuteMessages[Math.floor(Math.random() *
                module.exports.cuteMessages.length)];

            const userListText = names.map((n, i) => `${i + 1}. ${n}`).join("\n");

            const welcomeMessage = threadData.data.welcomeMessage || getLang("defaultWelcomeMessage");

            const body =
                randomCute + "\n\n" +
                welcomeMessage
                    .replace(/\{userName\}/g, names.join(", "))
                    .replace(/\{userList\}/g, userListText)
                    .replace(/\{boxName\}/g, threadName)
                    .replace(/\{multiple\}/g, isMulti ? getLang("multiple2") : getLang("multiple1"))
                    .replace(/\{session\}/g,
                        hours <= 10 ? getLang("session1") :
                        hours <= 12 ? getLang("session2") :
                        hours <= 18 ? getLang("session3") :
                        getLang("session4")
                    );

            const media = await module.exports.getMedia("1Njmd3lDO0h0YYcTBearl5g5wcG05O4EV");

            await message.send({
                body,
                mentions,
                attachment: media
            });

            delete global.temp.welcomeEvent[threadID];

        }, 1500);
    }
};
