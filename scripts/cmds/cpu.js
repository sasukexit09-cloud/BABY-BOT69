// cpuCommand.js
const os = require("os");

module.exports = {
  name: "cpu",
  description: "Shows CPU status in a styled box with typing animation",
  cooldown: 5, // seconds
  execute: async (bot, message) => {
    const cpus = os.cpus();
    const info = {
      model: cpus[0].model,
      cores: cpus.length,
      speedMHz: cpus[0].speed,
      loadAvg: os.loadavg().map(n => n.toFixed(2)),
      freeMemoryMB: (os.freemem() / 1024 / 1024).toFixed(2),
      totalMemoryMB: (os.totalmem() / 1024 / 1024).toFixed(2),
      uptimeMinutes: (os.uptime() / 60).toFixed(2),
    };

    // Box style with emojis
    const lines = [
      "💻 ── CPU STATUS ── 💻",
      `🖥️ Model       : ${info.model}`,
      `⚙️ Cores       : ${info.cores}`,
      `🚀 Speed       : ${info.speedMHz} MHz`,
      `📊 Load Avg    : ${info.loadAvg.join(", ")}`,
      `💾 Free Memory : ${info.freeMemoryMB} MB`,
      `🗄️ Total Memory: ${info.totalMemoryMB} MB`,
      `⏱️ Uptime      : ${info.uptimeMinutes} minutes`,
      "🔹────────────────🔹"
    ];

    // প্রথমে Loading message
    let sentMsg = await message.channel.send("⌛ Loading CPU status...");

    let currentText = "";
    for (let line of lines) {
      currentText += line + "\n";
      await new Promise(r => setTimeout(r, 600)); // টাইপিং এফেক্টের delay
      await sentMsg.edit(currentText);
    }
  }
};
