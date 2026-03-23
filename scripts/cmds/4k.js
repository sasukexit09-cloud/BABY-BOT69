const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

/**
* @author MahMUD
* @author: do not delete it
*/

module.exports = {
  config: {
    name: "4k",
    version: "1.7",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "image",
    description: "Enhance or restore image quality using 4k AI.",
    guide: {
      en: "{pn} [url] or reply with image"
    }
  },

  onStart: async function ({ message, event, args }) {

    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68); 
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
    }
    const startTime = Date.now();
    let imgUrl;

    if (event.messageReply?.attachments?.[0]?.type === "photo") {
      imgUrl = event.messageReply.attachments[0].url;
    }

    else if (args[0]) {
      imgUrl = args.join(" ");
    }

    if (!imgUrl) {
      return message.reply("Baby, Please reply to an image or provide an image URL");
    }

    const waitMsg = await message.reply("🍰 𝙻𝙾𝙰𝙳𝙸𝙽𝙶 4𝙺 𝙸𝙼𝙰𝙶𝙴...𝚆𝙰𝙸𝚃 𝙱𝙰𝙱𝚈 <🍇");
    message.reaction("🍭", event.messageID);

    try {

      const apiUrl = `${await mahmud()}/api/hd?imgUrl=${encodeURIComponent(imgUrl)}`;

      const res = await axios.get(apiUrl, { responseType: "stream" });
      if (waitMsg?.messageID) message.unsend(waitMsg.messageID);

      message.reaction("🍰", event.messageID);

      const processTime = ((Date.now() - startTime) / 1000).toFixed(2);

      message.reply({
        body: `🍓 𝙴𝙸 𝙽𝙴𝚄 𝙱𝙱𝙴 𝚃𝚄𝙼𝙰𝚁 𝙴𝙽𝙷𝙰𝙽𝙲𝙴𝙳 𝙸𝙼𝙰𝙶𝙴 🍨`,
        attachment: res.data
      });

    } catch (error) {

      if (waitMsg?.messageID) message.unsend(waitMsg.messageID);

      message.reaction("😌", event.messageID);
      message.reply(`🐱𝙴𝚁𝙾𝚁𝚁 𝙱𝙰𝙱𝚈 𝙲𝙾𝙽𝚃𝙰𝙲𝚃 𝙰𝙳𝙼𝙸𝙽`);
    }
  }
};