const { getTime, drive } = global.utils;

if (!global.temp.welcomeEvent)
    global.temp.welcomeEvent = {};

module.exports = {
    config: {
        name: "welcome",
        version: "2.0-multi-fix",
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

    onStart: async ({ threadsData, message, event, api, getLang }) => {
        if (event.logMessageType !== "log:subscribe") return;

        const { threadID } = event;
        const prefix = global.utils.getPrefix(threadID);
        const hours = getTime("HH");
        const dataAddedParticipants = event.logMessageData.addedParticipants;

        // If bot added
        if (dataAddedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
            const video = await drive.getFile("1pY-tr_hKajxwhN9Jzl49hmTIBiZPmC8u", "stream");
            return message.send({
                body: `Thanks for adding me! Bot prefix: ${prefix}`,
                attachment: video
            });
        }

        // New member join
        if (!global.temp.welcomeEvent[threadID])
            global.temp.welcomeEvent[threadID] = { joinTimeout: null, list: [] };

        const temp = global.temp.welcomeEvent[threadID];
        temp.list.push(...dataAddedParticipants);

        clearTimeout(temp.joinTimeout);

        temp.joinTimeout = setTimeout(async () => {
            const threadData = await threadsData.get(threadID);
            if (threadData.settings.sendWelcomeMessage === false) return;

            const joined = temp.list;
            const threadName = threadData.threadName;
            const banned = threadData.data.banned_ban || [];

            const names = [];
            const mentions = [];

            for (const user of joined) {
                if (banned.some(b => b.id == user.userFbId)) continue;

                names.push(user.fullName);
                mentions.push({ tag: user.fullName, id: user.userFbId });
            }

            if (!names.length) return;

            const isMulti = names.length > 1;
            const userListText = names.map((n, i) => `${i + 1}. ${n}`).join("\n");

            let welcomeMessage = threadData.data.welcomeMessage || getLang("defaultWelcomeMessage");

            const body = welcomeMessage
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

            const video = await drive.getFile("1Njmd3lDO0h0YYcTBearl5g5wcG05O4EV", "stream");

            await message.send({
                body,
                mentions,
                attachment: video
            });

            delete global.temp.welcomeEvent[threadID];
        }, 1500);
    }
};
