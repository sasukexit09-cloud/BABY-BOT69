const axios = require("axios");

const mahmud = [
  "baby","bby","babu","bbu","jan","bot","জান","জানু","বেবি","wifey","alya"
];

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports.config = {
  name: "alya",
  aliases: ["baby","bby","bbu","jan","janu","wifey","bot"],
  version: "5.0",
  author: "MahMUD",
  role: 0,
  category: "chat",
  guide: { en: "{pn} [message]" }
};

/* ================= RANDOM MESSAGES ================= */

const randomMessage = [
"babu khuda lagse🥺","Hop beda😾,Boss বল boss😼","আমাকে ডাকলে ,আমি কিন্তূ কিস করে দেবো😘",
"🐒🐒🐒","bye","naw amr boss k message daw m.me/Ayanokujo.6969","mb ney bye",
"meowww👀","গোলাপ ফুল এর জায়গায় আমি দিলাম তোমায় মেসেজ",
"বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏","𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘","𝗜 𝗵𝗮𝘁𝗲 𝘆𝗼𝘂__😏😏",
"গোসল করে আসো যাও😑😩","অ্যাসলামওয়ালিকুম","কেমন আসো","বলেন sir__😌","বলেন ম্যাডাম__😌",
"আমি অন্যের জিনিসের সাথে কথা বলি না__😏ওকে","🙂🙂🙂","এটায় দেখার বাকি সিলো_🙂🙂🙂",
"𝗕𝗯𝘆 𝗯𝗼𝗹𝗹𝗮 𝗽𝗮𝗽 𝗵𝗼𝗶𝗯𝗼 😒😒","𝗧𝗮𝗿𝗽𝗼𝗿 𝗯𝗼𝗹𝗼_🙂","𝗕𝗲𝘀𝗵𝗶 𝗱𝗮𝗸𝗹𝗲 𝗮𝗺𝗺𝘂 𝗯𝗼𝗸𝗮 𝗱𝗲𝗯𝗮 𝘁𝗼__🥺",
"𝗕𝗯𝘆 না জানু, বল 😌","বেশি bby করলে leave নিবো 😒","__বেশি বেবি বললে কামুর দিমু 🤭",
"bolo baby😒","তোর কথা তোর বাড়ি কেউ শুনে না 🤔","আমি তো অন্ধ কিছু দেখি না🐸",
"আম গাছে আম নাই ঢিল কেন মারো 😒","𝗕𝗯𝘆 না বলে 𝗕𝗼𝘄 বলো 😘",
"আজব তো__😒","আমাকে ডেকো না,আমি ব্যাস্ত আসি🙆🏻‍♀",
"🍺 এই নাও জুস খাও..!","হটাৎ আমাকে মনে পড়লো 🙄",
"খাওয়া দাওয়া করসো 🙄","এত কাছেও এসো না,প্রেম এ পরে যাবো তো 🙈",
"একটা BF খুঁজে দাও 😿","🐤🐤","৩২ তারিখ আমার বিয়ে 🐤",
"হা বলো😒,কি করতে পারি😐?","Meow🐤","আজকে আমার মন ভালো নেই 🙉",
"আমি হাজারো মশার Crush😓","মন সুন্দর বানাও মুখের জন্য তো Snapchat আছেই 🌚"
];

/* ================= START COMMAND ================= */

module.exports.onStart = async ({ api, event, args, usersData }) => {
  const msg = args.join(" ").toLowerCase();
  const uid = event.senderID;

  try {

    /* ===== EMPTY ===== */
    if (!args[0]) {
      return api.sendMessage("𝙴𝚁𝚁𝙾𝚁 𝙰𝙻𝚈𝙰🍓", event.threadID, event.messageID);
    }

    /* ===== TEACH ===== */
    if (args[0] === "teach") {
      const text = msg.replace("teach ", "");
      const [trigger, ...arr] = text.split(" - ");
      const responses = arr.join(" - ");

      await axios.post(`${await baseApiUrl()}/api/alya/teach`, {
        trigger, responses, userID: uid
      });

      return api.sendMessage("✅ Teach Added", event.threadID);
    }

    /* ===== REMOVE ===== */
    if (args[0] === "remove") {
      const text = msg.replace("remove ", "");
      const [trigger, index] = text.split(" - ");

      const res = await axios.delete(`${await baseApiUrl()}/api/alya/remove`, {
        data: { trigger, index: parseInt(index) }
      });

      return api.sendMessage(res.data.message, event.threadID);
    }

    /* ===== LIST ===== */
    if (args[0] === "list") {
      const endpoint = args[1] === "all" ? "/list/all" : "/list";
      const res = await axios.get(`${await baseApiUrl()}/api/alya${endpoint}`);

      if (args[1] === "all") {
        let msg = "👑 𝙰𝙻𝚈𝙰 𝚃𝙴𝙰𝙲𝙷𝙴𝚂 🍇:\n\n";
        const data = Object.entries(res.data.data).slice(0, 15);
        for (let i = 0; i < data.length; i++) {
          msg += `${i + 1}. ${data[i][0]} : ${data[i][1]}\n`;
        }
        return api.sendMessage(msg, event.threadID);
      }

      return api.sendMessage(res.data.message, event.threadID);
    }

    /* ===== NORMAL CHAT ===== */
    const res = await axios.post(`${await baseApiUrl()}/api/alya`, {
      text: msg,
      style: 3,
      attachments: event.attachments || []
    });

    api.sendMessage(res.data.message, event.threadID, event.messageID);

  } catch {
    api.sendMessage("API Error ❌", event.threadID);
  }
};

/* ================= REPLY ================= */

module.exports.onReply = async ({ api, event }) => {
  try {
    const res = await axios.post(`${await baseApiUrl()}/api/alya`, {
      text: event.body.toLowerCase(),
      style: 3,
      attachments: event.attachments || []
    });

    api.sendMessage(res.data.message, event.threadID);
  } catch {}
};

/* ================= AUTO CHAT ================= */

module.exports.onChat = async ({ api, event }) => {
  try {
    const msg = event.body?.toLowerCase() || "";

    if (mahmud.some(w => msg.startsWith(w))) {

      const text = msg.split(" ").slice(1).join(" ");

      /* RANDOM CALL REPLY */
      if (!text) {
        const rand = randomMessage[Math.floor(Math.random() * randomMessage.length)];
        return api.sendMessage(rand, event.threadID);
      }

      /* AI REPLY */
      const res = await axios.post(`${await baseApiUrl()}/api/alya`, {
        text,
        style: 3,
        attachments: event.attachments || []
      });

      api.sendMessage(res.data.message, event.threadID);
    }

  } catch {}
};