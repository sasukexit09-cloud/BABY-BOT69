module.exports = {
  config: {
    name: "rps",
    version: "1.3",
    author: "bolbo nah",
    countDown: 5,
    role: 0,
    category: "𝗙𝗨𝗡 & 𝗚𝗔𝗠𝗘",
    shortDescription: {
      en: "💰 Rock/Paper/Scissors Betting Game"
    },
    longDescription: {
      en: "Play against bot or friends with coin bets using ✊/✋/✌️"
    },
    guide: {
      en: "1. Type 'rps [amount]'\n2. Reply 1 (vs Bot) or 2 (vs Player)\n3. Choose ✊, ✋, or ✌️"
    }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const minBet = 100;
    const betAmount = parseInt(args[0]);

    if (!betAmount || isNaN(betAmount)) {
      return message.reply(`⚠️ Please specify a valid bet amount (minimum ${minBet} coins)`);
    }

    if (betAmount < minBet) {
      return message.reply(`❌ Minimum bet is ${minBet} coins!`);
    }

    const userData = await usersData.get(event.senderID);
    if (userData.money < betAmount) {
      return message.reply(`💸 You only have ${userData.money} coins! Need ${betAmount} to play.`);
    }

    const sentMsg = await message.reply(
      `🎰 BETTING GAME - ${betAmount} COINS\n\n` +
      "Choose mode:\n1️⃣ - Play vs 🤖 Bot\n2️⃣ - Challenge 👥 Friend\n\nReply with 1 or 2"
    );

    global.GoatBot.onReply.set(sentMsg.messageID, {
      commandName: "rps", // <-- সব জায়গায় rps
      author: event.senderID,
      betAmount: betAmount,
      type: "modeSelection"
    });
  },

  onReply: async function ({ api, event, Reply, usersData, message }) {
    const { author, betAmount, type } = Reply;

    // Mode selection (1 or 2)
    if (type === "modeSelection") {
      if (event.senderID !== author) return;

      const choice = event.body.trim();
      if (!["1", "2"].includes(choice)) {
        return message.reply("❌ Please reply with either 1 (vs Bot) or 2 (vs Friend)");
      }

      await usersData.set(author, {
        money: (await usersData.get(author)).money - betAmount
      });

      if (choice === "1") {
        // PvE Mode
        const botChoice = ["✊", "✋", "✌️"][Math.floor(Math.random() * 3)];
        const sentMsg = await message.reply(
          `🤖 BOT CHALLENGE - ${betAmount} COINS\n\nChoose your move:\n✊ Rock\n✋ Paper\n✌️ Scissors\n\nReply with your choice`
        );

        global.GoatBot.onReply.set(sentMsg.messageID, {
          commandName: "rps", // <-- rps
          author: author,
          betAmount: betAmount,
          botChoice: botChoice,
          type: "pveMove"
        });

      } else if (choice === "2") {
        // PvP Mode
        const sentMsg = await message.reply(
          `👥 PLAYER MATCH - ${betAmount} COINS\n\nWaiting for opponent...\nReply 'accept' to join`
        );

        global.GoatBot.onReply.set(sentMsg.messageID, {
          commandName: "rps", // <-- rps
          author: author,
          betAmount: betAmount,
          players: [author],
          type: "pvpWait"
        });
      }
    }

    // PvE Move Selection
    else if (type === "pveMove") {
      if (event.senderID !== author) return;

      const validMoves = ["✊", "✋", "✌️", "rock", "paper", "scissors"];
      const playerMove = event.body.trim().toLowerCase();

      if (!validMoves.includes(playerMove)) {
        return message.reply("❌ Invalid move! Please choose:\n✊ Rock\n✋ Paper\n✌️ Scissors");
      }

      const moveMap = { "✊": 0, "rock": 0, "✋": 1, "paper": 1, "✌️": 2, "scissors": 2 };
      const playerChoice = moveMap[playerMove];
      const botChoice = moveMap[Reply.botChoice];
      const choices = ["✊ Rock", "✋ Paper", "✌️ Scissors"];

      // Determine winner
      let result;
      if (playerChoice === botChoice) {
        const refund = Math.floor(betAmount * 0.5);
        await usersData.set(author, {
          money: (await usersData.get(author)).money + refund
        });
        result = `🤝 DRAW! You got ${refund} coins back`;
      } else if (
        (playerChoice === 0 && botChoice === 2) ||
        (playerChoice === 1 && botChoice === 0) ||
        (playerChoice === 2 && botChoice === 1)
      ) {
        const winnings = betAmount * 2;
        await usersData.set(author, {
          money: (await usersData.get(author)).money + winnings
        });
        result = `🎉 YOU WIN! +${winnings} coins`;
      } else {
        result = "😢 Bot wins! Better luck next time";
      }

      message.reply(
        `⚔️ RESULT - ${betAmount} COINS\n\nYou chose: ${choices[playerChoice]}\nBot chose: ${choices[botChoice]}\n\n${result}`
      );

      global.GoatBot.onReply.delete(Reply.messageID);
    }

    // PvP Mode Handling
    else if (type === "pvpWait" && event.body.toLowerCase() === "accept") {
      const opponentId = event.senderID;
      if (Reply.players.includes(opponentId)) return;

      Reply.players.push(opponentId);

      const sentMsg = await message.reply(
        `👥 PLAYER MATCH STARTED - ${betAmount} COINS\n\nPlayers: ${Reply.players.map(id => `<@${id}>`).join(", ")}\n\nEach player, reply with ✊/✋/✌️`
      );

      global.GoatBot.onReply.set(sentMsg.messageID, {
        commandName: "rps",
        type: "pvpMove",
        players: Reply.players,
        betAmount: betAmount,
        moves: {}
      });
    }

    // PvP Move Selection
    else if (type === "pvpMove") {
      const playerId = event.senderID;
      const move = event.body.trim().toLowerCase();
      const validMoves = ["✊", "✋", "✌️", "rock", "paper", "scissors"];
      if (!validMoves.includes(move)) return;

      const moveMap = { "✊": 0, "rock": 0, "✋": 1, "paper": 1, "✌️": 2, "scissors": 2 };
      Reply.moves[playerId] = moveMap[move];

      if (Object.keys(Reply.moves).length === Reply.players.length) {
        // All moves submitted, determine winner
        const [p1, p2] = Reply.players;
        const m1 = Reply.moves[p1];
        const m2 = Reply.moves[p2];
        let resultText;

        if (m1 === m2) {
          const refund = Math.floor(betAmount * 0.5);
          await usersData.set(p1, { money: (await usersData.get(p1)).money + refund });
          await usersData.set(p2, { money: (await usersData.get(p2)).money + refund });
          resultText = `🤝 DRAW! Each got ${refund} coins back`;
        } else if (
          (m1 === 0 && m2 === 2) ||
          (m1 === 1 && m2 === 0) ||
          (m1 === 2 && m2 === 1)
        ) {
          await usersData.set(p1, { money: (await usersData.get(p1)).money + betAmount * 2 });
          resultText = `<@${p1}> 🎉 WINS! +${betAmount * 2} coins`;
        } else {
          await usersData.set(p2, { money: (await usersData.get(p2)).money + betAmount * 2 });
          resultText = `<@${p2}> 🎉 WINS! +${betAmount * 2} coins`;
        }

        message.reply(
          `⚔️ PvP RESULT - ${betAmount} COINS\n\n${resultText}`
        );

        global.GoatBot.onReply.delete(Reply.messageID);
      }
    }
  }
};
