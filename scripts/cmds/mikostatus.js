const os = require("os");
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");
const moment = require("moment-timezone");

// সময় ফরম্যাট ফাংশন
const toTime = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
};

module.exports = {
  config: {
    name: "mikostatus", // আপনার চাহিদা অনুযায়ী নাম পরিবর্তন করা হয়েছে
    aliases: ["status", "scp", "spanel", "mstatus"],
    version: "6.0",
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴",
    countDown: 10,
    role: 0,
    description: "Premium Rotating RGB Status with Motion Trails",
    category: "system",
    guide: "{pn}"
  },

  onStart: async function(ctx) {
    return await this.runDashboard(ctx);
  },

  run: async function(ctx) {
    return await this.runDashboard(ctx);
  },

  runDashboard: async function(ctx) {
    const { message } = ctx;
    const width = 1000, height = 800;
    
    const encoder = new GIFEncoder(width, height);
    const canvas = createCanvas(width, height);
    const ctxC = canvas.getContext("2d");
    const filePath = path.join(__dirname, `miko_status_${Date.now()}.gif`);
    const stream = fs.createWriteStream(filePath);

    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(0); 
    encoder.setDelay(60); 
    encoder.setQuality(10);

    const totalFrames = 40; 
    const centerX = width / 2;
    const centerY = height / 2 + 40;
    const ringRadius = 280;
    const itemRadius = 75;

    // সিস্টেম ডাটা সংগ্রহ
    const data = [
      { label: "Uptime", val: toTime(process.uptime()) },
      { label: "Cores", val: os.cpus().length },
      { label: "Arch", val: os.arch() },
      { label: "Load", val: (os.loadavg()[0] * 10).toFixed(1) + "%" },
      { label: "Node", val: process.version.replace('v','') },
      { label: "RAM", val: (os.totalmem() / (1024 ** 3)).toFixed(1) + "GB" },
      { label: "Free", val: (os.freemem() / (1024 ** 3)).toFixed(1) + "GB" },
      { label: "OS", val: os.platform().toUpperCase() },
      { label: "Host", val: "RENDER" },
      { label: "Status", val: "ACTIVE" }
    ];

    for (let f = 0; f < totalFrames; f++) {
      const globalRotation = (f / totalFrames) * Math.PI * 2; 
      const baseHue = (f * 9) % 360;

      // ১. ডার্ক ব্যাকগ্রাউন্ড
      ctxC.fillStyle = "#020308";
      ctxC.fillRect(0, 0, width, height);

      // ২. টাইম এবং টাইটেল
      const bdTime = moment.tz("Asia/Dhaka").format("M/D/YYYY, h:mm:ss A");
      ctxC.fillStyle = "#ffffff";
      ctxC.font = "bold 24px Arial";
      ctxC.textAlign = "left";
      ctxC.fillText("❑ MIKO SYSTEM STATUS!", 50, 60);
      ctxC.textAlign = "right";
      ctxC.fillText(bdTime, width - 50, 60);

      // ৩. সেন্ট্রাল বড় সার্কেল (Luciferian Style)
      const centerColor = `hsla(${baseHue}, 100%, 60%, 1)`;
      ctxC.save();
      ctxC.shadowBlur = 45;
      ctxC.shadowColor = centerColor;
      ctxC.strokeStyle = centerColor;
      ctxC.lineWidth = 6;
      ctxC.beginPath();
      ctxC.arc(centerX, centerY, 115, 0, Math.PI * 2);
      ctxC.stroke();
      ctxC.fillStyle = "rgba(10, 12, 22, 0.95)";
      ctxC.fill();
      ctxC.restore();

      ctxC.textAlign = "center";
      ctxC.font = "bold 40px serif";
      ctxC.fillStyle = centerColor;
      ctxC.fillText("MIKO STATUS", centerX, centerY + 15);

      // ৪. রোটেটিং সার্কেল এবং ট্রেইল (বাতাস ইফেক্ট)
      data.forEach((item, i) => {
        const angle = globalRotation + (i * (Math.PI * 2 / data.length));
        const itemHue = (baseHue + (i * 36)) % 360;
        const color = `hsla(${itemHue}, 100%, 60%, 1)`;

        // মোশন ট্রেইল (বাতাসের ঝাপটার মতো পেছনের ইফেক্ট)
        for (let j = 7; j > 0; j--) {
          const trailAngle = angle - (j * 0.08); 
          const tx = centerX + ringRadius * Math.cos(trailAngle);
          const ty = centerY + ringRadius * Math.sin(trailAngle);
          const alpha = 1 - (j / 7);
          
          ctxC.beginPath();
          ctxC.arc(tx, ty, itemRadius - (j * 2.5), 0, Math.PI * 2);
          ctxC.strokeStyle = `hsla(${itemHue}, 100%, 60%, ${alpha * 0.3})`;
          ctxC.lineWidth = 2;
          ctxC.stroke();
        }

        // মেইন সার্কেল ড্রয়িং
        const x = centerX + ringRadius * Math.cos(angle);
        const y = centerY + ringRadius * Math.sin(angle);

        ctxC.save();
        ctxC.shadowBlur = 30;
        ctxC.shadowColor = color;
        ctxC.strokeStyle = color;
        ctxC.lineWidth = 4;
        ctxC.beginPath();
        ctxC.arc(x, y, itemRadius, 0, Math.PI * 2);
        ctxC.stroke();
        ctxC.fillStyle = "rgba(15, 18, 30, 0.9)";
        ctxC.fill();
        ctxC.restore();

        // সার্কেলের ভেতর ডাটা টেক্সট
        ctxC.textAlign = "center";
        ctxC.fillStyle = "#ffffff";
        ctxC.font = "bold 19px Arial";
        ctxC.fillText(item.val, x, y - 5);
        ctxC.font = "14px Arial";
        ctxC.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctxC.fillText(item.label.toUpperCase(), x, y + 22);
      });

      encoder.addFrame(ctxC);
    }

    encoder.finish();

    stream.on("finish", async () => {
      try {
        await message.reply({
          body: "🎀 𝙼𝙸𝙺𝙾 𝚂𝚃𝙰𝚃𝚄𝚂 𝙻𝙾𝙰𝙳𝙴𝙳 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈 🎀",
          attachment: fs.createReadStream(filePath)
        });
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Error sending Miko Status:", e);
      }
    });
  }
};