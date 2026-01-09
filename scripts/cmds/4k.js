const axios = require("axios");

module.exports = {
  config: {
    name: "4k",
    aliases: ["upscale"],
    version: "1.5",
    role: 0,
    author: "Ayan • Fixed by Maya",
    countDown: 5,
    longDescription: "Upscale images to 4K resolution",
    category: "image",
    guide: {
      en: "{pn} reply to an image to upscale it"
    }
  },

  onStart: async function ({ message, event }) {
    let waitMsg;
    try {
      const reply = event.messageReply;

      if (
        !reply ||
        !reply.attachments ||
        !reply.attachments.length ||
        reply.attachments[0].type !== "photo"
      ) {
        return message.reply("📸 অনুগ্রহ করে একটি ছবিতে reply দিয়ে কমান্ড ব্যবহার করো");
      }

      const imageUrl = reply.attachments[0].url;
      const apiUrl = "https://aryan-xyz-upscale-api-phi.vercel.app/api/upscale-image";

      waitMsg = await message.reply("⚙️ 4K তে convert হচ্ছে...\n⏳ একটু অপেক্ষা করো");

      const res = await axios.get(apiUrl, {
        params: {
          imageUrl: imageUrl,
          apikey: "ArYANAHMEDRUDRO"
        },
        timeout: 30000
      });

      if (!res.data || !res.data.resultImageUrl) {
        throw new Error("API response invalid");
      }

      const stream = await global.utils.getStreamFromURL(
        res.data.resultImageUrl,
        "4k-upscaled.png"
      );

      if (waitMsg?.messageID) {
        await message.unsend(waitMsg.messageID);
      }

      await message.reply({
        body: "✅ 4K Upscale Complete ☘️",
        attachment: stream
      });

    } catch (err) {
      console.error("❌ 4K Upscale Error:", err);

      if (waitMsg?.messageID) {
        message.unsend(waitMsg.messageID).catch(() => {});
      }

      message.reply(
        "❌ ছবি upscale করতে সমস্যা হয়েছে\n🔁 পরে আবার চেষ্টা করো"
      );
    }
  }
};
