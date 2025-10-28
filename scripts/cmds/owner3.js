const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const GIFEncoder = require("gifencoder");

module.exports = {
  config: {
    name: "owner3",
    version: "14.0",
    author: "Asif x Maya",
    shortDescription: "Owner card GIF with Ayan signature",
    category: "ℹ️ Info",
    guide: { en: ".owner" },
    usePrefix: true
  },

  onStart: async function ({ api, event }) {
    const owner = {
      name: "𝗔𝘆𝗮𝗻 𝗔𝗵𝗺𝗲𝗗'𝘇",
      whatsapp: "0191***7459",
      botName: "◦•●♡ʏᴏᴜʀ ʙʙʏ♡●•◦",
      nickName: "𝗔𝗬𝗔𝗡",
      class: "𝗜𝗻𝘁𝗲𝗿 2𝗻𝗱 𝗬𝗲𝗮𝗿",
      religion: "𝗜𝘀𝗹𝗮𝗺",
      relationship: "𝗦𝗶𝗻𝗴𝗹𝗲",
      address: "𝗚𝗮𝘇𝗶𝗽𝘂𝗿"
    };

    const width = 800, height = 500, frames = 50;
    const encoder = new GIFEncoder(width, height);
    const outPath = path.join(__dirname, "cache", "owner_card.gif");
    await fs.ensureDir(path.dirname(outPath));
    const stream = fs.createWriteStream(outPath);
    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(60);
    encoder.setQuality(10);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Load owner photo (fixed URL)
    const ownerImg = await loadImage("https://files.catbox.moe/mhcn45.jpg");

    // Stars and particles
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5,
      speed: 0.5 + Math.random()
    }));
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.5 + Math.random() * 1,
      alpha: 0.2 + Math.random() * 0.3,
      speedX: -0.3 + Math.random() * 0.6,
      speedY: -0.2 + Math.random() * 0.4
    }));

    for (let f = 0; f < frames; f++) {
      // Background
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#0c0c1a");
      bg.addColorStop(0.5, "#1b1b40");
      bg.addColorStop(1, "#3f0d63");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Stars
      stars.forEach(star => {
        star.x += star.speed;
        if (star.x > width) star.x = 0;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fill();
      });

      // Particles
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
      });

      // Header
      ctx.font = "bold 42px Sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = `hsl(${(f*8)%360},100%,70%)`;
      ctx.shadowBlur = 20;
      ctx.fillStyle = `hsl(${(f*8)%360},100%,70%)`;
      ctx.fillText("⭐ BOT OWNER INFO ⭐", width/2, 80);
      ctx.shadowBlur = 0;

      // Info Text
      ctx.textAlign = "left";
      const lines = [
        { label: "👤 Owner:", value: owner.name },
        { label: "📱 WhatsApp:", value: owner.whatsapp },
        { label: "🤖 Bot Name:", value: owner.botName },
        { label: "📝 Nickname:", value: owner.nickName },
        { label: "🏫 Class:", value: owner.class },
        { label: "🕋 Religion:", value: owner.religion },
        { label: "❤️ Relation:", value: owner.relationship },
        { label: "🏠 Address:", value: owner.address }
      ];
      const startX = 100, startY = 180, lineHeight = 40, labelW = 180;
      lines.forEach((item, i) => {
        const y = startY + i * lineHeight;
        ctx.font = "bold 22px Sans-serif";
        ctx.fillStyle = "#ffeb66";
        ctx.fillText(item.label, startX, y);
        ctx.font = "italic 23px Sans-serif";
        ctx.fillStyle = `hsl(${(f*15 + i*40)%360},100%,70%)`;
        ctx.fillText(item.value, startX + labelW, y);
      });

      // Owner Photo with signature below
      const photoW = 160, photoH = 160;
      const x = width - photoW - 60;
      const yPhoto = height - photoH - 90;
      const radius = 20;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + radius, yPhoto);
      ctx.lineTo(x + photoW - radius, yPhoto);
      ctx.quadraticCurveTo(x + photoW, yPhoto, x + photoW, yPhoto + radius);
      ctx.lineTo(x + photoW, yPhoto + photoH - radius);
      ctx.quadraticCurveTo(x + photoW, yPhoto + photoH, x + photoW - radius, yPhoto + photoH);
      ctx.lineTo(x + radius, yPhoto + photoH);
      ctx.quadraticCurveTo(x, yPhoto + photoH, x, yPhoto + photoH - radius);
      ctx.lineTo(x, yPhoto + radius);
      ctx.quadraticCurveTo(x, yPhoto, x + radius, yPhoto);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(ownerImg, x, yPhoto, photoW, photoH);
      ctx.restore();

      // Signature text under image
      ctx.font = "italic 26px Sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = `hsl(${(f*12)%360},100%,75%)`;
      ctx.fillText("~ Ayan 💫", x + photoW / 2, yPhoto + photoH + 35);

      // Border
      const borderWidth = 10;
      const grad = ctx.createLinearGradient(0,0,width,height);
      grad.addColorStop(0, `hsl(${(f*10)%360},100%,60%)`);
      grad.addColorStop(1, `hsl(${(f*10+180)%360},100%,60%)`);
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = grad;
      ctx.shadowBlur = 35;
      ctx.shadowColor = `hsl(${(f*10)%360},100%,70%)`;
      ctx.strokeRect(borderWidth/2,borderWidth/2,width-borderWidth,height-borderWidth);
      ctx.shadowBlur = 0;

      encoder.addFrame(ctx);
    }

    encoder.finish();

    stream.on("finish", async () => {
      api.sendMessage(
        {
          body: "✨ Animated Owner Card with Signature Ready!",
          attachment: fs.createReadStream(outPath)
        },
        event.threadID,
        () => fs.remove(outPath)
      );
    });
  }
};
