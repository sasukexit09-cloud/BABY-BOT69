module.exports = {
  config: {
    name: "spy",
    version: "3.0",
    author: "T A N J I L 🎀",
    countDown: 5,
    role: 0,
    shortDescription: "See detailed user info",
    longDescription: "Fetch full profile info including name, UID, gender, balance, and more.",
    category: "image",
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    const uid1 = event.senderID;
    const uid2 = Object.keys(event.mentions)[0];
    let uid;

    if (args[0]) {
      if (/^\d+$/.test(args[0])) {
        uid = args[0];
      } else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) uid = match[1];
      }
    }

    if (!uid) {
      uid = event.type === "message_reply"
        ? event.messageReply.senderID
        : uid2 || uid1;
    }

    try {
      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo(uid, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      const avatarUrl = await usersData.getAvatarUrl(uid);
      const data = await usersData.get(uid);
      const senderInfo = await usersData.get(event.senderID);
      const senderName = senderInfo.name || "User";

      const name = userInfo[uid].name || "Unknown";
      const gender = userInfo[uid].gender === 1 ? "Female" : userInfo[uid].gender === 2 ? "Male" : "Unknown";
      const isFriend = userInfo[uid].isFriend ? "Yes" : "No";
      const isBirthday = userInfo[uid].isBirthday ? "Yes" : "Private";
      const profileUrl = `https://www.facebook.com/${uid}`;
      const balance = data.money || 0;
      const exp = data.exp || 0;
      const level = Math.floor(0.1 * Math.sqrt(exp));

      const threadNickname = event.threadID && uid ? (await api.getThreadInfo(event.threadID)).nicknames?.[uid] : null;
      const nickname = threadNickname || "Not set in group";

      const allUsers = await usersData.getAll();
      const sortedUsers = allUsers
        .filter(user => typeof user.money === 'number')
        .sort((a, b) => b.money - a.money);
      const userRankIndex = sortedUsers.findIndex(user => user.userID === uid);
      const rankPosition = userRankIndex !== -1 ? `Rank ${userRankIndex + 1}` : "Unranked";

      const fancyInfo =
`╭─[ 🧊 User Info Panel ]──╮
│ 🆔 UID         : ${uid}
│ 👤 Name        : ${name}
│ 🏷️ Nickname    : ${nickname}
│ 
│ 💵 Balance     : $${balance}
│ 📚 EXP         : ${exp}
│ 🔢 Level       : ${level}
│ 🏆 Rank        : ${rankPosition}
│ 
│ 🚻 Gender      : ${gender}
│ 🎂 Birthday    : ${isBirthday}
│ 💘 Status      : Single
│ 🤝 Friend      : ${isFriend}
│ 🌐 Profile Link:
│ ${profileUrl}
╰─────────────────╯`;

      return message.reply({
        body: fancyInfo,
        attachment: await global.utils.getStreamFromURL(avatarUrl)
      });

    } catch (e) {
      console.error(e);
      return message.reply("⚠️ Could not fetch user data.");
    }
  }
};
