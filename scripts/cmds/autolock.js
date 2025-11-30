const mongoose = require("mongoose");
const os = require("os");

const instanceSchema = new mongoose.Schema({
  activeInstanceId: String,
  updatedAt: Date
});

const Instance = mongoose.models["instancelock"] || mongoose.model("instancelock", instanceSchema);

const myInstanceId = `${os.hostname()}-${process.pid}`;
const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const TIMEOUT_LIMIT = 15000; // 15 seconds timeout for old instance

module.exports = {
  config: {
    name: "autolock",
    version: "1.2",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 2,
    shortDescription: { en: "Kill duplicate bot instances" },
    description: { en: "Prevents the same bot ID running in multiple environments" },
    category: "system",
    guide: { en: "Auto runs on load. No command needed." }
  },

  onStart: async function () {
    try {
      // Attempt to claim the active instance atomically
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
        console.log(`🛑 Another instance (${result.activeInstanceId}) is active. Exiting...`);
        return process.exit(0);
      }

      console.log(`✅ This instance (${myInstanceId}) is now the active bot.`);

      // Heartbeat to keep this instance alive
      const heartbeat = setInterval(async () => {
        try {
          await Instance.updateOne(
            { activeInstanceId: myInstanceId },
            { updatedAt: new Date() }
          );
        } catch (err) {
          console.error("❌ Heartbeat error:", err);
        }
      }, HEARTBEAT_INTERVAL);

      // Graceful shutdown
      const cleanup = async () => {
        clearInterval(heartbeat);
        await Instance.updateOne(
          { activeInstanceId: myInstanceId },
          { updatedAt: new Date(0) } // Mark as inactive
        );
        process.exit(0);
      };

      process.on("SIGINT", cleanup);
      process.on("SIGTERM", cleanup);

    } catch (err) {
      console.error("❌ Instance lock error:", err);
      process.exit(1);
    }
  }
};
