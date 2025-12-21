const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "hug",
    aliases: ["hug"],
    version: "1.3",
    author: "AYAN⚡",
    countDown: 5,
    role: 0,
    shortDescription: "Give someone a hug! (VIP only)",
    longDescription: "A fun command to give someone a hug with a picture. Only for VIP users.",
    category: "fun",
    guide: "{pn} @mention or reply",
  },

  // Example VIP check function
  isVIP: async function(userID) {
    const vipUsers = ["1234567890", "9876543210"]; // এখানে VIP users list
    return vipUsers.includes(userID);
  },

  onStart: async function ({ event, api, usersData }) {
    const senderID = event.senderID;

    // VIP check
    if (!await this.isVIP(senderID)) {
      return api.sendMessage("❌ এই কমান্ডটি শুধুমাত্র VIP user এর জন্য।", event.threadID, event.messageID);
    }

    const mention = Object.keys(event.mentions)[0];
    const targetID = mention || event.messageReply?.senderID;

    if (!targetID)
      return api.sendMessage(
        "Who would you like to hug? Please tag someone or reply to a message!",
        event.threadID,
        event.messageID
      );

    const getAvatar = async (uid) => {
      try {
        const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarPath = path.join(__dirname, `${uid}_avatar.png`);
        const res = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(avatarPath, res.data);
        return avatarPath;
      } catch (err) {
        console.error(`Error fetching avatar for user ${uid}: ${err.message}`);
        return path.join(__dirname, "default_avatar.png");
      }
    };

    try {
      const bg = await loadImage("https://i.imgur.com/eUNHCj3.jpeg");
      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bg, 0, 0);

      const huggerAvatarPath = await getAvatar(senderID);
      const targetAvatarPath = await getAvatar(targetID);

      const huggerAvatar = await loadImage(huggerAvatarPath);
      const targetAvatar = await loadImage(targetAvatarPath);

      // Hugger Avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(285, 110, 50, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(huggerAvatar, 235, 60, 100, 100);
      ctx.restore();

      // Target Avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(460, 160, 50, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(targetAvatar, 410, 110, 100, 100);
      ctx.restore();

      const output = path.join(__dirname, "hug_output.png");
      fs.writeFileSync(output, canvas.toBuffer("image/png"));

      const senderName = await usersData.getName(senderID);
      const targetName = event.mentions[mention] || (event.messageReply?.senderName || "Friend");

      api.sendMessage(
        {
          body: `😍 I've just hugged ${targetName}!\n${senderName} is giving a warm hug to ${targetName}!`,
          attachment: fs.createReadStream(output),
          mentions: [{ tag: targetName, id: targetID }],
        },
        event.threadID,
        () => {
          [output, huggerAvatarPath, targetAvatarPath].forEach((file) => {
            try { fs.unlinkSync(file); } catch (err) {}
          });
        },
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.sendMessage("⚠️ Something went wrong while creating the hug image.", event.threadID, event.messageID);
    }
  },
};
