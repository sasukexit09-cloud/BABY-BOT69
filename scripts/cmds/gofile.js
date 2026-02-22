const axios = require("axios");

module.exports = {
  config: {
    name: "gofile",
    version: "6.0.0",
    author: "Arafat",
    countDown: 5,
    role: 0,
    shortDescription: "𝐆𝐨𝐅𝐢𝐥𝐞 𝐮𝐩𝐥𝐨𝐚𝐝𝐞𝐫",
    longDescription: "𝐔𝐩𝐥𝐨𝐚𝐝𝐬 𝐘𝐨𝐮𝐫 𝐟𝐢𝐥𝐞𝐬 𝐓𝐞𝐦𝐩𝐨𝐫𝐚𝐫𝐲 𝐨𝐧 𝐆𝐨𝐅𝐢𝐥𝐞 .",
    category: "utility"
  },

  onStart: async function ({ message, event }) {
    try {
      const reply = event.messageReply;

      if (!reply || !reply.attachments || reply.attachments.length === 0) {
        return message.reply("𝐑𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚𝐧𝐲 𝐟𝐢𝐥𝐞 𝐭𝐨 𝐮𝐩𝐥𝐨𝐚𝐝 𝐢𝐭 𝐭𝐨 𝐆𝐨𝐅𝐢𝐥𝐞.");
      }

      message.reply("𝐔𝐩𝐥𝐨𝐚𝐝𝐢𝐧𝐠 𝐘𝐨𝐮𝐫 𝐅𝐢𝐥𝐞...");

      const fileURL = reply.attachments[0].url;
      const fileName = reply.attachments[0].filename || "file";

      // Your secure API
      const apiURL = "https://gofile-api-arafat.vercel.app/upload";

      const resUpload = await axios.post(apiURL, {
        fileUrl: fileURL,
        fileName: fileName
      });

      if (resUpload.data.status !== "ok") {
        return message.reply("𝐔𝐩𝐥𝐨𝐚𝐝 𝐟𝐚𝐢𝐥𝐞𝐝. 𝐏𝐥𝐞𝐚𝐬𝐞 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧.");
      }

      const link = resUpload.data.data.downloadPage;

      return message.reply(
        `𝐅𝐢𝐥𝐞 𝐔𝐩𝐥𝐨𝐚𝐝𝐞𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲\n\n𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐋𝐢𝐧𝐤:\n${link}`
      );

    } catch (err) {
      console.error(err);
      return message.reply("𝐒𝐞𝐜𝐮𝐫𝐞 𝐮𝐩𝐥𝐨𝐚𝐝 𝐟𝐚𝐢𝐥𝐞𝐝. 𝐓𝐫𝐲 𝐚𝐧𝐨𝐭𝐡𝐞𝐫 𝐟𝐢𝐥𝐞.");
    }
  }
};