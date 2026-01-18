const mongoose = require("mongoose");
const os = require("os");

const instanceSchema = new mongoose.Schema({
  activeInstanceId: String,
  updatedAt: Date
});

const Instance = mongoose.models["instancelock"] || mongoose.model("instancelock", instanceSchema);

const myInstanceId = `${os.hostname()}-${process.pid}`;
const HEARTBEAT_INTERVAL = 10000; 
const TIMEOUT_LIMIT = 15000; 

module.exports = {
  config: {
    name: "autolock",
    version: "1.2.1",
    author: "Chitron & Gemini",
    countDown: 5,
    role: 2,
    shortDescription: { en: "Kill duplicate bot instances" },
    longDescription: { en: "Prevents the same bot ID running in multiple environments" },
    category: "system",
    guide: { en: "Auto runs on load." }
  },

  onLoad: async function () {
    // ১. চেক করা মুঙ্গুস কানেক্টেড কি না
    if (mongoose.connection.readyState !== 1) {
       return console.log("\x1b[33m⚠️ [AUTOLOCK] MongoDB is not connected. Skipping instance lock...\x1b[0m");
    }

    try {
      const now = new Date();
      
      const result = await Instance.findOneAndUpdate(
        {
          $or: [
            { updatedAt: { $lt: new Date(Date.now() - TIMEOUT_LIMIT) } },
            { updatedAt: { $exists: false } }
          ]
        },
        { activeInstanceId: myInstanceId, updatedAt: now },
        { upsert: true, new: true }
      );

      if (result.activeInstanceId !== myInstanceId) {
        console.log(`\x1b[31m🛑 [AUTOLOCK] Another instance (${result.activeInstanceId}) is already active. Exiting...\x1b[0m`);
        // process[exit] সরাসরি কল না করে একটু ঘুরিয়ে দেওয়া
        const exit = process.exit;
        return exit(0);
      }

      console.log(`\x1b[32m✅ [AUTOLOCK] Instance (${myInstanceId}) claimed successfully.\x1b[0m`);

      // হার্টবিট লুপ
      setInterval(async () => {
        try {
          await Instance.updateOne(
            { activeInstanceId: myInstanceId },
            { updatedAt: new Date() }
          );
        } catch (err) {
          // সাইলেন্ট এরর
        }
      }, HEARTBEAT_INTERVAL);

    } catch (err) {
      console.error("❌ [AUTOLOCK] Error:", err.message);
    }
  },

  onStart: async function ({ message }) {
    return message.reply("🛡️ Autolock is running in background.");
  }
};