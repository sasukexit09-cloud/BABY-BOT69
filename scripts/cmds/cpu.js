const os = require("os");

function generateBar(percentage, size = 20) {
  const filledLength = Math.round((percentage / 100) * size);
  const emptyLength = size - filledLength;
  return "⭐".repeat(filledLength) + "✩".repeat(emptyLength) + ` **${percentage.toFixed(1)}%**`;
}

module.exports = {
  name: "cpu",
  description: "Shows CPU & RAM usage in a stylish star bar box with typing animation",
  cooldown: 5,
  execute: async (bot, message) => {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = (usedMem / totalMem) * 100;

    // CPU usage estimation
    const cpuTimes = cpus.map(core => core.times);
    const totalIdle = cpuTimes.reduce((acc, t) => acc + t.idle, 0);
    const totalTotal = cpuTimes.reduce((acc, t) => acc + t.user + t.nice + t.sys + t.irq + t.idle, 0);
    const cpuPercentage = 100 - (totalIdle / totalTotal * 100);

    const info = {
      model: cpus[0].model,
      cores: cpus.length,
      speedMHz: cpus[0].speed,
      loadAvg: os.platform() === "win32" ? ["N/A","N/A","N/A"] : os.loadavg().map(n => n.toFixed(2)),
      freeMemoryMB: (freeMem / 1024 / 1024).toFixed(2),
      totalMemoryMB: (totalMem / 1024 / 1024).toFixed(2),
      uptimeMinutes: (os.uptime() / 60).toFixed(2),
    };

    const lines = [
      "☾✨ ┏━━━━━━━━━━━━━━━━━┓ ✨☽",
      "❃✨ ┃ **💻 𝐂𝐏𝐔 𝐒𝐓𝐀𝐓𝐔𝐒 💻** ┃ ✨❃",
      "❅✨ ┣━━━━━━━━━━━━━━━━━┫ ✨❅",
      `**🖥️ 𝙼𝙾𝙳𝙴𝙻       :** ${info.model}`,
      `**⚙️ 𝙲𝙾𝚁𝙴𝚂       :** ${info.cores}`,
      `**🚀 𝚂𝙿𝙴𝙴𝙳       :** ${info.speedMHz} MHz`,
      `**📊 𝙻𝙾𝙰𝙳 𝙰𝚅𝙶    :** ${info.loadAvg.join(" | ")}`,
      `**💻 𝙲𝙿𝚄 𝚄𝚂𝙰𝙶𝙴   :** ${generateBar(cpuPercentage)}`,
      `**💾 𝚁𝙰𝙼 𝚄𝚂𝙰𝙶𝙴   :** ${generateBar(memPercentage)}`,
      `**🗄️ 𝙵𝚁𝙴𝙴 𝙼𝙴𝙼𝙾𝚁𝚈 :** ${info.freeMemoryMB} MB / ${info.totalMemoryMB} MB`,
      `**⏱️ Uptime      :** ${info.uptimeMinutes} minutes`,
      "🖤💌 ┗━━━━━━━━━━━━━━━━━┛ 💌🤍"
    ];

    let sentMsg = await message.channel.send("⌛ Loading CPU status...");

    let currentText = "";
    for (let line of lines) {
      currentText += line + "\n";
      await new Promise(r => setTimeout(r, 350));
      await sentMsg.edit(currentText);
    }
  }
};
