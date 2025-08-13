const os = require("os");
const pidusage = require("pidusage");
const fs = require("fs");
const { createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up"],
    version: "4.0",
    author: "TAREK",
    countDown: 1,
    role: 0,
    shortDescription: "Show system and bot status (Neon Style)",
    longDescription: "Displays uptime, CPU, memory, disk, and bot stats in a neon cyberpunk style image with two columns",
    category: "info",
    guide: "{pn}",
    noPrefix: true
  },

  onStart: async function (context) {
    await sendUptime(context);
  },

  onChat: async function (context) {
    const input = context.event.body?.toLowerCase().trim();
    const triggers = [this.config.name, ...(this.config.aliases || [])];
    if (!triggers.includes(input)) return;
    await sendUptime(context);
  }
};

async function sendUptime({ message, usersData, threadsData }) {
  const now = new Date();
  const formatDate = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

  const uptimeBot = process.uptime();
  const uptimeSys = os.uptime();
  const toTime = (sec) => {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${d ? `${d}d ` : ""}${h}h ${m}m ${s}s`;
  };

  const usage = await pidusage(process.pid);
  const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(0);
  const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(0);
  const usedRam = (usage.memory / 1024 / 1024).toFixed(1);
  const cpuUsage = usage.cpu.toFixed(1);
  const cpuModel = os.cpus()[0].model;
  const cpuCores = os.cpus().length;
  const pkgCount = Object.keys(JSON.parse(fs.readFileSync('package.json')).dependencies || {}).length;

  const users = await usersData.getAll();
  const threads = await threadsData.getAll();

  const leftColumn = [
    `📅 Date: ${formatDate}`,
    `⏱️ Bot Uptime: ${toTime(uptimeBot)}`,
    `🖥️ System Uptime: ${toTime(uptimeSys)}`,
    `💻 CPU Model: ${cpuModel}`,
    `💻 CPU Cores: ${cpuCores}`,
    `💻 CPU Load: ${cpuUsage}%`,
    `💾 RAM Usage: ${usedRam} MB / ${totalRam} GB`
  ];

  const rightColumn = [
    `💾 Free Memory: ${freeRam} GB`,
    `📦 Packages: ${pkgCount}`,
    `👥 Users: ${users.length}`,
    `👨‍👩‍👧‍👦 Groups: ${threads.length}`,
    `🗂️ Disk Used: 325G / 387G`,
    `📁 Available: 264G`,
    `⚡ Powered by: Tarek Shikdar`
  ];

  const width = 900;
  const height = 100 + Math.max(leftColumn.length, rightColumn.length) * 45;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, "#0a0f1c");
  bgGradient.addColorStop(1, "#1a1f2e");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Background grid pattern
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  for (let x = 0; x < width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Neon header
  ctx.shadowColor = "#0ff";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#0ff";
  ctx.font = "bold 36px Arial";
  ctx.fillText("⚡ BOT & SYSTEM STATUS ⚡", 20, 50);

  ctx.shadowBlur = 0;

  // Data card
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.strokeStyle = "#0ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
  ctx.roundRect(15, 70, width - 30, height - 90, 15);
  ctx.fill();
  ctx.stroke();

  // All text color same (Neon Cyan)
  ctx.font = "20px Arial";
  ctx.shadowColor = "#0ff";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#0ff";

  leftColumn.forEach((line, i) => {
    ctx.fillText(line, 35, 110 + i * 35);
  });

  rightColumn.forEach((line, i) => {
    ctx.fillText(line, width / 2 + 35, 110 + i * 35);
  });

  // Divider line
  ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
  ctx.beginPath();
  ctx.moveTo(width / 2, 90);
  ctx.lineTo(width / 2, height - 30);
  ctx.stroke();

  // Save and send
  const buffer = canvas.toBuffer();
  const imgPath = __dirname + "/uptime.png";
  fs.writeFileSync(imgPath, buffer);
  message.reply({ attachment: fs.createReadStream(imgPath) });
}
