module.exports = {
  config: {
    name: "profile",
    aliases: ["pp"],
    version: "1.4",
    author: "Tarek Shikdar (fixed UID input support)",
    countDown: 5,
    role: 0,
    shortDescription: "Show profile picture",
    longDescription: "Get profile picture, UID, and profile link of yourself or any user",
    category: "image",
    guide: {
      en: "{pn} [@tag | reply | UID]\n- No input: shows your own profile picture\n- @mention: shows mentioned user's profile pic\n- Reply: shows replied user's pic\n- UID: show profile picture of specific UID"
    }
  },

  langs: {
    en: {
      noTag: "You must tag or reply to someone to get their profile picture"
    }
  },

  onStart: async function ({ event, message, usersData, args }) {
    let uid;

    if (args[0] && /^\d{8,20}$/.test(args[0])) {
      // UID directly provided
      uid = args[0];
    } else if (event.type === "message_reply") {
      uid = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } else {
      uid = event.senderID;
    }

    try {
      const avatarUrl = await usersData.getAvatarUrl(uid);
      const userInfo = await usersData.get(uid);
      const name = userInfo?.name || "Unknown";

      const stream = await global.utils.getStreamFromURL(avatarUrl);

      message.reply({
        body: `👤 Name: ${name}\n🔎 UID: ${uid}\n🔗 Link: https://facebook.com/${uid}`,
        attachment: stream
      });
    } catch (err) {
      message.reply("❌ Couldn't fetch profile info or picture.");
      console.error(err);
    }
  }
};
