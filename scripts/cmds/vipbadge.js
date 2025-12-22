const fs = require("fs");
const { loadImage } = require("canvas");

// 🔧 CONFIG
const VIP_BADGE_URL = "https://files.catbox.moe/46spgx.jpeg";
const VIP_FILE = "vip.json";

// Load JSON safely
function loadJSON(path) {
  if (!fs.existsSync(path)) return {};
  try {
    return JSON.parse(fs.readFileSync(path));
  } catch {
    return {};
  }
}

// VIP check
function isVIP(uid) {
  const vipData = loadJSON(VIP_FILE);
  const vip = vipData[uid];
  if (!vip) return false;
  if (vip.type === "admin") return true;
  if (vip.expiry && Date.now() > vip.expiry) return false;
  return true;
}

// Draw VIP badge on canvas
async function drawVipBadge(ctx, canvas, uid, options = {}) {
  if (!isVIP(uid)) return;

  const size = options.size || 70;
  const padding = options.padding || 15;

  const x = canvas.width - size - padding;
  const y = padding;

  const badge = await loadImage(VIP_BADGE_URL);
  ctx.drawImage(badge, x, y, size, size);
}

module.exports = {
  isVIP,
  drawVipBadge
};
