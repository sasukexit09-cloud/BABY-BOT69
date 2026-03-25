const { createCanvas, registerFont } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const GIFEncoder = require('gifencoder');

const fontDir = path.join(__dirname, 'assets', 'font');
const cacheDir = path.resolve(__dirname, 'cache');

registerFont(path.join(fontDir, 'BeVietnamPro-Bold.ttf'), { family: 'BeVietnamPro', weight: 'bold' });
registerFont(path.join(fontDir, 'BeVietnamPro-SemiBold.ttf'), { family: 'BeVietnamPro', weight: '600' });
registerFont(path.join(fontDir, 'BeVietnamPro-Regular.ttf'), { family: 'BeVietnamPro', weight: 'normal' });

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

// Real-time CPU & RAM usage
function getCpuUsage() {
    const cpus = os.cpus();
    let idleMs = 0, totalMs = 0;
    cpus.forEach(core => {
        for (let type in core.times) totalMs += core.times[type];
        idleMs += core.times.idle;
    });
    return 100 - Math.floor((idleMs / totalMs) * 100);
}

function getRamUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return { usedMem, usage: Math.floor((usedMem / totalMem) * 100) };
}

// Neon Circle
function drawNeonCircle(ctx, x, y, radius, colors, hue) {
    ctx.save();
    const glowColor = `hsl(${hue},100%,50%)`;
    for (let i = 30; i > 0; i--) {
        const alpha = (1 - i / 30) * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, radius + i, 0, Math.PI * 2);
        ctx.fillStyle = glowColor.replace('hsl', 'hsla').replace(')', `,${alpha})`);
        ctx.fill();
    }

    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.7, colors[1]);
    gradient.addColorStop(1, colors[2] || colors[1]);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// Draw Icon
function drawIcon(ctx, x, y, size, type) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    const scale = size / 24;
    ctx.translate(x - 12 * scale, y - 12 * scale);
    ctx.scale(scale, scale);

    switch(type) {
        case 'cpu':
            ctx.strokeRect(6,6,12,12);
            ctx.fillRect(9,9,6,6);
            break;
        case 'ram':
            ctx.strokeRect(2,7,20,10);
            ctx.fillRect(5,10,3,4);
            ctx.fillRect(10,10,3,4);
            ctx.fillRect(16,10,3,4);
            break;
    }
    ctx.restore();
}

// Generate Animated GIF
async function generateCpanelGif(botName="GOAT BOT") {
    const width = 800;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!fs.existsSync(cacheDir)) fs.mkdirpSync(cacheDir);

    const encoder = new GIFEncoder(width,height);
    const gifPath = path.join(cacheDir, `cpanel_${Date.now()}.gif`);
    encoder.createReadStream().pipe(fs.createWriteStream(gifPath));
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(100);
    encoder.setQuality(10);

    const cpuUsage = getCpuUsage();
    const { usedMem, usage: ramUsage } = getRamUsage();

    const infoCircles = [
        { title: 'CPU', icon: 'cpu', value: `${cpuUsage}%`, colors: ['#818cf8','#6366f1','#4f46e5'] },
        { title: 'RAM', icon: 'ram', value: `${ramUsage}%`, colors: ['#fbbf24','#f59e0b','#d97706'] },
    ];

    for (let frame=0; frame<60; frame++) {
        // Background
        const bgGrad = ctx.createRadialGradient(width/2,height/2,0,width/2,height/2,height);
        bgGrad.addColorStop(0,'#1a1a3e');
        bgGrad.addColorStop(1,'#050810');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0,0,width,height);

        const hue = (frame*6)%360;
        const centerX = width/2;
        const centerY = height/2;
        const outerRadius = 200;
        const circleRadius = 80;

        infoCircles.forEach((c,i)=>{
            const angle = (Math.PI*2/infoCircles.length)*i - Math.PI/2;
            const x = centerX + Math.cos(angle)*outerRadius;
            const y = centerY + Math.sin(angle)*outerRadius;

            drawNeonCircle(ctx,x,y,circleRadius,c.colors,hue);
            drawIcon(ctx,x,y,28,c.icon);

            ctx.fillStyle='#fff';
            ctx.font='bold 20px BeVietnamPro';
            ctx.textAlign='center';
            ctx.fillText(c.title,x,y-10);
            ctx.font='bold 28px BeVietnamPro';
            ctx.fillText(c.value,x,y+25);
        });

        // Center Bot Name
        ctx.fillStyle='#fff';
        ctx.font='bold 36px BeVietnamPro';
        ctx.textAlign='center';
        ctx.fillText(botName,centerX,centerY);

        encoder.addFrame(ctx);
    }

    encoder.finish();
    return gifPath;
}

module.exports = {
    config: {
        name: "cpanel",
        aliases: ["hosting","server","hostinfo","panel"],
        version: "3.1.0",
        author: "Neoaz ゐ",
        countDown: 10,
        role: 0,
        description: "Animated Hosting Dashboard with Neon RGB",
        category: "utility",
        guide: "{pn}"
    },

    onStart: async function({ message, event }) {
        try {
            message.reaction("⏳", event.messageID);

            const botName = global.GoatBot?.config?.nickNameBot || "GOAT BOT";
            const gifPath = await generateCpanelGif(botName);

            await message.reply({
                body: "📊 𝗔𝗡𝗜𝗠𝗔𝗧𝗘𝗗 𝗛𝗢𝗦𝗧𝗜𝗡𝗚 𝗣𝗔𝗡𝗘𝗟",
                attachment: fs.createReadStream(gifPath)
            });

            message.reaction("✅", event.messageID);

            setTimeout(() => { if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath); }, 10000);

        } catch (error) {
            console.error("CPanel Command Error:",error);
            message.reaction("❌", event.messageID);
            return message.reply("❌ An error occurred while generating the hosting panel.");
        }
    }
};