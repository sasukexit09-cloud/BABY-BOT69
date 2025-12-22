const axios = require("axios");

module.exports = {
  config: {
    name: "4k",
    aliases: ["upscale"],
    version: "1.3",
    role: 0,
    author: "ArYAN • VIP by Maya",
    countDown: 5,
    longDescription: "Upscale images to 4K resolution (VIP only)",
    category: "image",
    guide: {
      en: "{pn} reply to an image to upscale it (VIP only)"
    }
  },

  onStart: async function ({ message, event, usersData }) {
    try {
      /* ===== VIP CHECK ===== */
      const userData = await usersData.get(event.senderID);

      if (!userData || userData.vip !== true) {
        return message.reply(
          "🔒 এই কমান্ডটি শুধু VIP user দের জন্য\n💎 VIP নিতে Admin এর সাথে যোগাযোগ করো বা —!vip buy কমান্ড দিয়ে vip কিনুন"
        );
      }
      /* ===================== */

      const reply = event.messageReply;

      if (
        !reply ||
        !reply.attachments ||
        !reply.attachments[0] ||
        reply.attachments[0].type !== "photo"
      ) {
        return message.reply("📸 অনুগ্রহ করে একটি ছবিতে reply দিয়ে কমান্ড ব্যবহার করো");
      }

      const imageUrl = reply.attachments[0].url;
      const apiUrl =
        "https://aryan-xyz-upscale-api-phi.vercel.app/api/upscale-image";

      const waitMsg = await message.reply("⚙️ 4K তে convert হচ্ছে... অপেক্ষা করো");

      const { data } = await axios.get(apiUrl, {
        params: {
          imageUrl,
          apikey: "ArYANAHMEDRUDRO"
        },
        timeout: 30000
      });

      if (!data || !data.resultImageUrl) {
        throw new Error("Invalid API response");
      }

      const stream = await global.utils.getStreamFromURL(
        data.resultImageUrl,
        "4k-upscaled.png"
      );

      await message.reply({
        body: "✅ 4K Upscale Complete ☘️",
        attachment: stream
      });

      if (waitMsg?.messageID) {
        message.unsend(waitMsg.messageID);
      }

    } catch (err) {
      console.error("4K VIP Upscale Error:", err);
      message.reply("❌ ছবি upscale করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করো।");
    }
  }
};
