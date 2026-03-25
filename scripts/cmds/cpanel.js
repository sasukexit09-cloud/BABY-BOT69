const os = require("os");
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");

// সময় ফরম্যাট ফাংশন
const toTime = (sec) => {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};

module.exports = {
  config: {
    name: "cpanel",
    aliases: ["panel", "mikopanel"],
    version: "50.0",
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴",
    description: "𝚈𝙴𝙰 𝙼𝙸𝙺𝙾 𝙲𝙾𝙽𝚃𝚁𝙾𝙻 𝙿𝙰𝙽𝙴𝙻 𝚂𝚃𝙰𝚃𝚄𝚂"
  },

  onStart: async function(ctx) {
    await module.exports.runDashboard(ctx);
  },

  onChat: async function(ctx) {
    const input = ctx.event.body?.toLowerCase()?.trim();
    if (!["cpanel", "panel", "cp"].includes(input)) return;
    await module.exports.runDashboard(ctx);
  },

  runDashboard: async function(ctx) {
    const { message, api } = ctx;
    const loadingMsg = await message.reply("🍨𝚆𝙰𝙸𝚃 𝙼𝙸𝙺𝙾 𝙲𝙿𝙰𝙽𝙴𝙻 𝙻𝙾𝙰𝙳𝙸𝙽𝙶...!!");

    const width = 1000, height = 800;
    const encoder = new GIFEncoder(width, height);
    const canvas = createCanvas(width, height);
    const ctxC = canvas.getContext("2d");
    const filePath = path.join(__dirname, "zentsu_rgb_ultra.gif");
    const stream = fs.createWriteStream(filePath);

    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(70);
    encoder.setQuality(10);

    const totalFrames = 60;

    // ১. RGB Snowfall Setup
    const snowParticles = Array.from({ length: 150 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: Math.random() * 1.5 + 0.5,
      size: Math.random() * 2 + 1,
      hue: Math.random() * 360
    }));

    for (let f = 0; f < totalFrames; f++) {
      // Dynamic RGB Color based on frame
      const mainHue = (f * 6) % 360;
      const rgbColor = `hsla(${mainHue}, 100%, 70%, 1)`;
      const rgbGlow = `hsla(${mainHue}, 100%, 70%, 0.8)`;
      const secondaryColor = `hsla(${(mainHue + 60) % 360}, 100%, 70%, 1)`;

      // Background
      ctxC.fillStyle = "#030008";
      ctxC.fillRect(0, 0, width, height);

      // ২. Snowfall Animation (Changing Colors)
      snowParticles.forEach(p => {
        p.y += p.speed;
        p.hue = (p.hue + 3) % 360;
        if (p.y > height) p.y = -5;
        ctxC.fillStyle = `hsla(${p.hue}, 100%, 75%, 0.6)`;
        ctxC.beginPath();
        ctxC.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctxC.fill();
      });

      // ৩. Highlighted Border (Outer Glow)
      ctxC.strokeStyle = rgbColor;
      ctxC.lineWidth = 4;
      ctxC.shadowBlur = 20;
      ctxC.shadowColor = rgbColor;
      ctxC.strokeRect(30, 30, width - 60, height - 60);
      ctxC.shadowBlur = 0;

      // ৪. System Data
      const totalRAM = (os.totalmem() / (1024 ** 3)).toFixed(1);
      const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(1);
      const ramPercent = ((usedRAM / totalRAM) * 100).toFixed(1);
      const cpuLoad = (os.loadavg()[0] * 10).toFixed(1);
      const cache = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
      const temp = (40 + Math.random() * 5).toFixed(1);
      
      const bdTime = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
      });

      // ৫. Header with RGB Shadow
      ctxC.textAlign = "center";
      ctxC.font = "bold 50px Arial";
      ctxC.fillStyle = "#fff";
      ctxC.shadowBlur = 25; ctxC.shadowColor = rgbColor;
      ctxC.fillText("ZENTSU ULTRA RGB PANEL", width / 2, 100);
      
      ctxC.font = "bold 26px Arial";
      ctxC.fillStyle = secondaryColor;
      ctxC.fillText(`𝙲𝙾𝚄𝙽𝚃𝚁𝚈 𝚃𝙸𝙼𝙴: ${bdTime} • 𝚂𝙴𝚁𝚅𝙴𝚁 𝙰𝙲𝚃𝙸𝚅𝙴`, width / 2, 145);
      ctxC.shadowBlur = 0;

      // ৬. Segmented Progress Rings (Rainbow Style)
      const drawRing = (x, y, radius, percent, color, label, val) => {
        // Outer Track
        ctxC.lineWidth = 15;
        ctxC.setLineDash([5, 10]);
        ctxC.strokeStyle = "rgba(255,255,255,0.05)";
        ctxC.beginPath(); ctxC.arc(x, y, radius, 0, Math.PI * 2); ctxC.stroke();

        // Highlighted Progress
        ctxC.setLineDash([]);
        ctxC.strokeStyle = color;
        ctxC.shadowBlur = 20; ctxC.shadowColor = color;
        ctxC.lineCap = "round";
        ctxC.beginPath();
        ctxC.arc(x, y, radius, -Math.PI / 2, (-Math.PI / 2) + (percent / 100) * Math.PI * 2);
        ctxC.stroke();
        
        ctxC.shadowBlur = 0;
        ctxC.fillStyle = "#fff";
        ctxC.font = "bold 28px Arial"; ctxC.fillText(val, x, y + 10);
        ctxC.font = "bold 17px Arial"; ctxC.fillText(label, x, y + radius + 40);
      };

      drawRing(220, 340, 85, cpuLoad, rgbColor, "CPU LOAD", `${cpuLoad}%`);
      drawRing(500, 340, 85, ramPercent, secondaryColor, "RAM USAGE", `${ramPercent}%`);
      drawRing(780, 340, 85, 75, rgbColor, "STORAGE", "75%");

      // ৭. Detailed Grid Info
      ctxC.textAlign = "left";
      ctxC.font = "bold 22px Arial";
      
      const drawInfo = (x, y, text, val, c) => {
        ctxC.fillStyle = c; ctxC.shadowBlur = 10; ctxC.shadowColor = c;
        ctxC.fillText(`► ${text}:`, x, y);
        ctxC.shadowBlur = 0;
        ctxC.fillStyle = "#fff"; ctxC.fillText(val, x + 190, y);
      };

      let gy = 530;
      drawInfo(100, gy, "𝚃𝙾𝚃𝙰𝙻 𝚁𝙾𝙼", "128 GB", rgbColor);
      drawInfo(100, gy + 45, "𝙲𝙰𝙲𝙷𝙴 𝙼𝙴𝙼", `${cache} MB`, secondaryColor);
      drawInfo(100, gy + 90, "𝙲𝙿𝚄 𝚃𝙴𝙼", `${temp}°C`, rgbColor);
      drawInfo(100, gy + 135, "𝙱𝙾𝚃 𝚄𝚂𝙴𝚁𝚂", "697+", secondaryColor);

      drawInfo(550, gy, "𝙷𝙾𝚂𝚃𝙽𝙰𝙼𝙴", os.hostname().toUpperCase(), secondaryColor);
      drawInfo(550, gy + 45, "PLATFORM", os.platform().toUpperCase(), rgbColor);
      drawInfo(550, gy + 90, "𝚄𝙿𝚃𝙸𝙼𝙴", toTime(os.uptime()), secondaryColor);
      drawInfo(550, gy + 135, "𝚂𝚃𝙰𝚃𝚄𝚂", "𝚂𝚃𝙰𝙱𝙻𝙴", rgbColor);

      // ৮. Glowing RGB Footer
      ctxC.shadowBlur = 15; ctxC.shadowColor = rgbColor;
      ctxC.strokeStyle = rgbColor; ctxC.lineWidth = 3;
      ctxC.strokeRect(80, 710, 840, 50);
      ctxC.shadowBlur = 0;
      ctxC.textAlign = "center";
      ctxC.fillStyle = "#fff";
      ctxC.font = "bold 20px Arial";
      ctxC.fillText("𝚂𝚈𝚂𝚃𝙴𝙼 𝙾𝙿𝚃𝙸𝙼𝙸𝚉𝙴𝙳 - 𝙰𝙻𝙻 𝙲𝙾𝚁𝙴 𝚁𝚄𝙽𝙽𝙸𝙽𝙶", width/2, 742);

      encoder.addFrame(ctxC);
    }

    encoder.finish();

    stream.on("finish", async () => {
      if (loadingMsg && loadingMsg.messageID) {
        api.unsendMessage(loadingMsg.messageID);
      }
      const bdTimeNow = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka' });
      await message.reply({
        body: `🍓 𝙼𝙸𝙺𝙾 𝙲𝙾𝙽𝚃𝚁𝙾𝙻 𝙿𝙰𝙽𝙴𝙻 𝚂𝚃𝙰𝚃𝚄𝚂 🍓 \n━━━━━━━━━━━━━━━━━━━━\n🍒𝚂𝙴𝚁𝚅𝙴𝚁 𝚂𝚃𝙰𝚃𝚄𝚂: 𝙾𝙽𝙻𝙸𝙽𝙴 🟢\n🕰️𝚃𝙸𝙼𝙴: ${bdTimeNow}`,
        attachment: fs.createReadStream(filePath)
      });
    });
  }
};