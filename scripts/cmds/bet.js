module.exports = {
  config: {
    name: "bet",
    version: "8.0",
    author: "T A N J I L 🎀",
    shortDescription: { en: "Bet game with daily limits & colorful history" },
    longDescription: { en: "Place a bet (1.0x to 3.0x, 7% win chance), view colorful bet history, daily limit 15 for normal users!" },
    category: "Game",
  },

  langs: {
    en: {
      invalid_amount: "⚠️ Invalid bet amount. Use like: 1K, 10M, or just a number like 1000.",
      not_enough_money: "⚠️ You don't have enough money to place this bet.",
      no_history: "⚠️ You have no bet history yet.",
      daily_limit_reached: "⚠️ You have reached your daily bet limit (15). Come back tomorrow!",
    },
  },

  ownerID: "OWNER_ID_HERE", // <-- Change this to your owner ID

  onStart: async function ({ args, message, event, usersData, getLang, senderID }) {
    const input = args[0]?.toLowerCase();

    const userData = await usersData.get(senderID) || {};
    userData.money = userData.money || 0;
    userData.name = userData.name || "User";
    userData.betHistory = userData.betHistory || [];
    userData.lastBetDate = userData.lastBetDate || null;
    userData.dailyBetCount = userData.dailyBetCount || 0;

    const isOwner = senderID === this.ownerID;

    // --- Handle bet history command ---
    if (input === "history" || input === "h") {
      if (!userData.betHistory.length) return message.reply(getLang("no_history"));

      const lastBets = userData.betHistory.slice(-10).reverse();
      let totalAll = 0;
      let totalToday = 0;
      const todayStr = new Date().toDateString();
      userData.betHistory.forEach(bet => {
        totalAll += bet.amount;
        if (new Date(bet.date).toDateString() === todayStr) totalToday += bet.amount;
      });

      const format = n => {
        if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
        if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
        if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
        if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
        return n.toFixed(2);
      };

      let table = `╭────────────── ${userData.name} Bet History ──────────────╮\n`;
      table += `│ Date       │ Bet        │ Result      │ Multiplier │\n`;
      table += `│───────────│───────────│───────────│───────────│\n`;
      lastBets.forEach(bet => {
        const date = new Date(bet.date).toLocaleDateString().slice(0, 10);
        const betAmount = format(bet.amount).padStart(9, ' ');
        const isWin = bet.winAmount >= 0;
        const result = (isWin ? "💚+" : "❤️") + format(Math.abs(bet.winAmount)).padStart(8, ' ');
        const multiplier = (isWin ? (bet.winAmount / bet.amount).toFixed(1) + "x" : "-").padStart(9, ' ');
        table += `│ ${date} │ ${betAmount} │ ${result} │ ${multiplier} │\n`;
      });
      table += `│───────────│───────────│───────────│───────────│\n`;
      table += `│ Total Today: $${format(totalToday)} │ Total Bets: $${format(totalAll)} │\n`;
      table += `╰───────────────────────────────────────────────╯`;

      return message.reply(table);
    }

    // --- Place a bet ---
    if (!input) return message.reply("⚠️ Please provide your bet amount. Example: /bet 1M");

    // --- Daily limit check ---
    const today = new Date().toDateString();
    if (userData.lastBetDate !== today) {
      userData.dailyBetCount = 0;
      userData.lastBetDate = today;
    }

    if (!isOwner && userData.dailyBetCount >= 15) {
      return message.reply(getLang("daily_limit_reached"));
    }

    function parseAmount(str) {
      const units = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15, qi: 1e18, sx: 1e21, sp: 1e24, oc: 1e27, n: 1e30, dc: 1e33 };
      const regex = /^(\d+(\.\d+)?)([a-z]{0,2})$/;
      const match = str.match(regex);
      if (!match) return null;
      const [_, num, __, unit] = match;
      const multiplier = units[unit.toLowerCase()] || 1;
      return parseFloat(num) * multiplier;
    }

    const bet = parseAmount(input);
    if (!bet || bet < 1) return message.reply(getLang("invalid_amount"));
    if (userData.money < bet) return message.reply(getLang("not_enough_money"));

    // Determine win/loss
    let win = false;
    let winAmount = 0;
    let finalMultiplier = 1.0;
    const chance = Math.random();
    if (chance <= 0.07) { // 7% win chance
      win = true;
      finalMultiplier = parseFloat((Math.random() * 2 + 1).toFixed(1));
      winAmount = bet * finalMultiplier;
      userData.money += winAmount;
    } else {
      win = false;
      winAmount = -bet;
      userData.money -= bet;
    }

    // Save bet history
    userData.betHistory.push({
      amount: bet,
      winAmount: winAmount,
      date: new Date().toISOString()
    });

    // Increment daily bet count if not owner
    if (!isOwner) userData.dailyBetCount++;

    // Update user data
    await usersData.set(senderID, userData);

    // Format numbers
    const format = n => {
      if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
      if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
      if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
      if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
      return n.toFixed(2);
    };

    const result = `╭──────────────\n` +
                   `│\n` +
                   `│     ✨${userData.name}✨\n` +
                   `│\n` +
                   `│   ${win ? "🎀 YoU WiN 🎀 💚" : "💔 YoU LoST ❤️"}\n` +
                   `│  Bet Amount : $${format(bet)}\n` +
                   `│  Multiplier : ${finalMultiplier}x\n` +
                   `│  ${win ? "Win Amount" : "Loss Amount"} : $${format(winAmount)}\n` +
                   `│  Balance : $${format(userData.money)}\n` +
                   `│  Daily Bet Count: ${userData.dailyBetCount}${!isOwner ? "/15" : " (Unlimited)"}\n` +
                   `│\n` +
                   `╰──────────────`;

    return message.reply(result);
  }
};
