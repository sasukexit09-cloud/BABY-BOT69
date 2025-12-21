module.exports = {
  config: {
    name: "slot",
    version: "2.1",
    author: "AYAN BBE💋",
    shortDescription: { en: "Stylish slot machine game" },
    longDescription: { en: "Slot machine game with emoji rarity and beautiful design." },
    category: "Game",
  },

  langs: {
    en: {
      invalid_amount: "Enter a valid and positive amount to play.",
      not_enough_money: "Not enough balance to place this bet.",
      daily_limit: "❌ You have reached your daily limit of 20 spins. Come back tomorrow!",
    },
  },

  onStart: async function ({ args, message, event, usersData, getLang }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID) || {};
    const name = userData.name || `ID: ${senderID}`;
    const amount = parseInt(args[0]);

    // Daily limit check
    const today = new Date().toLocaleDateString();
    if (!userData.dailySlot || userData.dailySlot.date !== today) {
      userData.dailySlot = { date: today, count: 0 };
    }

    if (userData.dailySlot.count >= 20) {
      return message.reply(getLang("daily_limit"));
    }

    if (isNaN(amount) || amount <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    if (amount > (userData.money || 0)) {
      return message.reply(getLang("not_enough_money"));
    }

    // Increase daily count
    userData.dailySlot.count += 1;

    // Slot spin logic
    const slot1 = getRandomEmoji();
    const slot2 = getRandomEmoji();
    const slot3 = getRandomEmoji();
    const resultArray = [slot1, slot2, slot3];
    const winnings = calculateWinnings(slot1, slot2, slot3, amount);
    const newBalance = (userData.money || 0) + winnings;

    await usersData.set(senderID, {
      ...userData,
      money: newBalance,
    });

    let status = "";
    if (slot1 === slot2 && slot2 === slot3) {
      status = `🎉 JACKPOT! You won $${winnings}!`;
    } else if (winnings > 0) {
      status = `✅ You won $${winnings}!`;
    } else {
      status = `❌ You lost $${amount}.`;
    }

    const response = formatResult({
      name,
      amount,
      result: resultArray,
      status,
      balance: newBalance,
    });

    return message.reply(response);
  },
};

// Emoji rarity system
const emojiChances = { "❤️": 25, "🧡": 20, "💛": 15, "💚": 10, "💙": 8, "💜": 5, "🖤": 2 };

function getRandomEmoji() {
  const emojis = Object.keys(emojiChances);
  const total = Object.values(emojiChances).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (const emoji of emojis) {
    if (rand < emojiChances[emoji]) return emoji;
    rand -= emojiChances[emoji];
  }
}

function calculateWinnings(s1, s2, s3, amount) {
  const specialMultipliers = { "💚": 10, "💛": 5 };
  if (s1 === s2 && s2 === s3) return amount * (specialMultipliers[s1] || 3);
  if (s1 === s2 || s1 === s3 || s2 === s3) return amount * 2;
  return -amount;
}

function formatResult({ name, amount, result, status, balance }) {
  return (
    `🎰 SLOT MACHINE 🎰\n` +
    `╔═════════════════╗\n` +
    `👤 Name      : ${name}\n` +
    `💰 Bet       : $${amount}\n` +
    `🎲 Result    : ${result.join(" | ")}\n` +
    `🏆 Status    : ${status}\n` +
    `💳 Balance   : $${balance}\n` +
    `╚═════════════════╝`
  );
}
