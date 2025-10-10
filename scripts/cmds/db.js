const os = require("os");
const pidusage = require("pidusage");
const fs = require("fs");
const { createCanvas } = require('canvas');
const path = require('path');

module.exports = {
  config: {
    name: "dashboard",
    aliases: ["db"],
    version: "2.3",
    author: "Tarek Shikdar", 
    countDown: 1,
    role: 0,
    shortDescription: "Show system status as a dashboard image",
    longDescription: "Displays uptime, CPU, memory, disk, and bot stats in a custom dashboard style.",
    category: "info",
    guide: "{pn}",
    noPrefix: false
  },

  onStart: async function (ctx) {
    await module.exports.sendUptime(ctx);
  },

  onChat: async function (ctx) {
    const input = ctx.event.body?.toLowerCase().trim();
    const { config } = module.exports;
    const triggers = [config.name, ...(config.aliases || [])];

    if (!triggers.includes(input)) return;

    await module.exports.sendUptime(ctx);
  },

  sendUptime: async function ({ message, usersData, threadsData }) {
    // --- ১. ডেটা সংগ্রহ ও ফরম্যাটিং ---
    const now = new Date();
    const formattedDate = now.toLocaleString("en-US", { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false });
    const hostID = os.hostname().substring(0, 10); // Hostname ছোট করা হলো

    const uptimeBot = process.uptime();
    const uptimeSys = os.uptime();
    const toTime = (sec) => {
      const d = Math.floor(sec / 86400);
      const h = Math.floor((sec % 86400) / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${d}d ${h}h ${m}m`; // Simplified format
    };

    const usage = await pidusage(process.pid);
    const totalRamGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const usedRamMB = (usage.memory / 1024 / 1024).toFixed(2);
    const ramPercent = ((usage.memory / os.totalmem()) * 100).toFixed(2);
    const cpuUsage = usage.cpu.toFixed(2);
    const cpuModel = os.cpus()[0].model;
    const cpuCores = os.cpus().length;
    const platform = `${os.platform()} (${os.arch()})`;
    
    const users = await usersData.getAll();
    const threads = await threadsData.getAll();
    const processID = process.pid;

    // স্থির মান (ইমেজ থেকে নেওয়া)
    const diskUsage = "35.00%";
    const diskTotal = "387 GB"; // এখানে আপনার সঠিক ডিস্ক টোটাল যোগ করতে পারেন
    
    // --- pkgCount ইনিশিয়ালাইজেশন এবং handling ---
    let pkgCount = 'N/A'; 
    const pkgPath = path.join(process.cwd(), 'package.json');
    try {
        pkgCount = Object.keys(JSON.parse(fs.readFileSync(pkgPath)).dependencies || {}).length;
    } catch (e) {
        // console.error("Error reading package.json:", e.message); // ডিবাগিং এর জন্য
    }

    const authorName = module.exports.config.author; 
    
    // --- ২. ক্যানভাস দিয়ে ইমেজ তৈরি করা ---
    const width = 1000;
    const height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // ড্যাশবোর্ড কালার প্যালেট
    const BG_COLOR = '#1e1e2e';
    const CARD_COLOR = '#282a36';
    const TEXT_COLOR = '#f8f8f2';
    const HIGHLIGHT_COLOR = '#50fa7b'; // Green
    const BOT_COLOR = '#8be9fd'; // Cyan

    // ব্যাকগ্রাউন্ড
    ctx.fillStyle = BG_COLOR; 
    ctx.fillRect(0, 0, width, height);
    
    // --- ক্যানভাসে আঁকার ফাংশন ---

    // কার্ড আঁকা (Rounded corners যোগ করা হলো)
    const drawRoundedCard = (x, y, w, h, radius) => {
        ctx.fillStyle = CARD_COLOR;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    };

    // টেক্সট ও আইকন আঁকা (কাস্টম টেক্সট ফাংশন)
    const drawText = (text, x, y, color, size, weight='normal', align='left') => {
        ctx.fillStyle = color;
        ctx.font = `${weight} ${size}px sans-serif`;
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
    };

    // প্রোগ্রেস বার আঁকা
    const drawProgressBar = (x, y, w, h, percent, color) => {
        const barWidth = (percent / 100) * w;
        // ব্যাকগ্রাউন্ড ট্র‍্যাক
        ctx.fillStyle = '#44475a';
        ctx.fillRect(x, y, w, h);
        // প্রোগ্রেস
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, h);
    };


    // --- ৩. হেডার সেকশন ---
    drawText('TAREK HOST', 40, 50, BOT_COLOR, 32, 'bold'); // "TAREK HOST"
    drawText(`${formattedDate}`, width - 150, 25, '#6272a4', 16, 'normal', 'right');
    drawText(`${hostID} • Linux`, width - 40, 50, '#6272a4', 18, 'normal', 'right');

    // --- ৪. টপ কার্ড সেকশন (৪টি ছোট কার্ড) ---
    const cardWidth = 220;
    const cardHeight = 130;
    const startX = 40;
    const cardSpacing = 30;
    const cardRadius = 10; // কার্ডের কর্নার রেডিয়াস

    // A. Bot Uptime Card
    drawRoundedCard(startX, 80, cardWidth, cardHeight, cardRadius);
    drawText('Bot Uptime', startX + 10, 105, '#6272a4', 18);
    drawText(`${uptimeBot > 86400 ? toTime(uptimeBot) : '0d ' + toTime(uptimeBot)}`, startX + 15, 160, TEXT_COLOR, 32, 'bold');
    drawText(`${ramPercent}%`, startX + cardWidth - 10, 105, BOT_COLOR, 18, 'normal', 'right'); // Percent on top right
    drawProgressBar(startX + 10, 180, cardWidth - 20, 5, parseFloat(ramPercent), BOT_COLOR);
    
    // B. System Uptime Card
    const sysX = startX + cardWidth + cardSpacing;
    drawRoundedCard(sysX, 80, cardWidth, cardHeight, cardRadius);
    drawText('System Uptime', sysX + 10, 105, '#6272a4', 18);
    drawText(`${toTime(uptimeSys)}`, sysX + 15, 160, BOT_COLOR, 32, 'bold');
    drawText('100.00%', sysX + cardWidth - 10, 105, BOT_COLOR, 18, 'normal', 'right');
    drawProgressBar(sysX + 10, 180, cardWidth - 20, 5, 100, BOT_COLOR);


    // C. CPU Usage Card
    const cpuX = sysX + cardWidth + cardSpacing;
    drawRoundedCard(cpuX, 80, cardWidth, cardHeight, cardRadius);
    drawText('CPU Usage', cpuX + 10, 105, '#6272a4', 18);
    drawText(`${cpuUsage}%`, cpuX + 15, 160, HIGHLIGHT_COLOR, 32, 'bold');
    drawText(`${cpuUsage}%`, cpuX + cardWidth - 10, 105, HIGHLIGHT_COLOR, 18, 'normal', 'right');
    drawProgressBar(cpuX + 10, 180, cardWidth - 20, 5, parseFloat(cpuUsage), HIGHLIGHT_COLOR);


    // D. Memory Usage Card
    const memX = cpuX + cardWidth + cardSpacing;
    drawRoundedCard(memX, 80, cardWidth, cardHeight, cardRadius);
    drawText('Memory Usage', memX + 10, 105, '#6272a4', 18);
    drawText(`${ramPercent}%`, memX + 15, 160, '#ff79c6', 32, 'bold'); // Pink
    drawText(`${ramPercent}%`, memX + cardWidth - 10, 105, '#ff79c6', 18, 'normal', 'right');
    drawProgressBar(memX + 10, 180, cardWidth - 20, 5, parseFloat(ramPercent), '#ff79c6');


    // --- ৫. নিচের সেকশন (সিস্টেম ইনফো এবং প্রসেস স্ট্যাটাস) ---
    const bottomY = 240;

    // A. System Information Card (Left)
    drawRoundedCard(startX, bottomY, 490, 430, cardRadius);
    drawText('System Information', startX + 10, bottomY + 35, BOT_COLOR, 22, 'bold');

    let infoY = bottomY + 70;
    const drawInfoLine = (icon, label, value) => {
        drawText(icon, startX + 20, infoY + 25, '#ff79c6', 22); // Icon color pink
        drawText(label, startX + 50, infoY + 25, '#6272a4', 18);
        drawText(value, startX + 180, infoY + 25, TEXT_COLOR, 18);
        infoY += 40;
    };
    
    drawInfoLine('🌎', 'Platform:', platform);
    drawInfoLine('💻', 'CPU Model:', cpuModel);
    drawInfoLine('⚙️', 'CPU Cores:', `${cpuCores} cores`);
    drawInfoLine('💾', 'Total Ram:', `${totalRamGB} GB`);
    drawInfoLine('🏠', 'Hostname:', hostID);
    
    // Bot Information Section - Layout Adjusted
    drawText('Bot Information', startX + 10, infoY + 20, HIGHLIGHT_COLOR, 22, 'bold'); // Space adjusted
    infoY += 55; // Adjusted starting Y for bot info lines
    drawInfoLine('📦', 'Total Packages:', pkgCount.toLocaleString());
    drawInfoLine('👥', 'Total Users:', users.length.toLocaleString());
    drawInfoLine('💬', 'Total Groups:', threads.length.toLocaleString());


    // B. Process Statistics Card (Right)
    drawRoundedCard(560, bottomY, 400, 430, cardRadius);
    drawText('Process Statistics', 560 + 10, bottomY + 35, BOT_COLOR, 22, 'bold');

    drawText('Process Memory Usage', 560 + 10, bottomY + 80, '#6272a4', 18);
    drawText(`${usedRamMB} MB`, 560 + 20, bottomY + 140, '#ff79c6', 42, 'bold');
    drawText(`${ramPercent}% of total RAM`, 560 + 20, bottomY + 165, TEXT_COLOR, 16);
    
    drawText('Process Uptime', 560 + 10, bottomY + 240, '#6272a4', 18);
    drawText(`${toTime(uptimeBot)}`, 560 + 20, bottomY + 280, HIGHLIGHT_COLOR, 28, 'bold');
    
    drawText('ID: Process ID:', 560 + 10, bottomY + 340, '#6272a4', 18);
    drawText(processID, 560 + 180, bottomY + 340, TEXT_COLOR, 18);
    
    drawText('💻 Platform:', 560 + 10, bottomY + 380, '#6272a4', 18);
    drawText(os.platform(), 560 + 180, bottomY + 380, TEXT_COLOR, 18);


    // --- ৬. ফুটার ---
    drawText(`System Dashboard v1.0 • Generated ${formattedDate} at ${formattedTime}`, width / 2, height - 15, '#6272a4', 16, 'normal', 'center');


    // --- ৭. ইমেজ বাফার তৈরি ও পাঠানো ---
    const buffer = canvas.toBuffer('image/png');
    const imagePath = path.join(__dirname, `dashboard_${Date.now()}.png`);
    fs.writeFileSync(imagePath, buffer);

    try {
        await message.reply({
            body: `✨ Tarek, here is your ${hostID} Dashboard! 😊`,
            attachment: fs.createReadStream(imagePath)
        });
    } catch (e) {
        console.error("Failed to send image, falling back to text.", e);
        // Fallback to a simple text message
        await message.reply("Dashboard image failed to send. Check console for errors. 😿");
    }
    
    fs.unlinkSync(imagePath);
  }
};
