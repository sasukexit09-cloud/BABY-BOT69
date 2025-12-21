const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

const DATA_FILE = path.join(__dirname, "userData.json");

async function loadUsersData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function formatNumber(num) {
  if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toLocaleString();
}

module.exports = {
  name: "balchart",
  description: "Generate Premium Excel-style balance chart",
  onStart: async function({ api, event }) {
    try {
      const allUsersObj = await loadUsersData();
      const allUsers = Object.values(allUsersObj);
      if (!allUsers.length) return api.sendMessage("❌ No user data found.", event.threadID);

      // ===== Canvas Setup =====
      const width = 1200;
      const height = 200 + allUsers.length * 60; // Adjust based on users
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ===== Background Gradient =====
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#1f2a48");
      gradient.addColorStop(0.5, "#3b4c7a");
      gradient.addColorStop(1, "#1f2a48");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ===== Headline =====
      ctx.fillStyle = "#f1c40f";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.fillText("ALL USERS BALANCE CHART", width / 2, 50);

      // ===== Grid/Excel Style Table =====
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      const startY = 100;
      const rowHeight = 50;
      const colX = [20, 150, 300, 420, 540, 660, 780, 900, 1020]; // Columns
      const titles = ["UserID", "Name", "Cash", "Bank", "Assets", "Loan", "Net Worth", "Earned", "Spent"];

      // Draw header row
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "left";
      titles.forEach((t, i) => ctx.fillText(t, colX[i], startY));

      ctx.strokeStyle = "#ffffff";
      // Draw horizontal line under header
      ctx.beginPath();
      ctx.moveTo(0, startY + 10);
      ctx.lineTo(width, startY + 10);
      ctx.stroke();

      // Draw each user row
      ctx.font = "16px Arial";
      let y = startY + 40;
      allUsers.forEach(u => {
        const cash = Number(u.money) || 0;
        const bank = Number(u.bank) || 0;
        const assets = Number(u.assetValue) || 0;
        const loan = Number(u.loan) || 0;
        const net = cash + bank + assets - loan;

        let totalEarn = 0, totalSpent = 0;
        if (u.transactionHistory && Array.isArray(u.transactionHistory)) {
          u.transactionHistory.forEach(tx => {
            const amount = Number(tx.amount) || 0;
            if (amount > 0) totalEarn += amount;
            else totalSpent += Math.abs(amount);
          });
        }

        const values = [
          u.userID || "-",
          u.name || "-",
          `$${formatNumber(cash)}`,
          `$${formatNumber(bank)}`,
          `$${formatNumber(assets)}`,
          `$${formatNumber(loan)}`,
          `$${formatNumber(net)}`,
          `$${formatNumber(totalEarn)}`,
          `$${formatNumber(totalSpent)}`
        ];

        // Draw horizontal line for row
        ctx.strokeStyle = "#ffffff33";
        ctx.beginPath();
        ctx.moveTo(0, y - 20);
        ctx.lineTo(width, y - 20);
        ctx.stroke();

        values.forEach((v, i) => ctx.fillText(v, colX[i], y));
        y += rowHeight;
      });

      // Save & Send
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const imgPath = path.join(cacheDir, `balance_chart_premium.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      api.sendMessage(
        { body: `📊 All USERS BALANCE CHART ✨`, attachment: fs.createReadStream(imgPath) },
        event.threadID,
        () => fs.unlinkSync(imgPath)
      );

    } catch (err) {
      console.error("💥 Error generating premium balance chart:", err);
      api.sendMessage("❌ Failed to generate premium balance chart.", event.threadID);
    }
  }
};