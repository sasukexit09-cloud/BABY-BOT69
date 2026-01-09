module.exports.config = {
    name: "ban",
    version: "4.0.0",
    hasPermssion: 2,
    credits: "Ayan",
    description: "Ban user by mention বা reply",
    commandCategory: "system",
    usages: "-ban @mention বা রিপ্লাই করে -ban",
    cooldowns: 0
};

module.exports.run = async ({ event, api, Users, args }) => {
    const { threadID, messageID } = event;
    let targetID;

    // =============== METHOD 1: mention দিয়ে ban ===============
    if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
    }

    // =============== METHOD 2: reply দিয়ে ban ===============
    else if (event.type === "message_reply") {
        targetID = event.messageReply.senderID;
    }

    // =============== METHOD 3: কিছু না দিলে error ===============
    else {
        return api.sendMessage(
            "❌ কাকে ban করবে? Mention দাও অথবা রিপ্লাই করো!",
            threadID,
            messageID
        );
    }

    // User data collect
    let data = (await Users.getData(targetID)).data || {};

    data.banned = 1;
    data.reason = "Manual BAN by admin";
    data.dateAdded = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Dhaka"
    });

    // Save user ban data
    await Users.setData(targetID, { data });

    // Global system update (same as your anti-abuse code)
    global.data.userBanned.set(targetID, {
        reason: data.reason,
        dateAdded: data.dateAdded
    });

    // Get user name
    const name = await Users.getNameUser(targetID);

    // Notify all admins (same as your previous code)
    const adminList = global.config.ADMINBOT;
    for (const adminID of adminList) {
        api.sendMessage(
`=== BAN Notification ===
👤 Name: ${name}
🆔 UID: ${targetID}
🚫 Status: BANNED
📅 Time: ${data.dateAdded}`,
            adminID
        );
    }

    // Send result
    return api.sendMessage(
        `✅ Successfully BANNED!\n\n🔰 Name: ${name}\n🆔 UID: ${targetID}`,
        threadID
    );
};