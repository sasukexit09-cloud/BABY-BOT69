module.exports = {
  config: {
    name: "autoreply",
    version: "6.0.3",
    author: "AYAN & Gemini",
    countDown: 3,
    role: 0,
    shortDescription: { en: "Auto-response bot with triggers" },
    longDescription: { en: "The bot automatically replies to specific keywords in chat." },
    category: "No Prefix",
    guide: { en: "{pn}" }
  },

  onChat: async function ({ api, event, message, usersData }) {
    if (!event.body) return;

    const msg = event.body.toLowerCase().trim();
    const senderID = event.senderID;

    // ট্রিগার এবং রেসপন্স ম্যাপ
    const responses = {
      "miss you": "অরেক বেডারে Miss না করে xan মেয়ে হলে বস আয়ান রে হাঙ্গা করো😶👻😘",
      "kiss de": "কিস দিস না তোর মুখে দূর গন্ধ কয়দিন ধরে দাঁত ব্রাশ করিস নাই🤬",
      "👍": "সর এখান থেকে লাইকার বলদ..!🐸🤣👍⛏️",
      "": "Prefix de sala",
      "": "",
      "bc": "SAME TO YOU😊",
      "": "Khud k0o KYa LeGend SmJhTi Hai 😂",
      "good morning": "GOOD MORNING দাত ব্রাশ করে খেয়ে নেও😚",
      "tor ball": "~ এখনো বাল উঠে নাই নাকি তোমার?? 🤖",
      "ayan": "উনি এখন কাজে বিজি আছে কি বলবেন আমাকে বলতে পারেন..!😘",
      "owner": "‎[𝙾𝚆𝙽𝚈:- 💟 𝙰𝚈𝙰𝙽 💟\nFacebook: https://www.facebook.com/profile.php?id=61584308632995\nWhatsApp: +8801914227459",
      "admin": "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴 𝙺𝙴 𝙲𝚄𝙼𝙼𝙰𝙷 𝙳𝙴𝚄😘",
      "baby": "এ তো হাছিনা 🤩 𝚃𝚄 𝚃𝚆 মেরে দিলকি দারকান হে মেরি জান হে😍.",
      "chup": "তুই চুপ চুপ কর পাগল ছাগল",
      "assalamualaikum": "وَعَلَيْكُمُ السَّلَامُ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ 💖",
      "kiss me": "তুমি পঁচা তোমাকে কিস দিবো না 🤭",
      "thanks": "এতো ধন্যবাদ না দিয়ে আমার বস আয়ান রে তোর গার্লফ্রেন্ড টা দিয়ে দে..!🐸🥵",
      "i love you": "মেয়ে হলে আমার বস আয়ান এর ইনবক্সে এখুনি গুঁতা দিন🫢😻",
      "by": "কিরে তুই কই যাস কোন মেয়ের সাথে চিপায় যাবি..!🌚🌶️",
      "ami ayan": "হ্যা বস কেমন আছেন..?☺️",
      "bot er baccha": "আমার বাচ্চা তো তোমার গার্লফ্রেন্ডের পেটে..!!🌚⛏️",
      "tor nam ki": "𝙼𝚈 𝙽𝙰𝙼𝙴 𝙸𝚂 MIKO..💖",
      "pic de": "এন থেকে সর দুরে গিয়া মর😒",
      "cudi": "এত চোদা চুদি করস কেনো..!🥱🌝🌚",
      "bal": "রাগ করে না সোনা পাখি 🥰",
      "heda": "এতো রাগ শরীরের জন্য ভালো না 🥰",
      "boda": "ভাই তুই এত হাসিস না..!🌚🤣",
      "love you": "ভালোবাসা নামক আবলামী করতে চাইলে Boss আয়ান এর ইনবক্সে গুতা দিন 😘",
      "kire ki koros": "তোমার কথা ভাবতে ছি জানু",
      "kire bot": "হ্যাঁ সব কেমন আছেন আপনার ওই খানে উম্মাহ 😘😽🙈"
    };

    // ১. Exact Match (হুবহু মিলে গেলে)
    if (responses[msg]) {
      return message.reply(responses[msg]);
    }

    // ২. Partial Match (মেসেজের ভেতরে শব্দটা থাকলে)
    for (const key in responses) {
      if (msg.includes(key)) {
        return message.reply(responses[key]);
      }
    }
  },

  // রান ফাংশন (যাতে !autoreply দিলেও কাজ করে)
  onStart: async function ({ message }) {
    return message.reply("🤖 Auto-Reply Bot is active! I will reply to certain keywords automatically.");
  }
};