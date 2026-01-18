const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "file2",
    version: "1.0.5",
    author: "rX & Gemini",
    countDown: 5,
    role: 2, // শুধুমাত্র এডমিনদের জন্য (ফাইল ডিলিট করা ঝুঁকিপূর্ণ)
    shortDescription: { en: "Delete files or folders from commands folder" },
    category: "admin",
    guide: { 
      en: "{pn} help\n{pn} start <text>\n{pn} ext <extension>\n{pn} <text>" 
    }
  },

  handleReply: async function ({ api, event, handleReply }) {
    if (event.senderID != handleReply.author) return;

    const { body, threadID, messageID } = event;
    const folderPath = path.join(process.cwd(), "scripts/cmds");
    const arrnum = body.split(" ");
    const nums = arrnum.map(n => parseInt(n)).filter(n => !isNaN(n));
    let msg = "";

    for (const num of nums) {
      const target = handleReply.files[num - 1];
      if (!target) continue;

      const fullPath = path.join(folderPath, target);

      try {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          msg += `[Folder🗂️] ${target}\n`;
        } else {
          fs.unlinkSync(fullPath);
          msg += `[File📄] ${target}\n`;
        }
      } catch (err) {
        msg += `[❌ Error] ${target}\n`;
      }
    }

    return api.sendMessage(`⚡️ সফলভাবে ডিলিট করা হয়েছে:\n\n${msg}`, threadID, messageID);
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const folderPath = path.join(process.cwd(), "scripts/cmds");
    
    let files = fs.readdirSync(folderPath) || [];
    let msg = "";
    let i = 1;

    // ১. Help Command
    if (args[0] == 'help') {
      const helpMsg = `📖 ফাইল ম্যানেজার গাইড:
• {pn} start <text>: নির্দিষ্ট অক্ষর দিয়ে শুরু হওয়া ফাইল।
• {pn} ext <ext>: নির্দিষ্ট ফরম্যাটের ফাইল (যেমন: js)।
• {pn}: সব ফাইল দেখাবে।
• রিপ্লাই বক্সে নম্বর লিখে ডিলিট করুন।`;
      return api.sendMessage(helpMsg, threadID, messageID);
    }

    // ২. ফিল্টারিং লজিক
    let filterKey = "সব ফাইল";
    if (args[0] == "start" && args[1]) {
      const word = args.slice(1).join(" ");
      files = files.filter(file => file.startsWith(word));
      filterKey = `শুরু: ${word}`;
    } else if (args[0] == "ext" && args[1]) {
      const ext = args[1];
      files = files.filter(file => file.endsWith(ext));
      filterKey = `এক্সটেনশন: ${ext}`;
    } else if (args[0]) {
      const word = args.join(" ");
      files = files.filter(file => file.includes(word));
      filterKey = `নামে আছে: ${word}`;
    }

    if (files.length == 0) return api.sendMessage("⚡️ কোনো ফাইল পাওয়া যায়নি!", threadID, messageID);

    // ৩. লিস্ট তৈরি
    files.forEach(file => {
      try {
        const stats = fs.statSync(path.join(folderPath, file));
        const typef = stats.isDirectory() ? "[Folder🗂️]" : "[File📄]";
        msg += `${i++}. ${typef} ${file}\n`;
      } catch (e) {}
    });

    return api.sendMessage(
      `⚡️ ডিলিট করতে নম্বর লিখে রিপ্লাই দিন (একাধিক হলে স্পেস দিন)।\n🔍 ফিল্টার: ${filterKey}\n\n${msg}`,
      threadID,
      (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: senderID,
          files
        });
      },
      messageID
    );
  }
};