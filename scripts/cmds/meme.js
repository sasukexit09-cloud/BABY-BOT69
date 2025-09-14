const axios = require("axios");

module.exports = {
  config: {
    name: "meme",
    aliases: ["memes"],
    version: "1.2",
    author: "Tarek",
    countDown: 5,
    role: 0,
    shortDescription: "Send, add or list memes",
    longDescription: "Reply to a photo with /meme to save it, use /meme to get a random meme, or /meme list to see total memes",
    category: "fun"
  },

  onStart: async function ({ message, event, args }) {
    // ✅ Reply with photo to add meme
    if (args[0] !== "list" && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
      const attachment = event.messageReply.attachments[0];
      if (attachment.type !== "photo") {
        return message.reply("⚠️ Only photo replies are allowed for saving memes!");
      }

      const url = attachment.url;

      try {
        const apiRes = await axios.post("https://meme-s.onrender.com/add-meme", { url });

        if (apiRes.data.success) {
          return message.reply("✅ Meme added successfully!\n" + url);
        } else {
          return message.reply("⚠️ " + apiRes.data.message);
        }
      } catch (err) {
        console.error(err);
        return message.reply("❌ Failed to save meme. API error!");
      }
    } 
    
    // ✅ Show total meme count
    else if (args[0] === "list") {
      try {
        const apiRes = await axios.get("https://meme-s.onrender.com/json");
        const memes = apiRes.data;
        return message.reply(`📂 Total memes in API: **${memes.length}**`);
      } catch (err) {
        console.error(err);
        return message.reply("❌ Failed to fetch meme list from API.");
      }
    }

    // ✅ Random meme send
    else {
      try {
        const apiRes = await axios.get("https://meme-s.onrender.com/json");
        const memes = apiRes.data;

        if (!memes || memes.length === 0) {
          return message.reply("😕 No memes found in the API.");
        }

        const randomMeme = memes[Math.floor(Math.random() * memes.length)];
        return message.reply({ body: "🤣 Here’s your meme:", attachment: await global.utils.getStreamFromURL(randomMeme) });

      } catch (err) {
        console.error(err);
        return message.reply("❌ Failed to fetch memes from API.");
      }
    }
  }
};
