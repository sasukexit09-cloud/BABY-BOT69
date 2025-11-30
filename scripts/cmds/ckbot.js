const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
    name: "ckbot",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "𝐀𝐘𝐀𝐍 𝐀𝐇𝐌𝐄𝐃𝐙 + Maya Optimized",
    description: "User/Group/Admin Info fetch system",
    commandCategory: "Media",
    usages: "[user/@tag | box | admin]",
    cooldowns: 4,
};

module.exports.onStart = async ({ api, event, args }) => {
    const threadSetting = global.data.threadData.get(parseInt(event.threadID)) || {};
    const prefix = threadSetting.PREFIX || global.config.PREFIX;

    // Show Help
    if (!args[0]) {
        return api.sendMessage(
            `✅ Available commands:\n\n`+
            `• ${prefix}${this.config.name} user → Your info\n` +
            `• ${prefix}${this.config.name} user @tag → Tagged user info\n` +
            `• ${prefix}${this.config.name} box → Group info\n` +
            `• ${prefix}${this.config.name} admin → Bot admin info`,
            event.threadID, event.messageID
        );
    }

    // ========== BOX INFO ==========
    if (args[0].toLowerCase() == "box") {
        try {
            let id = args[1] || event.threadID;
            let info = await api.getThreadInfo(id);
            let male = info.userInfo.filter(u => u.gender === "MALE").length;
            let female = info.userInfo.filter(u => u.gender === "FEMALE").length;
            let msg =
`📌 Group Name: ${info.threadName}
🆔 Group ID: ${id}
👥 Members: ${info.participantIDs.length}
👑 Admins: ${info.adminIDs.length}
♂️ Male: ${male}   ♀️ Female: ${female}
💬 Total Messages: ${info.messageCount}
✅ Approval Mode: ${info.approvalMode ? "On" : "Off"}
😎 Emoji: ${info.emoji}`;

            if (!info.imageSrc) return api.sendMessage(msg, event.threadID);

            const imgPath = __dirname + `/cache/box.png`;
            let img = await axios.get(info.imageSrc, { responseType: "arraybuffer" });
            fs.writeFileSync(imgPath, img.data);

            return api.sendMessage(
                { body: msg, attachment: fs.createReadStream(imgPath) },
                event.threadID,
                () => fs.unlinkSync(imgPath)
            );

        } catch (e) {
            return api.sendMessage("❌ Could not fetch group info.", event.threadID);
        }
    }

    // ========== OWNER / ADMIN INFO ==========
    if (args[0].toLowerCase() == "admin") {
        const uid = "61582355550594";
        const imgPath = __dirname + `/cache/admin.png`;

        let img = await axios.get(`https://graph.facebook.com/${uid}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });
        fs.writeFileSync(imgPath, img.data);

        return api.sendMessage({
            body: `👑 BOT OWNER INFO\n\n🧑‍💻 Name: 𝐀𝐘𝐀𝐍 𝐀𝐇𝐌𝐄𝐃𝐙\n🔗 FB: facebook.com/${uid}\n🤖 Thanks for using ${global.config.BOTNAME}!`,
            attachment: fs.createReadStream(imgPath)
        }, event.threadID, () => fs.unlinkSync(imgPath));
    }

    // ========== USER INFO ==========
    if (args[0].toLowerCase() == "user") {
        let id = event.senderID;

        if (event.type == "message_reply") id = event.messageReply.senderID;
        if (Object.keys(event.mentions).length > 0) id = Object.keys(event.mentions)[0];
        if (args[1] && !isNaN(args[1])) id = args[1];

        let data = await api.getUserInfo(id);
        let user = data[id];

        const imgPath = __dirname + `/cache/user.png`;
        let img = await axios.get(`https://graph.facebook.com/${id}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });
        fs.writeFileSync(imgPath, img.data);

        let link = user.vanity ? `facebook.com/${user.vanity}` : `facebook.com/profile.php?id=${id}`;
        let gender = user.gender == 2 ? "Male" : user.gender == 1 ? "Female" : "Unknown";

        return api.sendMessage({
            body:
`👤 USER INFO
🧑 Name: ${user.name}
🔗 Profile: ${link}
🆔 UID: ${id}
⚧️ Gender: ${gender}
🤝 Friend with bot: ${user.isFriend ? "Yes" : "No"}`,
            attachment: fs.createReadStream(imgPath)
        }, event.threadID, () => fs.unlinkSync(imgPath));
    }
};
