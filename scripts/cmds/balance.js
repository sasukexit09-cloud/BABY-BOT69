const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// ================= CONFIG =================
const OWNER_ID = "61584308632995"; // 👈 তোমার UID বসাও
const MONTHLY_CARD_FEE = 10000;    // 10K$
const DATA_FILE = path.join(__dirname, "userData.json");

// ================= PERSISTENT STORAGE =================
async function loadUsersData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

async function saveUsersData(usersData) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(usersData, null, 2), "utf-8");
}

async function getUserData(userID) {
  const allData = await loadUsersData();
  return allData[userID] || {};
}

async function setUserData(userID, userData) {
  const allData = await loadUsersData();
  allData[userID] = userData;
  await saveUsersData(allData);
}

async function getAllUsers() {
  return await loadUsersData();
}

// ================= TIMEZONE (Bangladesh) =================
function getBangladeshDate() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 6 * 60 * 60000);
}

// ================= MODULE EXPORT =================
module.exports = {
  config: {
    name: "bal",
    aliases: ["balance", "money"],
    version: "2.0",
    author: "AYAN BBE💋",
    countDown: 2,
    role: 0,
    shortDescription: "Show balance or transfer money",
    longDescription: "View balance as premium debit card with monthly fee system",
    category: "economy",
  },

  // ================= FORMAT NUMBER =================
  formatNumber: function(num) {
    if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toLocaleString();
  },

  // ================= ON START =================
  onStart: async function({ api, event, args }) {
    const senderID = event.senderID;
    const mentionID = Object.keys(event.mentions || {})[0];
    const replyID = event.messageReply?.senderID;

    // ================= MONTHLY FEE (1st of month, VIP 50% discount) =================
    if (senderID !== OWNER_ID) {
      const userData = await getUserData(senderID) || {};
      const bdNow = getBangladeshDate();
      const today = bdNow.getDate();
      const currentMonth = bdNow.getMonth();

      // Only 1st of month
      if (today === 1 && userData.lastCardFeeMonth !== currentMonth) {
        const balance = Number(userData.money) || 0;
        if (balance > 0) {
          const isVIP = userData.vip === true;
          const finalFee = isVIP ? Math.floor(MONTHLY_CARD_FEE * 0.5) : MONTHLY_CARD_FEE;

          if (balance >= finalFee) {
            // Deduct fee
            userData.money = balance - finalFee;
            userData.lastCardFeeMonth = currentMonth;
            userData.lastTransaction = isVIP
              ? `Monthly Card Fee VIP (-${this.formatNumber(finalFee)}$)`
              : `Monthly Card Fee (-${this.formatNumber(finalFee)}$)`;
            userData.lastTransactionAmount = -finalFee;
            userData.cardType = "PREMIUM DEBIT";

            await setUserData(senderID, userData);

            // Add to owner
            const ownerData = await getUserData(OWNER_ID) || {};
            ownerData.money = (Number(ownerData.money) || 0) + finalFee;
            ownerData.lastTransaction = `Card Fee Received (+${this.formatNumber(finalFee)}$)`;
            ownerData.lastTransactionAmount = finalFee;
            await setUserData(OWNER_ID, ownerData);

            api.sendMessage(
              `💳 Monthly Debit Card Fee (1 Tarikh BD Time)\n` +
              `💎 Status: ${isVIP ? "VIP (50% Discount)" : "Standard"}\n` +
              `➖ Charged: ${this.formatNumber(finalFee)}$\n` +
              `👑 Owner account এ জমা হয়েছে`,
              event.threadID
            );
          }
        }
      }
    }

    // ================= TRANSFER LOGIC =================
    if (args[0]?.toLowerCase() === "transfer") {
      const amount = parseInt(args[1]);
      const receiverID = mentionID || (replyID && replyID !== senderID ? replyID : null);
      if (!receiverID) return api.sendMessage("❌ Mention or reply to the user you want to transfer to.", event.threadID);
      if (!amount || amount <= 0) return api.sendMessage("❌ Provide a valid amount to transfer.", event.threadID);
      if (receiverID === senderID) return api.sendMessage("❌ You cannot transfer money to yourself.", event.threadID);

      const senderData = await getUserData(senderID);
      const receiverData = await getUserData(receiverID);
      if (!senderData || (senderData.money || 0) < amount) return api.sendMessage("❌ You don't have enough balance to transfer.", event.threadID);

      // Cash Balance Update
      senderData.money -= amount;
      receiverData.money = (receiverData.money || 0) + amount;

      senderData.lastTransaction = `Transfer Out: ${this.formatNumber(amount)}$`;
      senderData.lastTransactionAmount = -amount;

      await setUserData(senderID, senderData);
      await setUserData(receiverID, receiverData);

      return api.sendMessage(
        `✅ Successfully transferred ${this.formatNumber(amount)}$ to ${receiverData.name || "someone"}.`,
        event.threadID
      );
    }

    // ================= BALANCE DISPLAY =================
    const targetID = mentionID || (replyID && replyID !== senderID ? replyID : senderID);
    try {
      const userData = await getUserData(targetID) || {};
      const allUsers = Object.values(await getAllUsers());
      const accountName = userData.name || "User Account";

      const cashOnHand = Number(userData.money) || 0;
      const totalDeposit = Number(userData.bank) || 0;
      const currentDebt = Number(userData.loan) || 0;
      const dailyStreak = Number(userData.streak) || 1;
      const totalEXP = Number(userData.exp) || 8500;
      let position = "Casual User";
      if (cashOnHand + totalDeposit > 5000000) position = "Investor";
      else if (cashOnHand + totalDeposit > 1000000) position = "Active Trader";
      const marketPosition = userData.marketPos || position;
      const netWorth = (cashOnHand + totalDeposit + (Number(userData.assetValue) || 0)) - currentDebt;
      const lastTransactionText = userData.lastTransaction || "No recent activity";
      const lastTransactionAmount = Number(userData.lastTransactionAmount) || 0;

      // Rank
      const sortedUsers = allUsers
        .filter(u => typeof (Number(u.money) + Number(u.bank)) === 'number')
        .map(u => ({ userID: u.userID, netWorth: (Number(u.money) || 0) + (Number(u.bank) || 0) - (Number(u.loan) || 0) }))
        .sort((a, b) => b.netWorth - a.netWorth);
      const rankIndex = sortedUsers.findIndex(u => u.userID == targetID);
      const rank = rankIndex !== -1 ? `#${rankIndex + 1}` : "Unranked";

      // Load avatar
      let avatar;
      try {
        const avatarUrl = userData.avatar || '';
        const avatarResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
        avatar = await loadImage(avatarResponse.data);
      } catch {
        const transparentPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        avatar = await loadImage(Buffer.from(transparentPng, 'base64'));
      }

      // Create canvas
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext("2d");

      // Background (Premium Debit Card)
      const backgroundGradient = ctx.createLinearGradient(0, 0, 800, 600);
      backgroundGradient.addColorStop(0, "#1c1c1c");
      backgroundGradient.addColorStop(0.5, "#d4af37");
      backgroundGradient.addColorStop(1, "#000000");
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, 800, 600);

      // Title
      ctx.fillStyle = "#f1c40f";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.fillText("PREMIUM DEBIT CARD", 400, 50);

      // Net Worth
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Arial";
      ctx.fillText("NET WORTH", 400, 150);
      ctx.font = "bold 48px Arial";
      ctx.fillStyle = "#00ff99";
      ctx.fillText(`$${this.formatNumber(netWorth)}`, 400, 205);
      ctx.font = "14px Arial";
      ctx.fillStyle = "#bbbbbb";
      ctx.fillText(`Rank: ${rank} | Debt: $${this.formatNumber(currentDebt)}`, 400, 235);

      // Bottom Boxes
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
        if (subLabel1 && subValue1) ctx.fillText(`${subLabel1}: ${subValue1}`, x + boxPadding, y + 85);
        if (subLabel2 && subValue2) ctx.fillText(`${subLabel2}: ${subValue2}`, x + boxPadding, y + 105);
      };

      // Boxes
      drawCustomBox(boxMargin, boxStartY, boxWidth, standardBoxHeight, "#e74c3c", "DAILY STREAK", `${this.formatNumber(dailyStreak)} Days`);
      drawCustomBox(800 - boxWidth - boxMargin, boxStartY, boxWidth, standardBoxHeight, "#3498db", "CASH ON HAND", `$${this.formatNumber(cashOnHand)}`, "Deposit", `$${this.formatNumber(totalDeposit)}`);
      drawCustomBox(boxMargin, boxStartY + standardBoxHeight + boxMargin, boxWidth, standardBoxHeight, "#f1c40f", "DEBIT CARD", userData.cardType || "STANDARD", "Card Holder", accountName, "Status", senderID === OWNER_ID ? "BLACK OWNER" : "ACTIVE");
      drawCustomBox(800 - boxWidth - boxMargin, boxStartY + standardBoxHeight + boxMargin, boxWidth, standardBoxHeight, "#5dade2", "TOTAL EXP", `${this.formatNumber(totalEXP)} XP`, "Next Level", `Level 5`);

      // Footer
      ctx.fillStyle = "#bbbbbb";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`User ID: ${targetID}`, boxMargin, 580);
      ctx.textAlign = "right";
      ctx.fillText(`API: TAREK`, 800 - boxMargin, 580);

      // Save & Send
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const imgPath = path.join(cacheDir, `${targetID}_bal.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      api.sendMessage({ body: `📊 ${accountName} এর অ্যাকাউন্ট ওভারভিউ দেখাচ্ছে`, attachment: fs.createReadStream(imgPath) }, event.threadID, () => fs.unlinkSync(imgPath));

    } catch (err) {
      console.error("💥 Error in bal.js:", err);
      return api.sendMessage("❌ ব্যালেন্স ডেটা লোড করতে ব্যর্থ হয়েছে।", event.threadID);
    }
  }
};
