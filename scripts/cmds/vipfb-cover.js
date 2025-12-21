const axios = require("axios");

let cachedBaseApi = null;

const baseApiUrl = async () => {
  if (cachedBaseApi) return cachedBaseApi;
  const res = await axios.get(
    "https://raw.githubusercontent.com/ARYAN-AROHI-STORE/A4YA9-A40H1/refs/heads/main/APIRUL.json"
  );
  cachedBaseApi = res.data.api;
  return cachedBaseApi;
};

module.exports.config = {
  name: "fbcover",
  version: "7.0",
  role: 0,
  author: "ArYan",
  description: "Generate Facebook Cover (VIP only)",
  category: "Cover",
  guide: {
    en: "fbcover v1/v2/v3 - name - title - address - email - phone - color",
  },
  countDown: 5,
};

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { threadID, messageID, senderID } = event;

  // ===== VIP CHECK =====
  const userData = await usersData.get(senderID);
  if (!userData || userData.vip !== true) {
    return api.sendMessage(
      "🔒 | **VIP ONLY COMMAND**\n\n🥺 Baby, তুমি VIP না\n✨ আগে VIP নাও তারপর fbcover use করো 💋",
      threadID,
      messageID
    );
  }
  // =====================

  const input = args.join(" ");
  const id =
    event.type === "message_reply"
      ? event.messageReply.senderID
      : Object.keys(event.mentions)[0] || senderID;

  if (!input) {
    return api.sendMessage(
      `❌ Wrong format\nUse:\n${global.GoatBot.config.prefix}fbcover v1 - Name - Title - Address - Email - Phone - Color`,
      threadID,
      messageID
    );
  }

  const data = input.split("-").map(i => i.trim());

  const v = data[0] || "v1";
  const name = data[1] || "";
  const subname = data[2] || "";
  const address = data[3] || "";
  const email = data[4] || "";
  const phone = data[5] || "";
  const color = data[6] || "white";

  api.sendMessage(
    "⏳ FB Cover বানানো হচ্ছে... একটু wait করো 😘",
    threadID,
    (err, info) => {
      if (!err && info?.messageID) {
        setTimeout(() => api.unsendMessage(info.messageID), 4000);
      }
    }
  );

  try {
    const apiBase = await baseApiUrl();

    let imgUrl = `${apiBase}/cover/${v}`;
    let finalUrl;

    try {
      await axios.head(imgUrl);
      finalUrl =
        imgUrl +
        `?name=${encodeURIComponent(name)}` +
        `&subname=${encodeURIComponent(subname)}` +
        `&number=${encodeURIComponent(phone)}` +
        `&address=${encodeURIComponent(address)}` +
        `&email=${encodeURIComponent(email)}` +
        `&colour=${encodeURIComponent(color)}` +
        `&uid=${id}`;
    } catch {
      finalUrl =
        `${apiBase}/cover` +
        `?style=${v}` +
        `&name=${encodeURIComponent(name)}` +
        `&subname=${encodeURIComponent(subname)}` +
        `&number=${encodeURIComponent(phone)}` +
        `&address=${encodeURIComponent(address)}` +
        `&email=${encodeURIComponent(email)}` +
        `&colour=${encodeURIComponent(color)}` +
        `&uid=${id}`;
    }

    const res = await axios.get(finalUrl, { responseType: "stream" });

    return api.sendMessage(
      {
        body: "✨ 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 𝗖𝗢𝗩𝗘𝗥 ✨",
        attachment: res.data,
      },
      threadID,
      messageID
    );
  } catch (err) {
    console.error("FB COVER ERROR:", err.message);
    return api.sendMessage(
      "❌ FB Cover generate করা যায়নি.\nAPI issue বা style ভুল হতে পারে।",
      threadID,
      messageID
    );
  }
};
