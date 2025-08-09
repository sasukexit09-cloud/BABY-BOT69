const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "bank",
    version: "2.0.2",
    author: "TAREK",
    countDown: 5,
    role: 0,
    category: "💰 Economy",
    shortDescription: "Banking system with visual responses",
    longDescription: "Deposit, withdraw, earn interest with rich visual responses"
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    const { MongoClient } = require("mongodb");
    const uri = "mongodb+srv://tarekshikdar09:tarek099@bot-cluster.a7rzjf4.mongodb.net/?retryWrites=true&w=majority&appName=bot-cluster";
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db("bankSystem");
      const users = db.collection("users");
      const uid = event.senderID;
      const action = args[0]?.toLowerCase();
      const amount = parseInt(args[1]);

      // Create user if not exists
      const user = await users.findOneAndUpdate(
        { uid },
        {
          $setOnInsert: {
            balance: 0,
            loan: 0,
            lastInterest: Date.now(),
            interestCount: 0,
            interestProfit: 0,
            joinedAt: Date.now()
          }
        },
        { upsert: true, returnDocument: "after" }
      );

      const userData = user?.value;

      // Function to get user name
      async function getUserName(uid) {
        try {
          const userInfo = await api.getUserInfo(uid);
          return userInfo[uid]?.name || "Unknown User";
        } catch {
          return "Unknown User";
        }
      }

      // Function to generate image response
      async function generateImageResponse(title, content) {
        const width = 800;
        const height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // Add decorative elements
        ctx.fillStyle = '#4cc9f0';
        ctx.beginPath();
        ctx.arc(width - 50, 50, 30, 0, Math.PI * 2);
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
        ctx.fillText('TAREK Bank System', width / 2, height - 30);

        const imagePath = path.join(__dirname, 'tmp', `bank_${uid}.png`);
        const out = fs.createWriteStream(imagePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        return new Promise((resolve) => {
          out.on('finish', () => resolve(imagePath));
        });
      }

      // Handle commands
      switch (action) {
        case "balance": {
          const cashBalance = await usersData.get(uid, "money") || 0;
          const content = `💙 Your Account Summary:\n\n🏦 Bank Balance: ${userData.balance} $\n💵 Cash Balance: ${cashBalance} $\n💰 Total: ${userData.balance + cashBalance} $`;
          const imagePath = await generateImageResponse('Account Balance', content);
          return message.reply({
            attachment: fs.createReadStream(imagePath)
          });
        }

        case "deposit": {
          if (!amount || amount <= 0) {
            const content = '🌷 Usage: bank deposit [amount]\nExample: bank deposit 500';
            const imagePath = await generateImageResponse('Deposit Instructions', content);
            return message.reply({
              attachment: fs.createReadStream(imagePath)
            });
          }

          const cashBalance = await usersData.get(uid, "money") || 0;
          if (cashBalance < amount) {
            const content = `❌ Insufficient Cash Balance!\n💵 Your Cash: ${cashBalance} $\n💸 Required: ${amount} $`;
            const imagePath = await generateImageResponse('Deposit Failed', content);
            return message.reply({
              attachment: fs.createReadStream(imagePath)
            });
          }

          // Update both balances - FIXED
          await usersData.set(uid, { money: cashBalance - amount });
          await users.updateOne({ uid }, { $inc: { balance: amount } });

          const updatedUser = await users.findOne({ uid });
          const content = `✅ Deposit Successful!\n\n💵 Cash: -${amount} $\n🏦 Bank: +${amount} $\n\n💼 New Balances:\n💵 Cash: ${cashBalance - amount} $\n🏦 Bank: ${updatedUser.balance} $`;
          const imagePath = await generateImageResponse('Deposit Complete', content);
          return message.reply({
            attachment: fs.createReadStream(imagePath)
          });
        }

        case "withdraw": {
          if (!amount || amount <= 0) {
            const content = '🌷 Usage: bank withdraw [amount]\nExample: bank withdraw 500';
            const imagePath = await generateImageResponse('Withdraw Instructions', content);
            return message.reply({
              attachment: fs.createReadStream(imagePath)
            });
          }

          if (userData.balance < amount) {
            const content = `❌ Insufficient Bank Balance!\n🏦 Your Balance: ${userData.balance} $\n💸 Required: ${amount} $`;
            const imagePath = await generateImageResponse('Withdraw Failed', content);
            return message.reply({
              attachment: fs.createReadStream(imagePath)
            });
          }

          const cashBalance = await usersData.get(uid, "money") || 0;
          // Update both balances - FIXED
          await users.updateOne({ uid }, { $inc: { balance: -amount } });
          await usersData.set(uid, { money: cashBalance + amount });

          const updatedUser = await users.findOne({ uid });
          const content = `✅ Withdrawal Successful!\n\n🏦 Bank: -${amount} $\n💵 Cash: +${amount} $\n\n💼 New Balances:\n🏦 Bank: ${updatedUser.balance} $\n💵 Cash: ${cashBalance + amount} $`;
          const imagePath = await generateImageResponse('Withdraw Complete', content);
          return message.reply({
            attachment: fs.createReadStream(imagePath)
          });
        }

        case "loan": {
          if (userData.loan > 0) {
            const content = `❌ You already have an active loan!\n💰 Loan Amount: ${userData.loan} $\n💳 Remaining: ${userData.loan} $`;
            const imagePath = await generateImageResponse('Loan Denied', content);
            return message.reply({
              attachment: fs.createReadStream(imagePath)
            });
          }

          const loanAmount = 20000;
          await users.updateOne({ uid }, { 
            $inc: { balance: loanAmount, loan: loanAmount },
            $set: { lastLoan: Date.now() }
          });

          const content = `✅ Loan Approved!\n\n💰 Amount: ${loanAmount} $\n🏦 Added to your bank balance\n⚠️ Remember to repay with "bank repay [amount]"`;
          const imagePath = await generateImageResponse('Loan Approved', content);
          return message.reply({
            attachment: fs.createReadStream(imagePath)
          });
        }

        case "repay": {
          if (!amount || amount <= 0) {
            const content = '🌷 Usage: bank repay [amount]\nExample: bank repay 5000';
            const imagePath = await generateImageResponse('Repay Instructions', content);
            return message.reply({
              attachment: fs.createReadStream(imagePath)
            });
          }

          if (userData.loan <= 0) {
            const content = '❌ You don\'t have any active loans to repay!';
            const imagePath = await generateImageResponse('Repay Failed', content);
            return message.reply({
              attachment: fs.createReadStream(imagePath)
            });
          }

          if (userData.balance < amount) {
            const content = `❌ Insufficient Bank Balance!\n🏦 Your Balance: ${userData.balance} $\n💸 Required: ${amount} $\n💰 Loan Remaining: ${userData.loan} $`;
            const imagePath = await generateImageResponse('Repay Failed', content);
            return message.reply({
              attachment: fs.createReadStream(imagePath)
            });
          }

          const repaymentAmount = Math.min(amount, userData.loan);
          await users.updateOne({ uid }, { 
            $inc: { balance: -repaymentAmount, loan: -repaymentAmount }
          });

          const content = `✅ Repayment Successful!\n\n💰 Amount: ${repaymentAmount} $\n🏦 Bank Balance: -${repaymentAmount} $\n💳 Remaining Loan: ${userData.loan - repaymentAmount} $`;
          const imagePath = await generateImageResponse('Loan Repaid', content);
          return message.reply({
            attachment: fs.createReadStream(imagePath)
          });
        }

        case "interest": {
          const now = Date.now();
          const lastInterestTime = userData.lastInterest || 0;
          const hoursSinceLastInterest = Math.floor((now - lastInterestTime) / (1000 * 60 * 60));

          if (hoursSinceLastInterest < 6) {
            const hoursLeft = 6 - hoursSinceLastInterest;
            const content = `⏳ Interest not available yet!\n🕒 Come back in ${hoursLeft} hours`;
            const imagePath = await generateImageResponse('Interest Pending', content);
            return message.reply({
              attachment: fs.createReadStream(imagePath)
            });
          }

          const interestAmount = Math.floor(userData.balance * 0.1); // 10% interest
          await users.updateOne(
            { uid },
            {
              $inc: { balance: interestAmount, interestProfit: interestAmount },
              $set: { lastInterest: now }
            }
          );

          const content = `💰 Interest Credited!\n\n💸 Amount: ${interestAmount} $\n🏦 New Balance: ${userData.balance + interestAmount} $\n⏳ Next interest in 6 hours`;
          const imagePath = await generateImageResponse('Interest Earned', content);
          return message.reply({
            attachment: fs.createReadStream(imagePath)
          });
        }

        case "top": {
          const topUsers = await users.find()
            .sort({ balance: -1 })
            .limit(10)
            .toArray();

          let content = '🏆 Top 10 Richest Members 🏆\n\n';
          for (const [index, user] of topUsers.entries()) {
            const userName = await getUserName(user.uid);
            content += `${index + 1}. ${userName} - ${user.balance} $\n`;
          }

          const imagePath = await generateImageResponse('Bank Leaderboard', content);
          return message.reply({
            attachment: fs.createReadStream(imagePath)
          });
        }

        case "bet": {
          if (!amount || amount <= 0) {
            const content = '🌷 Usage: bank bet [amount]\nExample: bank bet 500';
            const imagePath = await generateImageResponse('Bet Instructions', content);
            return message.reply({
              attachment: fs.createReadStream(imagePath)
            });
          }

          if (userData.balance < amount) {
            const content = `❌ Insufficient Bank Balance!\n🏦 Your Balance: ${userData.balance} $\n💸 Required: ${amount} $`;
            const imagePath = await generateImageResponse('Bet Failed', content);
            return message.reply({
              attachment: fs.createReadStream(imagePath)
            });
          }

          const win = Math.random() > 0.5;
          const changeAmount = win ? amount : -amount;
          await users.updateOne({ uid }, { $inc: { balance: changeAmount } });

          const content = win 
            ? `🎉 You Won!\n\n💰 Amount: +${amount} $\n🏦 New Balance: ${userData.balance + amount} $`
            : `💔 You Lost!\n\n💸 Amount: -${amount} $\n🏦 New Balance: ${userData.balance - amount} $`;

          const imagePath = await generateImageResponse(win ? 'You Won!' : 'You Lost!', content);
          return message.reply({
            attachment: fs.createReadStream(imagePath)
          });
        }

        case "details": {
          const userName = await getUserName(uid);
          const cashBalance = await usersData.get(uid, "money") || 0;
          const content = `🏦 Account Details for ${userName}\n\n💳 Account ID: ${uid}\n📅 Joined: ${new Date(userData.joinedAt).toLocaleDateString()}\n\n💰 Balances:\n🏦 Bank: ${userData.balance} $\n💵 Cash: ${cashBalance} $\n💳 Loan: ${userData.loan} $\n\n💸 Interest Stats:\n🕒 Last Claim: ${new Date(userData.lastInterest).toLocaleString()}\n💰 Total Earned: ${userData.interestProfit || 0} $`;

          const imagePath = await generateImageResponse('Account Details', content);
          return message.reply({
            attachment: fs.createReadStream(imagePath)
          });
        }

        case "help":
        default: {
          const helpContent = `🏦 Bank Commands Guide 🏦\n\n1. balance - Check balances\n2. deposit [amount] - Move cash to bank\n3. withdraw [amount] - Move bank to cash\n4. loan - Get 20k loan (once)\n5. repay [amount] - Pay back loan\n6. interest - Earn 10% every 6h\n7. top - See richest members\n8. bet [amount] - 50/50 gamble\n9. details - Your account info\n10. help - This menu`;

          const imagePath = await generateImageResponse('Bank Help Center', helpContent);
          return message.reply({
            attachment: fs.createReadStream(imagePath)
          });
        }
      }
    } catch (error) {
      console.error("Bank error:", error);
      const content = "❌ An error occurred in the bank system. Please try again later.";
      const imagePath = await generateImageResponse('Bank Error', content);
      return message.reply({
        attachment: fs.createReadStream(imagePath)
      });
    } finally {
      await client.close();
    }
  }
};
