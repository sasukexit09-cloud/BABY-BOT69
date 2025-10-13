const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "bal",
    aliases: ["balance", "money"],
    version: "1.5.1", // ভার্সন আপডেট করা হলো
    author: "TAREK",
    countDown: 2,
    role: 0,
    shortDescription: "Show balance or transfer money",
    longDescription: "View your or others' balance as image with formatted large numbers. Also supports transferring balance via mention or reply.",
    category: "economy"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const senderID = event.senderID;
    const mentionID = Object.keys(event.mentions || {})[0];
    const replyID = event.messageReply?.senderID;

    // --------- TRANSFER LOGIC (No Change) ---------
    if (args[0]?.toLowerCase() === "transfer") {
      const amount = parseInt(args[1]);
      const receiverID = mentionID || (replyID && replyID !== senderID ? replyID : null);

      if (!receiverID)
        return api.sendMessage("❌ Mention or reply to the user you want to transfer to.", event.threadID);

      if (!amount || amount <= 0)
        return api.sendMessage("❌ Provide a valid amount to transfer.", event.threadID);

      if (receiverID === senderID)
        return api.sendMessage("❌ You cannot transfer money to yourself.", event.threadID);

      const senderData = await usersData.get(senderID);
      const receiverData = await usersData.get(receiverID);

      if (!senderData || (senderData.money || 0) < amount)
        return api.sendMessage("❌ You don't have enough balance to transfer.", event.threadID);

      // Cash Balance Update
      senderData.money -= amount;
      receiverData.money = (receiverData.money || 0) + amount;

      await usersData.set(senderID, senderData);
      await usersData.set(receiverID, receiverData);

      // Last Transaction Update (For simplicity, updating sender's last transaction text here)
      senderData.lastTransaction = `Transfer Out: ${this.formatNumber(amount)}$`;
      senderData.lastTransactionAmount = amount * -1; // Negative for transfer out
      await usersData.set(senderID, senderData);
      
      return api.sendMessage(
        `✅ Successfully transferred ${this.formatNumber(amount)}$ to ${receiverData.name || "someone"}.`,
        event.threadID
      );
    }

    // --------- BALANCE DISPLAY ---------
    const targetID = mentionID || (replyID && replyID !== senderID ? replyID : senderID);

    try {
      const userData = await usersData.get(targetID) || {};
      const allUsers = await usersData.getAll();

      const accountName = userData.name || "User Account";
      
      // *** আসল ডেটা লোড করা হচ্ছে ***
      const cashOnHand = Number(userData.money) || 0;     
      const totalDeposit = Number(userData.bank) || 0; // Bank Balance
      const currentDebt = Number(userData.loan) || 0;     
      
      // ** নতুন ডেটা লোড **
      const dailyStreak = Number(userData.streak) || 1; // Daily Streak
      const totalEXP = Number(userData.exp) || 8500; // Total EXP (ডামি ভ্যালু)
      let position = "Casual User";
      if (cashOnHand + totalDeposit > 5000000) {
        position = "Investor";
      } else if (cashOnHand + totalDeposit > 1000000) {
        position = "Active Trader";
      }
      const marketPosition = userData.marketPos || position; // Market Position 

      // Net Worth = Cash + Deposit + Asset - Loan 
      const netWorth = (cashOnHand + totalDeposit + (Number(userData.assetValue) || 0)) - currentDebt; 
      
      // ** Last Transaction **
      const lastTransactionText = userData.lastTransaction || "No recent activity"; 
      const lastTransactionAmount = Number(userData.lastTransactionAmount) || 0; 

      // Rank বের করার লজিক: Net Worth এর উপর ভিত্তি করে
      const sortedUsers = allUsers
        .filter(u => typeof (Number(u.money) + Number(u.bank)) === 'number')
        .map(u => ({ 
             userID: u.userID, 
             netWorth: (Number(u.money) || 0) + (Number(u.bank) || 0) - (Number(u.loan) || 0) 
        }))
        .sort((a, b) => b.netWorth - a.netWorth);
        
      const rankIndex = sortedUsers.findIndex(u => u.userID == targetID);
      const rank = rankIndex !== -1 ? `#${rankIndex + 1}` : "Unranked";
      
      // Load avatar (ট্রান্সপারেন্ট ইমেজ)
      let avatar; 
      try {
        const avatarUrl = await usersData.getAvatarUrl(targetID); 
        const avatarResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
        avatar = await loadImage(avatarResponse.data);
      } catch {
        const transparentPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        avatar = await loadImage(Buffer.from(transparentPng, 'base64'));
      }

      // Create canvas
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext("2d");

      // --- ১. ব্যাকগ্রাউন্ড ---
      const backgroundGradient = ctx.createLinearGradient(0, 0, 800, 600);
      backgroundGradient.addColorStop(0, "#2c3e50"); 
      backgroundGradient.addColorStop(1, "#212f3d"); 
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, 800, 600);

      // ছোট ডট প্যাটার্ন
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)"; 
      for (let i = 0; i < 800; i += 20) {
          for (let j = 0; j < 600; j += 20) {
              ctx.fillRect(i, j, 1, 1);
          }
      }

      // --- ২. টাইটেল এবং তারিখ (পরিবর্তন করা হয়নি - এটি অটো আপডেট করবে) ---
      ctx.fillStyle = "#ffffff"; 
      ctx.textAlign = "center";
      ctx.font = "bold 34px Arial";
      ctx.fillText("ACCOUNT OVERVIEW", 400, 50);

      ctx.font = "16px Arial";
      ctx.fillStyle = "#bbbbbb"; 
      
      // *** এই অংশটি অটোমেটিক্যালি সঠিক তারিখ এবং সময় দেখাবে ***
      const now = new Date();
      // 'en-US' লোকেল ব্যবহার করা হয়েছে, কিন্তু আপনি যদি বাংলা বা অন্য কোনো ফরমেট চান, তবে পরিবর্তন করতে পারেন।
      const dateString = now.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
      const timeString = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true }); 
      ctx.fillText(`${dateString} at ${timeString}`, 400, 80); 

      // --- ৩. "NET WORTH" সেকশন ---
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Arial";
      ctx.fillText("NET WORTH", 400, 150);

      ctx.font = "bold 48px Arial";
      ctx.fillStyle = "#00ff99"; 
      ctx.fillText(`$${this.formatNumber(netWorth)}`, 400, 205); 

      ctx.font = "14px Arial";
      ctx.fillStyle = "#bbbbbb";
      ctx.fillText(`Rank: ${rank} | Debt: $${this.formatNumber(currentDebt)}`, 400, 235); 

      // --- ৪. গ্রাফ ---
      ctx.strokeStyle = "#4CAF50"; 
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100, 280); 
      ctx.lineTo(200, 260);
      ctx.lineTo(300, 290);
      ctx.lineTo(400, 270);
      ctx.lineTo(500, 310);
      ctx.lineTo(600, 290);
      ctx.lineTo(700, 270);
      ctx.stroke();

      // --- ৫. নিচের ৪টি বক্স (সবগুলো সমান উচ্চতা) ---
      const boxMargin = 30; 
      const boxPadding = 15;
      const boxStartY = 330; 
      
      const boxWidth = 350; 
      
      const totalVerticalSpace = (canvas.height - boxStartY - boxMargin * 3); 
      const standardBoxHeight = totalVerticalSpace / 2; 

      const drawCustomBox = (x, y, w, h, borderColor, title, mainValue, subLabel1 = "", subValue1 = "", subLabel2 = "", subValue2 = "") => {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "left";
        ctx.fillText(title, x + boxPadding, y + 30); 

        ctx.font = "bold 28px Arial";
        ctx.fillStyle = borderColor; 
        ctx.fillText(mainValue, x + boxPadding, y + 65); 

        ctx.font = "14px Arial";
        ctx.fillStyle = "#bbbbbb"; 

        if (subLabel1 && subValue1) {
            ctx.fillText(`${subLabel1}: ${subValue1}`, x + boxPadding, y + 85); 
        }
        if (subLabel2 && subValue2) {
            ctx.fillText(`${subLabel2}: ${subValue2}`, x + boxPadding, y + 105); 
        }
      };

      // বাম উপরে: DAILY STREAK (লাল বর্ডার)
      drawCustomBox(
        boxMargin, boxStartY, boxWidth, standardBoxHeight, "#e74c3c", 
        "DAILY STREAK", 
        `${this.formatNumber(dailyStreak)} Days`, 
        "Last Claim", 'Today 10 AM', 
      );

      // ডান উপরে: CASH ON HAND (নীল বর্ডার)
      drawCustomBox(
        800 - boxWidth - boxMargin, boxStartY, boxWidth, standardBoxHeight, "#3498db", 
        "CASH ON HAND",
        `$${this.formatNumber(cashOnHand)}`, 
        "Deposit", `$${this.formatNumber(totalDeposit)}`
      );

      // বাম নিচে: MARKET POSITION (বেগুনি বর্ডার)
      drawCustomBox(
        boxMargin, boxStartY + standardBoxHeight + boxMargin, boxWidth, standardBoxHeight, "#9b59b6", 
        "MARKET POSITION",
        marketPosition, 
        "Last Transaction", lastTransactionText,
        "Account Name", accountName
      );

      // ডান নিচে: TOTAL EXP (হালকা নীল বর্ডার)
      drawCustomBox(
        800 - boxWidth - boxMargin, boxStartY + standardBoxHeight + boxMargin, boxWidth, standardBoxHeight, "#5dade2", 
        "TOTAL EXP", 
        `${this.formatNumber(totalEXP)} XP`, 
        "Next Level", `Level 5`
      );
      
      // --- ৬. ফুটার টেক্সট ---
      ctx.fillStyle = "#bbbbbb";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`User ID: ${targetID}`, boxMargin, 580); 

      ctx.textAlign = "right";
      ctx.fillText(`API: TAREK`, 800 - boxMargin, 580); 

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const imgPath = path.join(cacheDir, `${targetID}_bal.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      api.sendMessage({
        body: `📊 ${accountName} এর অ্যাকাউন্ট ওভারভিউ দেখাচ্ছে`, 
        attachment: fs.createReadStream(imgPath)
      }, event.threadID, () => fs.unlinkSync(imgPath));
    } catch (err) {
      console.error("💥 Error in bal.js:", err);
      return api.sendMessage("❌ ব্যালেন্স ডেটা লোড করতে ব্যর্থ হয়েছে।", event.threadID);
    }
  },

  // সাধারণ সংখ্যা ফরম্যাটার (K, M, B, T)
  formatNumber: function(num) {
    if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toLocaleString();
  }
};
