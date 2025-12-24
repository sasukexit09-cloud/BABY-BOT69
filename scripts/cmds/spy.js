const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "spy",
    version: "5.4",
    author: "TAREK x ASIF",
    countDown: 5,
    role: 0,
    shortDescription: "See detailed user info",
    longDescription:
      "Fetch full profile info with galaxy background, smooth glow, avatar hexagon, and stats.",
    category: "image",
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    const uid1 = event.senderID;
    const uid2 = Object.keys(event.mentions || {})[0];
    let uid;

    // Detect UID from args / reply / mention / sender
    if (args[0]) {
      if (/^\d+$/.test(args[0])) uid = args[0];
      else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) uid = match[1];
      }
    }
    if (!uid) {
      uid = event.type === "message_reply" ? event.messageReply.senderID : uid2 || uid1;
    }

    try {
      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo(uid, (err, result) => (err ? reject(err) : resolve(result)));
      });
      const avatarUrl = await usersData.getAvatarUrl(uid);
      const data = await usersData.get(uid);

      const name = userInfo[uid].name || "Unknown";
      const gender = userInfo[uid].gender === 1 ? "Female" : userInfo[uid].gender === 2 ? "Male" : "Unknown";
      const isFriend = userInfo[uid].isFriend ? "Yes" : "No";
      const isBirthday = userInfo[uid].isBirthday ? "Yes" : "Private";
      const balance = data.money || 0;
      const exp = data.exp || 0;

      let nickname = data.nickname || (await getThreadNickname(event, api, uid)) || "N/A";

      const allUsers = await usersData.getAll();
      const moneyRank = getRank(allUsers, uid, "money");
      const expRank = getRank(allUsers, uid, "exp");
      const infinityMoney = `$${shortenNumber(balance)}`;

      // --- Canvas ---
      const WIDTH = 550;
      const HEIGHT = 850;
      const canvas = createCanvas(WIDTH, HEIGHT);
      const ctx = canvas.getContext("2d");

      // Pre-rendered galaxy background with stars
      const bgPath = path.join(__dirname, "tmp", "galaxy_bg.png");
      if (!fs.existsSync(bgPath)) await createGalaxyBackground(WIDTH, HEIGHT, bgPath);
      const bg = await loadImage(bgPath);
      ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);

      // Neon border
      ctx.strokeStyle = "#ff00ff";
      ctx.lineWidth = 5;
      drawRoundRect(ctx, 4, 4, WIDTH - 8, HEIGHT - 8, 10, false, true);

      // Avatar
      const avatarSize = 90;
      const avatarCenterX = WIDTH / 2;
      const avatarCenterY = 130;
      const avatar = await safeLoadAvatar(avatarUrl);

      drawHexAvatar(ctx, avatar, avatarCenterX, avatarCenterY, avatarSize);

      // Name
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(name, avatarCenterX, 250);

      // Info boxes
      const BOX_HEIGHT = 45;
      const BOX_GAP = 5;
      const BOX_START_Y = 320;

      const infoList = [
        { label: "UID", icon: "🆔", value: uid },
        { label: "Username", icon: "🌐", value: name.replace(/\s+/g, "_").toLowerCase() },
        { label: "Gender", icon: "🚻", value: gender },
        { label: "Birthday", icon: "🎂", value: isBirthday },
        { label: "Nickname", icon: "💬", value: nickname },
        { label: "Bot Friend", icon: "🤖", value: isFriend },
        { label: "Money", icon: "💰", value: infinityMoney },
      ];

      infoList.forEach((info, i) =>
        drawInfoBox(ctx, 20, BOX_START_Y + i * (BOX_HEIGHT + BOX_GAP), WIDTH - 40, BOX_HEIGHT, info.icon, info.label, info.value)
      );

      drawInfoBox(ctx, 20, BOX_START_Y + infoList.length * (BOX_HEIGHT + BOX_GAP), WIDTH - 40, BOX_HEIGHT, "📈", "XP Rank", expRank);
      drawInfoBox(ctx, 20, BOX_START_Y + (infoList.length + 1) * (BOX_HEIGHT + BOX_GAP), WIDTH - 40, BOX_HEIGHT, "🏦", "Money Rank", moneyRank);

      // Save and send
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const outputPath = path.join(tmpDir, `profile_${uid}.png`);
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      out.on("finish", () => {
        message.reply({ body: "", attachment: fs.createReadStream(outputPath) }, () => {
          try { fs.unlinkSync(outputPath); } catch {}
        });
      });
    } catch (e) {
      console.error(e);
      message.reply("⚠️ ইউজার ডাটা ফেচ করতে সমস্যা হয়েছে!");
    }
  },
};

// --- Helper Functions ---

