const fs = require("fs-extra");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

const tlt = 30; // Winning rate (%)
const min = 100; // Minimum bet ($)

module.exports = {
  config: {
    name: "bc",
    version: "1.0.5",
    author: "Khoa & Gemini",
    countDown: 5,
    role: 0,
    shortDescription: { en: "A premium Bau Cua betting game" },
    category: "game",
    guide: { en: "{pn} [bau/cua/tom/ca/nai/ga] money" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    if (args.length < 2)
      return api.sendMessage("❌ সঠিক ব্যবহার: bc [bau/cua/tom/ca/nai/ga] [টাকার পরিমাণ]", threadID, messageID);

    const allface = ["bau", "cua", "tom", "ca", "nai", "ga"];
    const betChoice = args[0].toLowerCase();

    if (!allface.includes(betChoice))
      return api.sendMessage(`❌ ভুল নির্বাচন! সঠিক অপশন: ${allface.join(", ")}`, threadID, messageID);

    // ১. GoatBot-এর ইউজার ডাটা থেকে মানি চেক
    const userData = await usersData.get(senderID);
    let money = userData.money || 0;
    const betAmount = parseInt(args[1]);

    if (isNaN(betAmount) || betAmount < 1)
      return api.sendMessage("⚠️ টাকার পরিমাণ সঠিক নয়!", threadID, messageID);
    if (betAmount < min)
      return api.sendMessage(`⚠️ সর্বনিম্ন বেট $${min}!`, threadID, messageID);
    if (betAmount > money)
      return api.sendMessage(`⚠️ আপনার কাছে পর্যাপ্ত টাকা নেই! বর্তমান ব্যালেন্স: $${money}`, threadID, messageID);

    // ২. উইনিং লজিক (Winning Logic)
    let luckynumber = Math.floor(Math.random() * 100) + 1;
    let pool = [...allface];
    if (luckynumber > tlt) {
      pool = pool.filter(face => face !== betChoice);
    }

    const result = [
      pool[Math.floor(Math.random() * pool.length)],
      pool[Math.floor(Math.random() * pool.length)],
      pool[Math.floor(Math.random() * pool.length)]
    ];

    const getlink = (face) => {
      const links = {
        bau: "https://i.postimg.cc/SR3qy939/bau.png",
        cua: "https://i.postimg.cc/0jbPRnWx/cua.png",
        tom: "https://i.postimg.cc/tCnpBrnN/tom.png",
        ca: "https://i.postimg.cc/BnWskxx9/ca.png",
        nai: "https://i.postimg.cc/05B9dgjN/nai.png",
        ga: "https://i.postimg.cc/Kz9xHw5J/ga.png"
      };
      return links[face];
    };

    // ৩. ক্যানভাস ডিজাইন (Canvas Setup)
    try {
      const canvas = createCanvas(1200, 900);
      const ctx = canvas.getContext("2d");
      const background = await loadImage("https://i.postimg.cc/9fcVVWSb/background.png");
      ctx.drawImage(background, 0, 0, 1200, 900);

      let count = 0;
      for (let i = 0; i <= 2; i++) {
        if (result[i] === betChoice) count++;
        const img = await loadImage(getlink(result[i]));
        const x = i === 0 ? 250 : i === 1 ? 612 : 480;
        const y = i === 0 ? 129 : i === 1 ? 134 : 344;
        ctx.drawImage(img, x, y, 370, 370);
      }

      // ৪. ফাইল পাথ হ্যান্ডলিং (Safe Path)
      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      const imgPath = path.join(cacheDir, `baucua_${senderID}.png`);

      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      // ৫. ব্যালেন্স আপডেট
      let change = 0;
      if (count === 0) {
        change = -betAmount;
        await usersData.set(senderID, { money: money - betAmount });
      } else {
        change = betAmount * count;
        await usersData.set(senderID, { money: money + change });
      }

      const status = count === 0 ? "হারলেল! 😭" : `জিতলেন! 🎉 (x${count})`;

      return api.sendMessage({
        body: `🎰 **${status}**\n━━━━━━━━━━━━\n🎲 রেজাল্ট: ${result.join(" - ")}\n💸 পরিবর্তন: ${change > 0 ? "+" : ""}${change}$\n💰 বর্তমান ব্যালেন্স: ${money + change}$`,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ গেমটি লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", threadID, messageID);
    }
  }
};