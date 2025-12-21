const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require("mongodb");

module.exports = {
  config: {
    name: "bank",
    version: "3.0.0",
    author: "AYAN BBE💋",
    countDown: 5,
    role: 0,
    category: "💰 Economy",
    shortDescription: "Realistic Bank System with Visual Responses",
    longDescription: "Deposit, withdraw, earn interest, take loans, and track transactions with images"
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    const uri = "mongodb+srv://tarekshikdar09:tarek099@bot-cluster.a7rzjf4.mongodb.net/?retryWrites=true&w=majority&appName=bot-cluster";
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db("bankSystem");
      const users = db.collection("users");
      const transactions = db.collection("transactions");
      const uid = event.senderID;
      const action = args[0]?.toLowerCase();
      const amount = parseInt(args[1]);

      // Create user if not exists
      const user = await users.findOneAndUpdate(
        { uid },
        { $setOnInsert: { balance: 0, loan: 0, lastInterest: Date.now(), interestProfit: 0, joinedAt: Date.now() } },
        { upsert: true, returnDocument: "after" }
      );
      const userData = user?.value;

      // Helper: Get user name
      async function getUserName(uid) {
        try {
          const userInfo = await api.getUserInfo(uid);
          return userInfo[uid]?.name || "Unknown User";
        } catch {
          return "Unknown User";
        }
      }

      // Helper: Generate Transaction ID
      function generateTransactionID() {
        return "TXN" + Date.now() + Math.floor(Math.random() * 1000);
      }

      // Helper: Generate Canvas Image
      async function generateImageResponse(title, content) {
        const width = 800, height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background Gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#162447');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Decorative Circle
        ctx.fillStyle = '#4cc9f0';
        ctx.beginPath();
        ctx.arc(width - 60, 60, 40, 0, Math.PI * 2);
        ctx.fill();

        // Title
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 80);

        // Content
        ctx.font = '24px Arial';
        ctx.fillStyle = '#f8f9fa';
        ctx.textAlign = 'left';
        const lines = content.split('\n');
        let y = 140;
        lines.forEach(line => {
          ctx.fillText(line, 50, y);
          y += 30;
        });

        // Footer
        ctx.font = '16px Arial';
        ctx.fillStyle = '#a5a8ac';
        ctx.textAlign = 'center';
        ctx.fillText('𝗔𝗬𝗔𝗡 Bank System', width / 2, height - 30);

        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const imagePath = path.join(tmpDir, `bank_${uid}_${Date.now()}.png`);
        const out = fs.createWriteStream(imagePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        return new Promise((resolve) => {
          out.on('finish', () => resolve(imagePath));
        });
      }

      // Commands
      switch (action) {

        // ================= BALANCE =================
        case "balance": {
          const cashBalance = await usersData.get(uid, "money") || 0;
          const content = `💙 Account Summary:\n\n🏦 Bank Balance: ${userData.balance} $\n💵 Cash Balance: ${cashBalance} $\n💰 Total: ${userData.balance + cashBalance} $`;
          const imagePath = await generateImageResponse('Account Balance', content);
          return message.reply({ attachment: fs.createReadStream(imagePath) });
        }

        // ================= DEPOSIT =================
        case "deposit": {
          if (!amount || amount <= 0) {
            const content = '🌷 Usage: bank deposit [amount]\nExample: bank deposit 500';
            const imagePath = await generateImageResponse('Deposit Instructions', content);
            return message.reply({ attachment: fs.createReadStream(imagePath) });
          }
          const cashBalance = await usersData.get(uid, "money") || 0;
          if (cashBalance < amount) {
            const content = `❌ Insufficient Cash Balance!\n💵 Your Cash: ${cashBalance} $\n💸 Required: ${amount} $`;
            const imagePath = await generateImageResponse('Deposit Failed', content);
            return message.reply({ attachment: fs.createReadStream(imagePath) });
          }

          // Notify processing
          await message.reply(`💳 Deposit of ${amount}$ is being processed.\n⏳ It will complete in 2 minutes.`);

          // Delay 2 minutes
          setTimeout(async () => {
            await usersData.set(uid, { money: cashBalance - amount });
            const updatedUser = await users.findOneAndUpdate(
              { uid },
              { $inc: { balance: amount } },
              { returnDocument: "after" }
            );

            const tid = generateTransactionID();
            await transactions.insertOne({
              tid,
              uid,
              userName: await getUserName(uid),
              type: "deposit",
              amount,
              balanceBefore: cashBalance,
              balanceAfter: updatedUser.value.balance,
              date: Date.now()
            });

            const content = `✅ Deposit Complete!\n\nTransaction ID: ${tid}\nUser: ${await getUserName(uid)}\nUID: ${uid}\nAmount: +${amount}$\nBalance Before: ${cashBalance}$\nBalance After: ${updatedUser.value.balance}$\nDate: ${new Date().toLocaleString()}`;
            const imagePath = await generateImageResponse('Deposit Complete', content);
            await message.reply({ attachment: fs.createReadStream(imagePath) });
          }, 2 * 60 * 1000);
          break;
        }

        // ================= WITHDRAW =================
        case "withdraw": {
          if (!amount || amount <= 0) {
            const content = '🌷 Usage: bank withdraw [amount]\nExample: bank withdraw 500';
            const imagePath = await generateImageResponse('Withdraw Instructions', content);
            return message.reply({ attachment: fs.createReadStream(imagePath) });
          }
          if (userData.balance < amount) {
            const content = `❌ Insufficient Bank Balance!\n🏦 Your Balance: ${userData.balance} $\n💸 Required: ${amount} $`;
            const imagePath = await generateImageResponse('Withdraw Failed', content);
            return message.reply({ attachment: fs.createReadStream(imagePath) });
          }

          const cashBalance = await usersData.get(uid, "money") || 0;
          await message.reply(`💸 Withdrawal of ${amount}$ is being processed.\n⏳ It will complete in 10 minutes.`);

          setTimeout(async () => {
            await users.updateOne({ uid }, { $inc: { balance: -amount } });
            await usersData.set(uid, { money: cashBalance + amount });

            const updatedUser = await users.findOne({ uid });
            const tid = generateTransactionID();
            await transactions.insertOne({
              tid,
              uid,
              userName: await getUserName(uid),
              type: "withdraw",
              amount,
              balanceBefore: userData.balance,
              balanceAfter: updatedUser.balance,
              date: Date.now()
            });

            const content = `✅ Withdrawal Complete!\n\nTransaction ID: ${tid}\nUser: ${await getUserName(uid)}\nUID: ${uid}\nAmount: -${amount}$\nBalance Before: ${userData.balance}$\nBalance After: ${updatedUser.balance}$\nDate: ${new Date().toLocaleString()}`;
            const imagePath = await generateImageResponse('Withdrawal Complete', content);
            await message.reply({ attachment: fs.createReadStream(imagePath) });
          }, 10 * 60 * 1000);
          break;
        }

        // ================= LOAN =================
        case "loan": {
          if (userData.loan > 0) {
            const content = `❌ You already have an active loan!\n💰 Loan Amount: ${userData.loan} $`;
            const imagePath = await generateImageResponse('Loan Denied', content);
            return message.reply({ attachment: fs.createReadStream(imagePath) });
          }
          const loanAmount = 20000;
          await users.updateOne({ uid }, { $inc: { balance: loanAmount, loan: loanAmount }, $set: { lastLoan: Date.now() } });
          const tid = generateTransactionID();
          await transactions.insertOne({
            tid, uid, userName: await getUserName(uid), type: "loan", amount: loanAmount,
            balanceBefore: userData.balance, balanceAfter: userData.balance + loanAmount, date: Date.now()
          });
          const content = `✅ Loan Approved!\n\nTransaction ID: ${tid}\n💰 Amount: ${loanAmount} $\n🏦 Added to your bank balance\n⚠️ Remember to repay with "bank repay [amount]"`;
          const imagePath = await generateImageResponse('Loan Approved', content);
          return message.reply({ attachment: fs.createReadStream(imagePath) });
        }

        // ================= REPAY =================
        case "repay": {
          if (!amount || amount <= 0) {
            const content = '🌷 Usage: bank repay [amount]\nExample: bank repay 5000';
            const imagePath = await generateImageResponse('Repay Instructions', content);
            return message.reply({ attachment: fs.createReadStream(imagePath) });
          }
          if (userData.loan <= 0) {
            const content = '❌ You don\'t have any active loans to repay!';
            const imagePath = await generateImageResponse('Repay Failed', content);
            return message.reply({ attachment: fs.createReadStream(imagePath) });
          }
          if (userData.balance < amount) {
            const content = `❌ Insufficient Bank Balance!\n🏦 Your Balance: ${userData.balance} $\n💸 Required: ${amount} $\n💰 Loan Remaining: ${userData.loan} $`;
            const imagePath = await generateImageResponse('Repay Failed', content);
            return message.reply({ attachment: fs.createReadStream(imagePath) });
          }

          const repaymentAmount = Math.min(amount, userData.loan);
          await users.updateOne({ uid }, { $inc: { balance: -repaymentAmount, loan: -repaymentAmount } });
          const tid = generateTransactionID();
          await transactions.insertOne({
            tid, uid, userName: await getUserName(uid), type: "repay", amount: repaymentAmount,
            balanceBefore: userData.balance, balanceAfter: userData.balance - repaymentAmount, date: Date.now()
          });

          const content = `✅ Repayment Successful!\n\nTransaction ID: ${tid}\n💰 Amount: ${repaymentAmount} $\n🏦 Bank Balance: -${repaymentAmount} $\n💳 Remaining Loan: ${userData.loan - repaymentAmount} $`;
          const imagePath = await generateImageResponse('Loan Repaid', content);
          return message.reply({ attachment: fs.createReadStream(imagePath) });
        }

        // ================= INTEREST =================
        case "interest": {
          const now = Date.now();
          const lastInterestTime = userData.lastInterest || 0;
          const hoursSinceLastInterest = Math.floor((now - lastInterestTime) / (1000 * 60 * 60));
          if (hoursSinceLastInterest < 6) {
            const hoursLeft = 6 - hoursSinceLastInterest;
            const content = `⏳ Interest not available yet!\n🕒 Come back in ${hoursLeft} hours`;
            const imagePath = await generateImageResponse('Interest Pending', content);
            return message.reply({ attachment: fs.createReadStream(imagePath) });
          }
          const interestAmount = Math.floor(userData.balance * 0.1); // 10% interest
          await users.updateOne({ uid }, { $inc: { balance: interestAmount, interestProfit: interestAmount }, $set: { lastInterest: now } });
          const tid = generateTransactionID();
          await transactions.insertOne({
            tid, uid, userName: await getUserName(uid), type: "interest", amount: interestAmount,
            balanceBefore: userData.balance, balanceAfter: userData.balance + interestAmount, date: Date.now()
          });

          const content = `💰 Interest Credited!\n\nTransaction ID: ${tid}\n💸 Amount: ${interestAmount} $\n🏦 New Balance: ${userData.balance + interestAmount} $\n⏳ Next interest in 6 hours`;
          const imagePath = await generateImageResponse('Interest Earned', content);
          return message.reply({ attachment: fs.createReadStream(imagePath) });
        }

        // ================= TOP =================
        case "top": {
          const topUsers = await users.find().sort({ balance: -1 }).limit(10).toArray();
          let content = '🏆 Top 10 Richest Members 🏆\n\n';
          for (const [index, user] of topUsers.entries()) {
            const userName = await getUserName(user.uid);
            content += `${index + 1}. ${userName} - ${user.balance} $\n`;
          }
          const imagePath = await generateImageResponse('Bank Leaderboard', content);
          return message.reply({ attachment: fs.createReadStream(imagePath) });
        }

        // ================= BET =================
        case "bet": {
          if (!amount || amount <= 0) return sendBetInstructions();
          if (userData.balance < amount) return sendBetFailed();

          const win = Math.random() > 0.5;
          const changeAmount = win ? amount : -amount;
          await users.updateOne({ uid }, { $inc: { balance: changeAmount } });
          const updatedUser = await users.findOne({ uid });
          const tid = generateTransactionID();
          await transactions.insertOne({
            tid, uid, userName: await getUserName(uid), type: "bet", amount: changeAmount,
            balanceBefore: userData.balance, balanceAfter: updatedUser.balance, date: Date.now()
          });

          const content = win ? `🎉 You Won!\n\nTransaction ID: ${tid}\n💰 Amount: +${amount} $\n🏦 New Balance: ${updatedUser.balance} $` : `💔 You Lost!\n\nTransaction ID: ${tid}\n💸 Amount: -${amount} $\n🏦 New Balance: ${updatedUser.balance} $`;
          const imagePath = await generateImageResponse(win ? 'You Won!' : 'You Lost!', content);
          return message.reply({ attachment: fs.createReadStream(imagePath) });
        }

        // ================= DETAILS =================
        case "details": {
          const userName = await getUserName(uid);
          const cashBalance = await usersData.get(uid, "money") || 0;
          const content = `🏦 Account Details for ${userName}\n\n💳 Account ID: ${uid}\n📅 Joined: ${new Date(userData.joinedAt).toLocaleDateString()}\n\n💰 Balances:\n🏦 Bank: ${userData.balance} $\n💵 Cash: ${cashBalance} $\n💳 Loan: ${userData.loan} $\n\n💸 Interest Stats:\n🕒 Last Claim: ${new Date(userData.lastInterest).toLocaleString()}\n💰 Total Earned: ${userData.interestProfit || 0} $`;
          const imagePath = await generateImageResponse('Account Details', content);
          return message.reply({ attachment: fs.createReadStream(imagePath) });
        }

        // ================= HELP =================
        case "help":
        default: {
          const helpContent = `🏦 Bank Commands Guide 🏦\n\n1. balance - Check balances\n2. deposit [amount] - Move cash to bank (2 min delay)\n3. withdraw [amount] - Move bank to cash (10 min delay)\n4. loan - Get 20k loan (once)\n5. repay [amount] - Pay back loan\n6. interest - Earn 10% every 6h\n7. top - See richest members\n8. bet [amount] - 50/50 gamble\n9. details - Your account info\n10. help - This menu`;
          const imagePath = await generateImageResponse('Bank Help Center', helpContent);
          return message.reply({ attachment: fs.createReadStream(imagePath) });
        }
      }

    } catch (error) {
      console.error("Bank error:", error);
      const content = "❌ An error occurred in the bank system. Please try again later.";
      const imagePath = await generateImageResponse('Bank Error', content);
      return message.reply({ attachment: fs.createReadStream(imagePath) });
    } finally {
      await client.close();
    }
  }
};
