const os = require("os");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "ckmiko",
    aliases: ["ckyea", "checkmiko", "chakrun", "ckr"],
    version: "21.0.0",
    author: "𝙰𝚈𝙰𝙽 𝙱𝙱𝙴",
    countDown: 5,
    role: 0,
    category: "𝙼𝙸𝙺𝙾 𝚂𝚈𝚂𝚃𝙴𝙼",
    usePrefix: true 
  },

  onStart: async function ({ api, event, message }) {
    const { threadID, messageID } = event;

    // ইমেজ লিঙ্ক
    const imgURL = "https://files.catbox.moe/h536m0.png";
    const cachePath = path.join(__dirname, "cache", `miko_${Date.now()}.png`);

    // ১. প্রোগ্রেস বার ফাংশন
    const getProgressBar = (percent) => {
      const totalBars = 10;
      const filledBars = Math.round(percent / 10);
      const emptyBars = totalBars - filledBars;
      return "█".repeat(filledBars) + "░".repeat(emptyBars);
    };

    // ২. লোডিং অ্যানিমেশন শুরু
    let loadingMsg = await message.reply(`🔄 𝚈𝙴𝙰 𝙼𝙸𝙺𝙾 𝚂𝚈𝚂𝚃𝙴𝙼 𝙻𝙾𝙰𝙳𝙸𝙽𝙶...\n[${getProgressBar(0)}] 0%`);
    
    const progressSteps = [ 20, 40, 60, 80, 100 ];
    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800)); // অ্যানিমেশন স্পিড
      await api.editMessage(
        `🔄 𝚈𝙴𝙰 𝙼𝙸𝙺𝙾 𝚂𝚈𝚂𝚃𝙴𝙼 𝙻𝙾𝙰𝙳𝙸𝙽𝙶...\n[${getProgressBar(step)}] ${step}%`,
        loadingMsg.messageID
      );
    }

    try {
      // ৩. সিস্টেম ইনফো সংগ্রহ
      let hostPlatform = "Unknown Server";
      const platform = os.platform();
      const arch = os.arch(); 
      const uptime = process.uptime(); 
      
      const isRender = process.env.RENDER || (process.env.HOME && process.env.HOME.includes("/opt/render"));
      const isRailway = process.env.RAILWAY_ID || process.env.RAILWAY_ENVIRONMENT;

      if (isRender) hostPlatform = "Render Cloud";
      else if (isRailway) hostPlatform = "Railway Cloud";
      else if (platform === "linux") hostPlatform = "Linux VPS";
      else if (platform === "win32") hostPlatform = "Windows PC";
      else if (platform === "android") hostPlatform = "Termux (Android)";

      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);

      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const usedMem = ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2);
      const ping = Date.now() - event.timestamp;

      // ৪. ইমেজ ডাউনলোড
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      const response = await axios.get(imgURL, { responseType: "arraybuffer" });
      fs.writeFileSync(cachePath, Buffer.from(response.data, "utf-8"));

      // ৫. ফাইনাল স্ট্যাটাস টেক্সট
      const statusText = `🍓 𝚈𝙴𝙰 𝙼𝙸𝙺𝙾 𝚂𝚃𝙰𝚃𝚄𝚂 🍓\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🌐 𝙷𝙾𝚂𝚃: ${hostPlatform}\n` +
        `⚙️ 𝙾𝚂: ${platform} (${arch})\n` +
        `⏳ 𝚄𝙿𝚃𝙸𝙼𝙴: ${days}d ${hours}h ${minutes}m\n` +
        `💾 𝚁𝙰𝙼: ${usedMem}GB / ${totalMem}GB\n` +
        `📡 𝙿𝙸𝙽𝙶: ${ping} ms\n` +
        `🟢 𝙽𝙾𝙳𝙴: ${process.version}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💌 𝐏𝐎𝐖𝐄𝐑𝐃 𝐁𝐘 𝐀𝐘𝐀𝐍 💌`;

      // ৬. লোডিং মেসেজ ডিলিট করে রেজাল্ট পাঠানো
      await api.unsendMessage(loadingMsg.messageID);
      
      await message.reply({
        body: statusText,
        attachment: fs.createReadStream(cachePath)
      });

      // ক্যাশ ফাইল মুছে ফেলা
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);

    } catch (err) {
      console.error(err);
      if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
      return message.reply(`❌ Error: ${err.message}`);
    }
  }
};