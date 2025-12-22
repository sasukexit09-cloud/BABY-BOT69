const axios = require("axios");

let alyaOn = false;

// 👉 OWNER ID বসাও
const OWNER_ID = "61584308632995";

module.exports = {
  config: {
    name: "Alya",
    version: "1.2",
    author: "Maya",
    role: 0,
    shortDescription: "Chat with ChatGPT (VIP auto detect)",
    longDescription: "Alya on/off করে ChatGPT এর সাথে কথা বলা (VIP & Owner only)",
    category: "ai",
    guide: "{p}Alya on | off"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const senderID = event.senderID;

    // 📌 get user data
    const userData = await usersData.get(senderID);
    const isVip = userData?.vip === true;
    const isOwner = senderID === OWNER_ID;

    // 🔒 Permission check
    if (!isOwner && !isVip) {
      return api.sendMessage(
        "🚫 Alya শুধু VIP এবং Owner এর জন্য ফ্রি",
        event.threadID,
        event.messageID
      );
    }

    const cmd = args[0];

    if (!cmd) {
      return api.sendMessage(
        "ব্যবহার:\nalya on\nalya off",
        event.threadID,
        event.messageID
      );
    }

    if (cmd === "on") {
      alyaOn = true;
      return api.sendMessage(
        "🤖 ChatGPT চালু হয়েছে!\nএখন সরাসরি আমার সাথে কথা বলো 💬",
        event.threadID
      );
    }

    if (cmd === "off") {
      alyaOn = false;
      return api.sendMessage(
        "❌ ChatGPT বন্ধ করা হয়েছে",
        event.threadID
      );
    }
  },

  onChat: async function ({ api, event, usersData }) {
    if (!alyaOn) return;
    if (!event.body) return;
    if (event.senderID === api.getCurrentUserID()) return;

    const senderID = event.senderID;
    const userData = await usersData.get(senderID);
    const isVip = userData?.vip === true;
    const isOwner = senderID === OWNER_ID;

    // 🔒 Only VIP & Owner
    if (!isOwner && !isVip) return;

    try {
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are ChatGPT. Reply in friendly Bangla style."
            },
            {
              role: "user",
              content: event.body
            }
          ]
        },
        {
          headers: {
            "Authorization": `Bearer YOUR_OPENAI_API_KEY`,
            "Content-Type": "application/json"
          }
        }
      );

      const reply =
        res.data.choices[0].message.content || "😅 বুঝতে পারিনি";

      api.sendMessage(reply, event.threadID);
    } catch (err) {
      api.sendMessage(
        "⚠️ ChatGPT API Error",
        event.threadID
      );
    }
  }
};