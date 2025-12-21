const axios = require("axios");

let cachedBaseUrl = null;
const baseApiUrl = async () => {
  if (cachedBaseUrl) return cachedBaseUrl;
  const res = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
  );
  cachedBaseUrl = res.data.mahmud;
  return cachedBaseUrl;
};

module.exports = {
  config: {
    name: "say",
    version: "2.1",
    author: "AYAN BBE💋",
    countDown: 5,
    role: 0,
    category: "media",
    guide: "{pn} <text> (or reply)",
  },

  onStart: async function ({ api, message, args, event, Currencies, usersData }) {
    const COST = 5000;
    const senderID = event.senderID;

    // text collect
    let text = (args.join(" ") || event.messageReply?.body || "").trim();
    if (!text) {
      return message.reply("⚠️ দয়া করে কিছু লিখুন বা একটি মেসেজে রিপ্লাই দিন!");
    }

    try {
      // ================= CHECK VIP =================
      const isVip = await usersData.getVip(senderID);

      if (!isVip) {
        /* ================= BALANCE CHECK ================= */
        const userData = await Currencies.getData(senderID);
        const userMoney = userData.money || 0;

        if (userMoney < COST) {
          return message.reply(
            `❌ Balance insufficient!\nএই কমান্ড ইউজ করতে লাগবে 💰 ${COST} balance\nতোমার আছে: ${userMoney}`
          );
        }
      }

      /* ================= API CALL ================= */
      const baseUrl = await baseApiUrl();
      const response = await axios.get(`${baseUrl}/api/say`, {
        params: { text },
        headers: { Author: module.exports.config.author },
        responseType: "stream",
      });

      /* ================= SEND RESULT ================= */
      await message.reply({
        body: "",
        attachment: response.data,
      });

      /* ================= BALANCE TRANSFER ================= */
      if (!isVip) {
        // user balance cut
        await Currencies.decreaseMoney(senderID, COST);
        // owner balance add
        const ownerID = global.config.ADMINBOT[0]; // first owner
        await Currencies.increaseMoney(ownerID, COST);
      }

    } catch (e) {
      console.error("API Error:", e);
      message.reply(
        "🐥 দুঃখিত, কিছু একটা সমস্যা হয়েছে!\n" +
        (e.response?.data?.error || e.message)
      );
    }
  },
};
