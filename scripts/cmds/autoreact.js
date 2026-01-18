module.exports = {
  config: {
    name: "autoreact",
    version: "1.1.1",
    author: "AYAN & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Toggle auto emoji reaction" },
    longDescription: { en: "The bot will automatically react with random emojis to every message." },
    category: "No Prefix",
    guide: { en: "{pn}" }
  },

  // এই ফাংশনটি প্রতিটি মেসেজ আসার সাথে সাথে চেক করবে
  onChat: async function ({ api, event, threadsData }) {
    try {
      const { threadID, messageID } = event;
      
      // ডেটাবেস থেকে সেটিংস চেক করা
      const data = await threadsData.get(threadID);
      const isAutoReact = data.settings?.autoreact ?? true; // ডিফল্ট অন থাকবে

      if (!isAutoReact) return;

      const emojis = ["🥰", "😗", "🍂", "💜", "☺️", "🖤", "🤗", "😇", "🌺", "🥹", "😻", "😘", "🫣", "😽", "😺", "👀", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🤍", "💫", "💦", "🫶", "🫦", "👄", "🗣️", "💏", "😵", "🥵", "🥶", "🤨", "🤐", "🫡", "🤔"];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

      api.setMessageReaction(randomEmoji, messageID, (err) => {
        if (err) console.error("Error sending reaction:", err);
      }, true);
      
    } catch (e) {
      // সাইলেন্ট এরর যাতে কনসোল নোংরা না হয়
    }
  },

  // এই ফাংশনটি কাজ করবে যখন কেউ "!autoreact" লিখে অন/অফ করতে চাইবে
  onStart: async function ({ event, threadsData, message }) {
    const { threadID } = event;

    try {
      const data = await threadsData.get(threadID);
      const currentStatus = data.settings?.autoreact ?? true;
      const newStatus = !currentStatus;

      await threadsData.set(threadID, {
        "settings.autoreact": newStatus
      });

      return message.reply(`✅ Auto-react এখন ${newStatus ? "অন (ON) 🟢" : "অফ (OFF) 🔴"} করা হয়েছে।`);
    } catch (e) {
      console.error(e);
      return message.reply("❌ সেটিংস আপডেট করতে সমস্যা হয়েছে।");
    }
  }
};