module.exports.config = {
    name: "group",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Parent group settings.",
    commandCategory: "box",
    usages: "[name/emoji/admin/image/info]",
    cooldowns: 1,
    dependencies: {
        "request": "",
        "fs-extra": ""
    }
};

module.exports.run = async ({ api, event, args }) => {
    const fs = global.nodemodule["fs-extra"];
    const request = global.nodemodule["request"];

    if (!args.length) {
        return api.sendMessage(
            `You can use:\n
/groupemoji [icon]\n
/groupname [new group name]\n
/groupimage [reply to an image to set it as group chat image]\n
/gcadmin [tag] => give admin to the tagged user\n
/groupinfo => Get all group information`,
            event.threadID,
            event.messageID
        );
    }

    // CHANGE GROUP NAME
    if (args[0] === "name") {
        const newName = args.slice(1).join(" ") || (event.messageReply && event.messageReply.body);
        if (!newName) return api.sendMessage("❌ Please provide a new group name.", event.threadID, event.messageID);
        return api.setTitle(newName, event.threadID);
    }

    // CHANGE GROUP EMOJI
    if (args[0] === "emoji") {
        const emoji = args[1] || (event.messageReply && event.messageReply.body);
        if (!emoji) return api.sendMessage("❌ Please provide an emoji.", event.threadID, event.messageID);
        return api.changeThreadEmoji(emoji, event.threadID);
    }

    // GIVE BOT ITSELF ADMIN (ME ADMIN)
    if (args[0] === "me" && args[1] === "admin") {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const botAdmin = threadInfo.adminIDs.find(el => el.id === api.getCurrentUserID());
        if (!botAdmin) return api.sendMessage("❌ Bot must be admin to use this command.", event.threadID, event.messageID);
        if (!global.config.ADMINBOT.includes(event.senderID)) return api.sendMessage("❌ You don't have permission.", event.threadID, event.messageID);
        return api.changeAdminStatus(event.threadID, event.senderID, true);
    }

    // GIVE OR REMOVE ADMIN TO USERS
    if (args[0] === "admin") {
        let targetID;
        if (Object.keys(event.mentions).length) targetID = Object.keys(event.mentions)[0];
        else if (event.messageReply) targetID = event.messageReply.senderID;
        else targetID = args[1];

        if (!targetID) return api.sendMessage("❌ Please tag or reply to a user.", event.threadID, event.messageID);

        const threadInfo = await api.getThreadInfo(event.threadID);
        const senderAdmin = threadInfo.adminIDs.some(ad => ad.id === event.senderID);
        const botAdmin = threadInfo.adminIDs.some(ad => ad.id === api.getCurrentUserID());
        const targetIsAdmin = threadInfo.adminIDs.some(ad => ad.id === targetID);

        if (!senderAdmin) return api.sendMessage("❌ You are not an admin.", event.threadID, event.messageID);
        if (!botAdmin) return api.sendMessage("❌ Bot must be admin to change roles.", event.threadID, event.messageID);

        return api.changeAdminStatus(event.threadID, targetID, !targetIsAdmin);
    }

    // CHANGE GROUP IMAGE
    if (args[0] === "image") {
        if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments.length)
            return api.sendMessage("❌ Reply to an image to set it as group image.", event.threadID, event.messageID);
        if (event.messageReply.attachments.length > 1)
            return api.sendMessage("❌ Please reply to only one image.", event.threadID, event.messageID);

        const callback = () => {
            api.changeGroupImage(fs.createReadStream(__dirname + "/cache/1.png"), event.threadID, () => fs.unlinkSync(__dirname + "/cache/1.png"));
        };

        return request(encodeURI(event.messageReply.attachments[0].url))
            .pipe(fs.createWriteStream(__dirname + '/cache/1.png'))
            .on('close', callback);
    }

    // GROUP INFO
    if (args[0] === "info") {
        const threadInfo = await api.getThreadInfo(event.threadID);

        const totalMembers = threadInfo.participantIDs.length;
        let maleCount = 0, femaleCount = 0, unknownCount = 0;

        for (let userID in threadInfo.userInfo) {
            const gender = threadInfo.userInfo[userID].gender;
            if (gender === 'MALE') maleCount++;
            else if (gender === 'FEMALE') femaleCount++;
            else unknownCount++;
        }

        const adminList = [];
        for (let i of threadInfo.adminIDs) {
            const userInfo = await api.getUserInfo(i.id);
            adminList.push(userInfo[i.id].name);
        }

        const approvalStatus = threadInfo.approvalMode ? '✅ On' : '❎ Off';

        const callback = () => {
            api.sendMessage({
                body: `📌 GC Name: ${threadInfo.threadName}\n🆔 GC ID: ${threadInfo.threadID}\n✅ Approval: ${approvalStatus}\n😀 Emoji: ${threadInfo.emoji}\n\n👥 Members: ${totalMembers}\n♂️ Male: ${maleCount}\n♀️ Female: ${femaleCount}\n❓ Unknown: ${unknownCount}\n\n🛡️ Admins (${adminList.length}):\n• ${adminList.join('\n• ')}\n\n✉️ Total messages: ${threadInfo.messageCount}`,
                attachment: fs.createReadStream(__dirname + '/cache/1.png')
            }, event.threadID, () => fs.unlinkSync(__dirname + '/cache/1.png'), event.messageID);
        };

        return request(encodeURI(threadInfo.imageSrc))
            .pipe(fs.createWriteStream(__dirname + '/cache/1.png'))
            .on('close', callback);
    }
};
