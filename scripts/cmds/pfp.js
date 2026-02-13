const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "pp",
    aliases: ["pfp", "dp", "profile"],
    version: "3.0-HD",
    author: "MahMUD","𝙰𝚈𝙰𝙽 𝙱𝙱𝙴 𝙵𝙸𝚇𝙴𝙳"
    role: 0,
    category: "media",
    shortDescription: "Get HD enhanced profile picture"
  },

  onStart: async function ({ api, message, event, args }) {

    // 🔐 Author Protection
    const realAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
    if (module.exports.config.author !== realAuthor) {
      return api.sendMessage(
        "⚠️ You are not allowed to change author name.",
        event.threadID,
        event.messageID
      );
    }

    try {
      let target =
        Object.keys(event.mentions || {})[0] ||
        event.messageReply?.senderID ||
        args[0] ||
        event.senderID;

      if (!target) target = event.senderID;

      const base = await baseApiUrl();

      // 🔥 HD API Call
      const apiUrl = `${base}/api/pfp?mahmud=${encodeURIComponent(target)}&hd=1&enhance=1`;

      let response;

      try {
        response = await axios.get(apiUrl, {
          responseType: "stream",
          timeout: 15000
        });
      } catch {
        // 🔁 Facebook Graph Fallback (Highest Possible Size)
        const fallbackUrl = `https://graph.facebook.com/${target}/picture?width=4000&height=4000`;
        response = await axios.get(fallbackUrl, {
          responseType: "stream"
        });
      }

      return message.reply({
        body: "🍭𝙴𝙸 𝙽𝙴𝚆 𝙱𝙱𝚈 𝚃𝚄𝙼𝙰𝚁 𝙿𝙵 𝙿𝙸𝙲 🍨",
        attachment: response.data
      });

    } catch (error) {
      console.log(error?.response?.status, error?.message);
      return message.reply("𝙶𝚄 𝙺𝙷𝙰 𝙵𝙸𝙻𝙴 𝙴 𝙿𝙻𝙼 𝙰𝙼𝙸 𝙱𝙾𝚂𝚂 𝙴𝚁 𝚂𝙰𝚃𝙷𝙴 𝙺𝙾𝚃𝙷𝙰 𝙱𝙾𝙻𝙴 𝙳𝙴𝙺𝙷𝙲𝙷𝙸 🍨.");
    }
  }
};