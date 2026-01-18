const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// VIP ফাইলটি scripts ফোল্ডারের ভেতরে ডাটাবেজ হিসেবে থাকবে
const VIP_FILE = path.join(process.cwd(), "scripts", "cache", "vip_users.json");

// ফোল্ডার এবং ফাইল না থাকলে তৈরি করবে
if (!fs.existsSync(path.dirname(VIP_FILE))) fs.mkdirSync(path.dirname(VIP_FILE), { recursive: true });
if (!fs.existsSync(VIP_FILE)) {
  fs.writeFileSync(VIP_FILE, JSON.stringify(["61584308632995"], null, 2));
}

module.exports = {
  config: {
    name: "give",
    version: "1.3.1",
    author: "rX Abdullah & Gemini",
    countDown: 5,
    role: 0, // ভিআইপি চেক কোডের ভেতরে হবে
    shortDescription: { en: "Upload scripts to Pastebin with VIP system" },
    category: "utility",
    guide: { en: "{pn} [filename] [raw] | {pn} vip add | {pn} vip list" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;
    const vipList = JSON.parse(fs.readFileSync(VIP_FILE));

    // --- VIP SYSTEM ---
    if (args[0] && args[0].toLowerCase() === "vip") {
      const subCmd = args[1] ? args[1].toLowerCase() : "";

      // ১. ভিআইপি এড করা (শুধুমাত্র নির্দিষ্ট আইডি পারবে)
      if (subCmd === "add") {
        if (senderID !== "61584308632995") {
          return api.sendMessage("❌ আপনার ভিআইপি মেম্বার এড করার অনুমতি নেই।", threadID, messageID);
        }

        let targetID = type === "message_reply" ? messageReply.senderID : Object.keys(mentions)[0];
        
        if (!targetID) return api.sendMessage("⚠️ দয়াকরে একজনকে মেনশন করুন বা রিপ্লাই দিন।", threadID, messageID);
        if (vipList.includes(targetID)) return api.sendMessage("ℹ️ এই ইউজার অলরেডি ভিআইপি লিস্টে আছে।", threadID, messageID);

        vipList.push(targetID);
        fs.writeFileSync(VIP_FILE, JSON.stringify(vipList, null, 2));
        return api.sendMessage(`✅ ইউজার ${targetID} সফলভাবে ভিআইপি হিসেবে যুক্ত হয়েছে!`, threadID, messageID);
      }

      // ২. ভিআইপি লিস্ট দেখানো
      if (subCmd === "list") {
        if (vipList.length === 0) return api.sendMessage("📭 বর্তমানে কোন ভিআইপি নেই।", threadID, messageID);
        let msg = "👑 VIP User List 👑\n\n";
        vipList.forEach(uid => msg += `• https://www.facebook.com/${uid}\n`);
        return api.sendMessage(msg, threadID, messageID);
      }
    }

    // --- VIP CHECK ---
    if (!vipList.includes(senderID)) {
      return api.sendMessage("🚫 আপনি ভিআইপি ইউজার নন। এই কমান্ডটি আপনার জন্য নয়।", threadID, messageID);
    }

    // --- FILE UPLOAD ---
    if (args.length === 0) return api.sendMessage("📁 ফাইলের নাম দিন। ব্যবহার: {pn} <filename> [raw]", threadID, messageID);

    const fileName = args[0];
    const isRaw = args[1] && args[1].toLowerCase() === "raw";
    const scriptsPath = path.join(process.cwd(), "scripts");
    
    let filePath = path.join(scriptsPath, fileName.endsWith(".js") ? fileName : fileName + ".js");

    if (!fs.existsSync(filePath)) {
      return api.sendMessage(`❌ scripts ফোল্ডারে '${path.basename(filePath)}' ফাইলটি পাওয়া যায়নি।`, threadID, messageID);
    }

    try {
      const data = fs.readFileSync(filePath, "utf8");
      api.sendMessage("📤 PasteBin-এ আপলোড হচ্ছে...", threadID, async (err, info) => {
        try {
          const response = await axios.post("https://pastebin-api.vercel.app/paste", { text: data });
          setTimeout(() => api.unsendMessage(info.messageID), 1500);

          if (response.data && response.data.id) {
            const link = isRaw ? `https://pastebin-api.vercel.app/raw/${response.data.id}` : `https://pastebin-api.vercel.app/${response.data.id}`;
            return api.sendMessage(`📄 ফাইল: ${path.basename(filePath)}\n✅ আপলোড সফল হয়েছে!\n🔗 লিঙ্ক: ${link}`, threadID, messageID);
          }
        } catch (e) {
          return api.sendMessage("⚠️ আপলোড ব্যর্থ হয়েছে।", threadID, messageID);
        }
      }, messageID);
    } catch (e) {
      return api.sendMessage("❗ ফাইলটি রিড করতে সমস্যা হয়েছে।", threadID, messageID);
    }
  }
};