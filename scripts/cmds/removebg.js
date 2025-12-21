const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
    config: {
      name: "rbg",
      aliases: [],
      author: "Hazeyy/kira",
      version: "69",
      cooldowns: 5,
      role: 0,
      shortDescription: { en: "Remove background in your photo" },
      longDescription: { en: "Remove background in your photo" },
      category: "img",
      guide: { en: "{p}{n} [reply to an img]" }
    },

    onStart: async function({ api, event, usersData }) {
        const { senderID, threadID, messageID } = event;

        // ===== VIP CHECK =====
        const userData = await usersData.get(senderID);
        if (!userData || userData.vip !== true) {
            return api.sendMessage(
                "🔒 | **VIP ONLY**\n\n🥺 Baby, তুমি VIP না। VIP নাও তারপর এই কমান্ড ব্যবহার করো 💋",
                threadID,
                messageID
            );
        }
        // =====================

        const args = event.body.split(/\s+/);
        args.shift();

        try {
            const response = await axios.get("https://hazeyy-apis-combine.kyrinwu.repl.co");
            if (response.data.hasOwnProperty("error")) {
              return api.sendMessage(response.data.error, threadID, messageID);
            }

            const pathie = __dirname + `/cache/removed_bg.jpg`;
            let photoUrl = event.messageReply ? event.messageReply.attachments[0].url : args.join(" ");

            if (!photoUrl) {
              api.sendMessage("📸 𝖯𝗅𝖾𝖺𝗌𝖾 𝗋𝖾𝗉𝗅𝗎 𝗍𝗈 𝖺 𝗉𝗁𝗈𝗍𝗈 𝗍𝗈 𝗉𝗋𝗈𝖼𝖾𝗌𝗌 𝖺𝗇𝖽 𝗋𝖾𝗆𝗈𝗏𝖾 𝖻𝖺𝖼𝗄𝗀𝗋𝗈𝗎𝗇𝖽𝗌.", threadID, messageID);
              return;
            }

            api.sendMessage("🕟 | 𝖱𝖾𝗆𝗈𝗏𝗂𝗇𝗀 𝖡𝖺𝖼𝗄𝗀𝗋𝗈𝗎𝗇𝖽, 𝗉𝗅𝖾𝖺𝗌𝖾 𝗐𝖺𝗂𝗍...", threadID, async () => {
              try {
                const response = await axios.get(`https://hazeyy-apis-combine.kyrinwu.repl.co/api/try/removebg?url=${encodeURIComponent(photoUrl)}`);
                const processedImageURL = response.data.image_data;

                const img = (await axios.get(processedImageURL, { responseType: "arraybuffer" })).data;
                fs.writeFileSync(pathie, Buffer.from(img, 'binary'));

                api.sendMessage({
                  body: "✨ 𝖧𝖾𝗋𝖾'𝗌 𝗒𝗈𝗎𝗋 𝗂𝗆𝖺𝗀𝖾 𝗐𝗂𝗍𝗁𝗈𝗎𝗍 𝖻𝖺𝖼𝗄𝗀𝗋𝗈𝗎𝗇𝖽",
                  attachment: fs.createReadStream(pathie)
                }, threadID, () => fs.unlinkSync(pathie), messageID);
              } catch (error) {
                api.sendMessage(`🔴 𝖤𝗋𝗋𝗈𝗋 𝗉𝗋𝗈𝖢𝖾𝗌𝗌𝗂𝗇𝗀: ${error}`, threadID, messageID);
              }
            });
        } catch (error) {
            api.sendMessage(`𝖤𝗋𝗋𝗈𝗋: ${error.message}`, threadID, messageID);
        }
    }
};
