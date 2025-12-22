const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const cacheDir = path.join(__dirname, 'cache');

module.exports = {
  config: {
    name: "guess",
    aliases: ["enemy", "animepic"],
    version: "1.3",
    author: "Mahu • VIP by Maya",
    role: 0,
    shortDescription: "Guess the anime character (VIP only)",
    longDescription: "Guess the name of the anime character based on traits and tags with random images.",
    category: "game",
    guide: { en: "{p}guess (VIP only)" }
  },

  onStart: async function ({ event, message, usersData, api }) {
    try {
      /* ===== VIP CHECK ===== */
      const userData = await usersData.get(event.senderID);
      if (!userData || userData.vip !== true) {
        return message.reply(
          "🔒 এই গেমটি শুধুমাত্র VIP user দের জন্য\n💎 VIP নিতে Admin এর সাথে যোগাযোগ করো"
        );
      }
      /* ===================== */

      const response = await axios.get('https://global-prime-mahis-apis.vercel.app');
      const characters = response.data.data;

      const charactersArray = Array.isArray(characters)
        ? characters
        : [characters];

      const randomIndex = Math.floor(Math.random() * charactersArray.length);
      const { image, traits, tags, fullName, firstName } =
        charactersArray[randomIndex];

      await fs.ensureDir(cacheDir);

      const imagePath = path.join(cacheDir, "character.jpg");
      const imageRes = await axios.get(image, { responseType: 'arraybuffer' });
      await fs.writeFile(imagePath, imageRes.data);

      const gameMsg =
        `🎮 Guess this anime character (VIP)\n\n` +
        `🧬 Traits: ${traits}\n` +
        `🏷️ Tags: ${tags}`;

      const sentMsg = await message.reply({
        body: gameMsg,
        attachment: fs.createReadStream(imagePath)
      });

      global.GoatBot.onReply.set(sentMsg.messageID, {
        commandName: this.config.name,
        messageID: sentMsg.messageID,
        correctAnswer: [fullName, firstName],
        senderID: event.senderID
      });

      setTimeout(async () => {
        try {
          await api.unsendMessage(sentMsg.messageID);
          await fs.unlink(imagePath);
        } catch {}
      }, 15000);

    } catch (err) {
      console.error("Guess Game Error:", err);
      message.reply("❌ গেম শুরু করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করো।");
    }
  },

  onReply: async function ({ message, event, Reply, api, usersData }) {
    try {
      if (event.senderID !== Reply.senderID) return;

      const userAnswer = event.body.trim().toLowerCase();
      const correctAnswers = Reply.correctAnswer.map(a => a.toLowerCase());

      if (correctAnswers.includes(userAnswer)) {
        const reward = 1000;
        const current = (await usersData.get(event.senderID, "money")) || 0;
        const newBalance = current + reward;

        await usersData.set(event.senderID, { money: newBalance });

        await message.reply(
          `✨ Correct Answer! 🎉\n💰 Reward: ${reward}$\n💳 Balance: ${newBalance}$`
        );
      } else {
        await message.reply(
          `❌ Wrong!\n✅ Correct Answer: ${Reply.correctAnswer.join(" / ")}`
        );
      }

      await api.unsendMessage(Reply.messageID);
      await api.unsendMessage(event.messageID);

    } catch (err) {
      console.error("Guess onReply Error:", err);
    }
  }
};
