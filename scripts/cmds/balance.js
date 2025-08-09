const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "bal",
    aliases: ["balance", "money"],
    version: "1.3.0",
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

    // --------- TRANSFER LOGIC ---------
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

      // Transfer
      senderData.money -= amount;
      receiverData.money = (receiverData.money || 0) + amount;

      await usersData.set(senderID, senderData);
      await usersData.set(receiverID, receiverData);

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

      const name = userData.name || "Unknown";
      const money = Number(userData.money) || 0;
      const bank = Number(userData.bank) || 0; // Fixed: Properly get bank balance
      const loan = Number(userData.loan) || 0; // Fixed: Properly get loan balance
      const lastTransaction = userData.lastTransaction || "No recent activity";

      const sortedUsers = allUsers
        .filter(u => typeof u.money === 'number')
        .sort((a, b) => b.money - a.money);
      const rankIndex = sortedUsers.findIndex(u => u.userID == targetID);
      const rank = rankIndex !== -1 ? `#${rankIndex + 1}` : "Unranked";

      // Load avatar
      let avatar;
      try {
        const avatarUrl = await usersData.getAvatarUrl(targetID);
        const avatarResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
        avatar = await loadImage(avatarResponse.data);
      } catch {
        avatar = await loadImage(path.join(__dirname, "default-avatar.png"));
      }

      // Create canvas
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 800, 600);

      // Profile circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(400, 80, 50, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 350, 30, 100, 100);
      ctx.restore();

      // Title
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${name}'s Balance`, 400, 160);

      // Helper function to format large numbers
      const formatNumber = (num) => {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
        if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
        if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
        if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
        return num.toLocaleString();
      };

      const drawBox = (x, y, w, h, borderColor, label, value, isText = false) => {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, w, h);
        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(label, x + w / 2, y + 30);
        ctx.font = "20px Arial";
        
        // Adjust font size for very large numbers
        const formattedValue = isText ? value : formatNumber(value) + "$";
        const maxWidth = w - 40;
        let fontSize = 20;
        
        // Check if text fits, reduce font size if needed
        ctx.font = `${fontSize}px Arial`;
        while (ctx.measureText(formattedValue).width > maxWidth && fontSize > 10) {
          fontSize -= 1;
          ctx.font = `${fontSize}px Arial`;
        }
        
        ctx.fillText(formattedValue, x + w / 2, y + 65);
      };

      // Draw all balance boxes - Now showing all values correctly
      drawBox(80, 200, 280, 90, "red", "Cash Balance", money);
      drawBox(440, 200, 280, 90, "blue", "Bank Balance", bank);
      drawBox(80, 320, 280, 80, "pink", "Balance Rank", rank, true);
      drawBox(440, 320, 280, 80, "green", "Loan Balance", loan);
      drawBox(230, 430, 340, 80, "olive", "Last Transaction", lastTransaction, true);

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const imgPath = path.join(cacheDir, `${targetID}_bal.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      api.sendMessage({
        body: `📊 Balance preview for ${name}`,
        attachment: fs.createReadStream(imgPath)
      }, event.threadID, () => fs.unlinkSync(imgPath));
    } catch (err) {
      console.error("💥 Error in bal.js:", err);
      return api.sendMessage("❌ Failed to load balance data.", event.threadID);
    }
  },

  // Helper function to format numbers for transfer message
  formatNumber: function(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toLocaleString();
  }
};
