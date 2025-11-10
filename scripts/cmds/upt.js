const os = require("os");
const { execSync } = require("child_process");
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function formatBytes(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
}

module.exports = {
  config: {
    name: "upt",
    version: "2.5",
    author: "💫 AYAN HOST ✨",
    shortDescription: "Stylized RGB uptime dashboard",
    longDescription: "Beautiful RGB-styled uptime dashboard with fake graphs and system stats",
    category: "system",
    guide: "{pn}"
  },

  onStart: async function ({ message, usersData }) {
    try {
      const uptimeSec = process.uptime();
      const h = Math.floor(uptimeSec / 3600);
      const m = Math.floor((uptimeSec % 3600) / 60);
      const s = Math.floor(uptimeSec % 60);
      const uptime = `${h}h ${m}m ${s}s`;

      const totalMem = os.totalmem();
      const usedMem = totalMem - os.freemem();
      const memUsage = ((usedMem / totalMem) * 100).toFixed(1);

      let diskUsed = 0, diskTotal = 1;
      try {
        const df = execSync("df -k /").toString().split("\n")[1].split(/\s+/);
        diskUsed = parseInt(df[2]) * 1024;
        diskTotal = parseInt(df[1]) * 1024;
      } catch {}

      const diskUsage = ((diskUsed / diskTotal) * 100).toFixed(1);

      const canvas = createCanvas(640, 360);
      const ctx = canvas.getContext("2d");

      // Gradient background (RGB style)
      const gradient = ctx.createLinearGradient(0, 0, 640, 360);
      gradient.addColorStop(0, "#ff00cc");
      gradient.addColorStop(0.5, "#333399");
      gradient.addColorStop(1, "#00ffff");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 640, 360);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px sans-serif";
      ctx.fillText("BOT UPTIME DASHBOARD", 20, 30);

      ctx.font = "14px monospace";
      ctx.fillText(`Uptime: ${uptime}`, 20, 60);
      ctx.fillText(`Users: ${(await usersData.getAll()).length}`, 20, 80);

      // RAM Bar
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(20, 130, 200, 20);
      ctx.fillStyle = "#00ffcc";
      ctx.fillRect(20, 130, 2 * memUsage, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(`RAM: ${memUsage}% (${formatBytes(usedMem)}/${formatBytes(totalMem)})`, 240, 145);

      // Disk Bar
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(20, 170, 200, 20);
      ctx.fillStyle = "#ffff33";
      ctx.fillRect(20, 170, 2 * diskUsage, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(`Disk: ${diskUsage}% (${formatBytes(diskUsed)}/${formatBytes(diskTotal)})`, 240, 185);

      // Fake pulse graph
      ctx.strokeStyle = "#ff66cc";
      ctx.beginPath();
      ctx.moveTo(20, 250);
      for (let x = 20; x < 600; x += 15) {
        const y = 250 - Math.sin(x / 25) * (Math.random() * 25 + 10);
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Random dots
      ctx.fillStyle = "#00ffff";
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 600 + 20, Math.random() * 80 + 260, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // RGB Text for your name
      const rgbGradient = ctx.createLinearGradient(400, 0, 640, 0);
      rgbGradient.addColorStop(0, "#ff0000");
      rgbGradient.addColorStop(0.5, "#00ff00");
      rgbGradient.addColorStop(1, "#0000ff");
      ctx.fillStyle = rgbGradient;
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("AYAN HOST ⚡", 620, 340);

      // Save and send
      const filePath = path.join(__dirname, "uptime_dashboard.png");
      fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

      message.reply({
        body: "📊 | RGB Stylized Uptime Dashboard",
        attachment: fs.createReadStream(filePath)
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ | Failed to generate RGB dashboard.");
    }
  }
};
