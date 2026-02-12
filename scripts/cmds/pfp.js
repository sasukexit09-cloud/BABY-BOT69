const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "profile",
    aliases: ["pp", "dp", "pfp"],
    version: "3.0.0",
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴 (4K Edition)",
    countDown: 3,
    role: 0,
    shortDescription: "View Facebook profile picture (4K Ultra HD)",
    category: "utility",
    guide: {
      en: "{pn} [reply/@mention/link/uid]"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const cacheFolder = path.join(__dirname, "cache");
      const cachePath = path.join(cacheFolder, `profile_${Date.now()}.jpg`);

      if (!fs.existsSync(cacheFolder)) {
        fs.mkdirSync(cacheFolder, { recursive: true });
      }

      let uid;

      // Reply
      if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
      }

      // Mention
      else if (Object.keys(event.mentions || {}).length > 0) {
        uid = Object.keys(event.mentions)[0];
      }

      // Direct UID
      else if (args[0] && /^\d+$/.test(args[0])) {
        uid = args[0];
      }

      // Facebook Link
      else if (args[0] && args[0].includes("facebook.com")) {
        try {
          uid = await api.getUID(args[0]);
        } catch {
          return api.sendMessage(
            "❌ Invalid Facebook link!",
            event.threadID,
            event.messageID
          );
        }
      }

      // Default নিজের
      else {
        uid = event.senderID;
      }

      // 🔥 4K FORCE (Max 4000x4000)
      const imageUrl = `https://graph.facebook.com/${uid}/picture?width=4000&height=4000&redirect=false`;

      const response = await axios.get(imageUrl);
      const finalImageUrl = response.data.data.url;

      const stream = await axios({
        url: finalImageUrl,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(cachePath);
      stream.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body🍨𝙱𝙰𝙱𝚈 𝙽𝙴𝚄 𝚃𝚄𝙼𝙰𝚁 𝙿𝚁𝙾𝙵𝙸𝙻𝙴 𝙿𝙸𝙲🍇\n🆔 UID: ${uid}`,
            attachment: fs.createReadStream(cachePath)
          },
          event.threadID,
          () => fs.unlinkSync(cachePath),
          event.messageID
        );
      });

      writer.on("error", () => {
        api.sendMessage(
          "❌ Failed to fetch 4K image.",
          event.threadID,
          event.messageID
        );
      });

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "⚠️ Something went wrong while fetching 4K image.",
        event.threadID,
        event.messageID
      );
    }
  }
};