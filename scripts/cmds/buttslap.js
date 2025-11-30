const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "buttslap",
    version: "1.3",
    author: "Amit max ⚡",
    countDown: 5,
    role: 0,
    shortDescription: "Buttslap image",
    longDescription: "Generate a funny buttslap image with tagged users",
    category: "fun",
    guide: { en: "{pn} @tag" }
  },

  langs: {
    vi: { noTag: "Bạn phải tag người muốn đánh mông" },
    en: { noTag: "You must tag the person you want to slap" }
  },

  // On bot start, ensure tmp folder exists
  onStart: async () => {
    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    console.log("✅ buttslap tmp folder ready!");
  },

  onStartCommand: async function ({ event, message, usersData, args, getLang }) {
    try {
      const uid1 = event.senderID;
      const uid2 = Object.keys(event.mentions)[0];

      if (!uid2) return message.reply(getLang("noTag"));

      // Fetch avatars in parallel
      const [avatar1, avatar2] = await Promise.all([
        usersData.getAvatarUrl(uid1),
        usersData.getAvatarUrl(uid2)
      ]);

      // Generate image
      const imgBuffer = await new DIG.Spank().getImage(avatar1, avatar2);

      const filePath = path.join(__dirname, "tmp", `${uid1}_${uid2}_spank.png`);
      fs.writeFileSync(filePath, Buffer.from(imgBuffer));

      const content = args.join(" ").replace(Object.keys(event.mentions)[0], "") || "hehe boii";

      // Send image and cleanup
      message.reply({ body: content, attachment: fs.createReadStream(filePath) }, () => fs.unlinkSync(filePath));
    } catch (err) {
      console.error("❌ buttslap command error:", err);
      message.reply("Something went wrong while generating the buttslap image.");
    }
  }
};
