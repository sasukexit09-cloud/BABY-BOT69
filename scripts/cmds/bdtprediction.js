module.exports = {
  config: {
    name: "bdtprediction",
    version: "4.0 Premium",
    author: "𝗔𝗬𝗔𝗡",
    countDown: 5, // প্রতি ৫ সেকেন্ড পর পর কমান্ডটি ব্যবহার করা যাবে
    role: 2, // ০ মানে গ্রুপের সবাই এটি ব্যবহার করতে পারবে
    description: "𝗪𝗜𝗡𝗚𝗢 𝗚𝗔𝗠𝗘 3.0 WinGo 30S Premium Prediction",
    category: "games"
  },

  onStart: async function ({ message }) {
    try {
      // ১. প্রেডিকশন জেনারেট করা (Big/Small)
      const sizeOptions = ['Big', 'Small'];
      const randomSize = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];

      let number1, number2;
      if (randomSize === 'Big') {
        number1 = Math.floor(Math.random() * 5) + 5; // 5 to 9
        number2 = Math.floor(Math.random() * 5) + 5;
      } else {
        number1 = Math.floor(Math.random() * 5); // 0 to 4
        number2 = Math.floor(Math.random() * 5);
      }

      // ২. ৩০ সেকেন্ড উইঙ্গো গেমের লাইভ পিরিয়ড ও রিমেইনিং সেকেন্ড হিসাব
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');

      // দৈনিক মোট ৩০ সেকেন্ডের স্লট সংখ্যা (২৪ ঘণ্টা = ৮৬৪০০ সেকেন্ড / ৩০ = ২৮৮০ টি পিরিয়ড)
      const currentSeconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
      const periodCount = Math.floor(currentSeconds / 30) + 1;
      const formattedPeriod = `${year}${month}${date}30S${String(periodCount).padStart(4, '0')}`;

      // পরবর্তী ড্র এর বাকি সময়
      const remain = 30 - (now.getSeconds() % 30);

      // ৩. প্রিমিয়াম লাক্সারি টেক্সট ফরম্যাট
      const responseMessage = 
        `╔════════════════════╗\n` +
        ` 🛸 𝗘𝗩𝗘𝗡𝗚𝗘𝗥𝗦 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 🛸\n` +
        `╚════════════════════╝\n` +
        `📊 𝗦𝗧𝗔𝗧𝗨𝗦: 𝗔𝗡𝗬𝗟𝗜𝗭𝗜𝗡𝗚 𝗦𝗨𝗖𝗘𝗦𝗦 ✅\n\n` +
        `🆔 𝗣𝗘𝗥𝗜𝗢𝗗:  ${formattedPeriod}\n` +
        `🔮 𝗣𝗥𝗘𝗗𝗜𝗖𝗧𝗜𝗢𝗡: ✨ 【 ${randomSize.toUpperCase()} 】 ✨\n` +
        `🎲 𝗟𝗨𝗖𝗞𝗬 𝗡𝗨𝗠𝗕𝗘𝗥𝗦:  [ ${number1} ] • [ ${number2} ]\n` +
        `⏳ 𝗡𝗘𝗫𝗧 𝗥𝗢𝗨𝗡𝗗 𝗜𝗡:  ${remain}s\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👑 OWNER:- https://m.me/xso.ayan\n` +
        `🌐 POWERED BY: DK WIN,HGNICE,BDWIN24,TRIGROCLUB`;

      // ৪. ইউজারকে সরাসরি রিপ্লাই পাঠানো
      return message.reply(responseMessage);

    } catch (error) {
      console.error(error);
      return message.reply("𝗦𝗢𝗥𝗥𝗬 𝗦𝗘𝗥𝗩𝗘𝗥 𝗖𝗢𝗡𝗘𝗖𝗧𝗜𝗢𝗡 𝗘𝗥𝗥𝗢𝗥 𝗣𝗟𝗭 𝗙𝗜𝗫 𝗧𝗛𝗘𝗡 𝗔𝗚𝗜𝗡 𝗦𝗧𝗔𝗥𝗧");
    }
  }
};