async function safeLoadAvatar(url) {
  try { return await loadImage(url); }
  catch {
    const c = createCanvas(512, 512);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#444";
    ctx.fillRect(0, 0, 512, 512);
    return c;
  }
}

async function getThreadNickname(event, api, uid) {
  if (!event.threadID) return null;
  const threadInfo = await api.getThreadInfo(event.threadID);
  return threadInfo?.nicknames?.[uid] || null;
}

function getRank(users, uid, key) {
  const sorted = users.filter(u => typeof u[key] === "number").sort((a,b) => b[key]-a[key]);
  const idx = sorted.findIndex(u => u.userID===uid);
  return idx !== -1 ? `#${idx+1}` : "Unranked";
}

const units = ["", "K", "M", "B", "T", "Q", "S", "O", "N", "D"];
function shortenNumber(num) {
  if (typeof num !== "number") return "0";
  if (num < 1000) return Math.floor(num).toString();
  let unitIndex = 0;
  let n = num;
  while (n >= 1000 && unitIndex < units.length - 1) { n/=1000; unitIndex++; }
  if (units[unitIndex]==="D") return Math.floor(num).toString().slice(0,4)+"..D";
  return n.toFixed(2).replace(/\.?0+$/,"")+units[unitIndex];
}

// Draw hex avatar
function drawHexAvatar(ctx, avatar, x, y, size) {
  const colors = ["#ff007f","#ff6600","#ffff00","#00ff00","#00ffff","#6600ff"];
  const points = [];
  for(let i=0;i<6;i++){
    const angle=(Math.PI/3)*i - Math.PI/6;
    points.push({x:x+size*Math.cos(angle),y:y+size*Math.sin(angle)});
  }
  ctx.lineWidth = 5;
  for(let i=0;i<6;i++){
    ctx.beginPath();
    const start = points[i], end=points[(i+1)%6];
    ctx.moveTo(start.x,start.y); ctx.lineTo(end.x,end.y);
    ctx.strokeStyle = colors[i]; ctx.stroke();
  }

  // Clip hex
  ctx.save();
  ctx.beginPath();
  points.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, x-size, y-size, size*2, size*2);
  ctx.restore();
}

// Rounded rect helper
function drawRoundRect(ctx,x,y,w,h,r,fill=false,stroke=false){
  if(typeof ctx.roundRect==="function"){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); if(fill)ctx.fill(); if(stroke)ctx.stroke(); return;}
  const R=r; ctx.beginPath();
  ctx.moveTo(x+R,y); ctx.lineTo(x+w-R,y); ctx.quadraticCurveTo(x+w,y,x+w,y+R);
  ctx.lineTo(x+w,y+h-R); ctx.quadraticCurveTo(x+w,y+h,x+w-R,y+h);
  ctx.lineTo(x+R,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-R);
  ctx.lineTo(x,y+R); ctx.quadraticCurveTo(x,y,x+R,y);
  ctx.closePath(); if(fill)ctx.fill(); if(stroke)ctx.stroke();
}

// Info box
function drawInfoBox(ctx,x,y,w,h,icon,label,value){
  const R=5;
  ctx.fillStyle="rgba(255,255,255,0.07)";
  drawRoundRect(ctx,x,y,w,h,R,true,false);
  ctx.strokeStyle="#ff00ff"; ctx.lineWidth=1;
  drawRoundRect(ctx,x,y,w,h,R,false,true);
  ctx.fillStyle="#ffd700"; ctx.font="bold 18px Arial"; ctx.textAlign="left";
  ctx.fillText(`${icon} ${label}:`, x+15, y+28);
  ctx.fillStyle="#ffffff"; ctx.font="bold 22px Arial"; ctx.textAlign="right";
  ctx.fillText(value, x+w-15, y+28);
}

// Pre-render galaxy background
async function createGalaxyBackground(width,height,savePath){
  const canvas=createCanvas(width,height);
  const ctx=canvas.getContext("2d");
  const gradient=ctx.createLinearGradient(0,0,width,height);
  gradient.addColorStop(0,"#050012"); gradient.addColorStop(0.25,"#120025");
  gradient.addColorStop(0.55,"#2a003f"); gradient.addColorStop(1,"#3b0060");
  ctx.fillStyle=gradient; ctx.fillRect(0,0,width,height);
  for(let i=0;i<320;i++){
    const x=Math.random()*width, y=Math.random()*height;
    const radius=Math.random()*1.4;
    ctx.beginPath(); ctx.arc(x,y,radius,0,Math.PI*2);
    const alpha=0.15+Math.random()*0.85; ctx.fillStyle=`rgba(255,255,255,${alpha})`; ctx.fill();
  }
  await fs.ensureDir(path.dirname(savePath));
  const out=fs.createWriteStream(savePath);
  const stream=canvas.createPNGStream();
  stream.pipe(out);
  await new Promise(res=>out.on("finish",res));
}
