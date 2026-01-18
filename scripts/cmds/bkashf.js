const axios = require("axios");

module.exports = {
  config: {
    name: "bkashf",
    version: "1.0.1",
    author: "AYAN & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Create a fake Bkash screenshot" },
    category: "fun",
    guide: { en: "{pn} number - transactionID - amount" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const input = args.join(" ");

    // ১. ইনপুট চেক
    if (!input || !input.includes("-")) {
      return api.sendMessage(
        `❌ সঠিক ফরম্যাট ব্যবহার করুন!\nউদাহরণ: {pn} 017xxxxxxxx - TXN12345 - 1000`,
        threadID,
        messageID
      );
    }

    const parts = input.split("-");
    if (parts.length < 3) {
      return api.sendMessage("⚠️ দয়া করে নম্বর, ট্রানজ্যাকশন আইডি এবং টাকার পরিমাণ—তিনটিই দিন।", threadID, messageID);
    }

    const number = parts[0].trim();
    const transaction = parts[1].trim();
    const amount = parts[2].trim();

    // ২. এপিআই ইউআরএল
    const url = `https://masterapi.site/api/bkashf.php?number=${encodeURIComponent(number)}&transaction=${encodeURIComponent(transaction)}&amount=${encodeURIComponent(amount)}`;

    // ৩. লোডিং মেসেজ
    api.sendMessage(
      `📤 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗶𝗻𝗴 𝗳𝗮𝗸𝗲 𝗕𝗸𝗮𝘀𝗵 𝘀𝗰𝗿𝗲𝗲𝗻𝘀𝗵𝗼𝘁... 𝗣𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁 🕐`,
      threadID,
      (err, info) => {
        if (!err) setTimeout(() => api.unsendMessage(info.messageID), 4000);
      },
      messageID
    );

    try {
      // ৪. এপিআই থেকে ইমেজ নেওয়া
      const response = await axios.get(url, { responseType: "stream" });

      return api.sendMessage({
        body: `━━━━━━━━━━━━━━━━━━\n📸 𝗙𝗮𝗸𝗲 𝗕𝗞𝗔𝗦𝗛 𝗦𝗖𝗥𝗘𝗘𝗡𝗦𝗛𝗢𝗧 ✅\n━━━━━━━━━━━━━━━━━━\n\n📱 𝗡𝘂𝗺𝗯𝗲𝗿 : ${number}\n🧾 𝗧𝘅𝗻𝗜𝗗: ${transaction}\n💵 𝗔𝗺𝗼𝘂𝗻𝘁: ৳${amount}\n\n📤 𝗬𝗼𝘂𝗿 𝗿𝗲𝗰𝗲𝗶𝗽𝘁 𝗶𝘀 𝗿𝗲𝗮𝗱𝘆!\n━━━━━━━━━━━━━━━━━━`,
        attachment: response.data
      }, threadID, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage(
        "❌ এপিআই সার্ভারে সমস্যা হচ্ছে অথবা লিঙ্কটি কাজ করছে না।",
        threadID,
        messageID
      );
    }
  }
};