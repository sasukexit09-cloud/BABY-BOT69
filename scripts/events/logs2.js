const { getTime } = global.utils;

const userWarnings = new Map();
const bannedUsers = new Set();
const commandTracker = new Map();

module.exports = {
  config: {
    name: "logs2",
    version: "4.0",
    author: "GPT ULTIMATE",
    category: "events",
    envConfig: {
      logGroupID: "1879628072949507",
      adminUIDs: ["YOUR_FB_ID"]
    }
  },

  onEvent: async function ({ event, api, usersData }) {
    const { config } = global.GoatBot;
    const logGroupID = this.config.envConfig.logGroupID;
    const admins = this.config.envConfig.adminUIDs;
    const prefix = config.prefix || "/";

    const time = getTime("HH:mm:ss");

    // =========================
    // 🚫 BAN CHECK
    // =========================
    if (bannedUsers.has(event.senderID)) {
      return api.sendMessage("🚫 You are banned!", event.threadID);
    }

    // =========================
    // 👮 ADMIN PROTECT
    // =========================
    if (event.logMessageType === "log:unsubscribe") {
      const leftID = event.logMessageData?.leftParticipantFbId;

      if (admins.includes(leftID)) {
        await api.sendMessage(
          `🚨 ADMIN ALERT!
❌ An admin was removed!
🆔 ${leftID}
🕒 ${time}`,
          logGroupID
        );
      }
    }

    // =========================
    // 💬 MESSAGE + COMMAND
    // =========================
    if (event.type === "message" && event.body) {
      if (!event.body.startsWith(prefix)) return;

      const command = event.body.slice(prefix.length).split(" ")[0].toLowerCase();

      // =========================
      // 🤖 AI SPAM DETECTION
      // =========================
      const now = Date.now();
      let data = commandTracker.get(event.senderID) || [];

      data.push(now);
      data = data.filter(t => now - t < 20000); // 20 sec window
      commandTracker.set(event.senderID, data);

      if (data.length >= 5) {
        bannedUsers.add(event.senderID);

        await api.sendMessage(
          `🚨 AUTO BAN!
User spammed commands (5 in 20s)`,
          logGroupID
        );

        return api.sendMessage("🚫 You are banned for spamming!", event.threadID);
      }

      // =========================
      // 🔞 18+ PROTECTION
      // =========================
      const adultCommands = ["18", "nsfw", "xxx"];

      if (adultCommands.includes(command) && !admins.includes(event.senderID)) {
        let warn = userWarnings.get(event.senderID) || 0;
        warn++;
        userWarnings.set(event.senderID, warn);

        if (warn >= 3) {
          bannedUsers.add(event.senderID);

          return api.sendMessage("🚫 Banned for 18+ misuse!", event.threadID);
        }

        return api.sendMessage(`⚠️ Warning ${warn}/3`, event.threadID);
      }
    }
  },

  // =========================
  // ⚙️ COMMANDS
  // =========================
  onStart: async function ({ api, event, args }) {
    const admins = this.config.envConfig.adminUIDs;

    if (!event.body) return;
    const cmd = event.body.split(" ")[0];

    // -------------------------
    // 🔓 UNBAN
    // -------------------------
    if (cmd === "/unban") {
      if (!admins.includes(event.senderID))
        return api.sendMessage("❌ Admin only!", event.threadID);

      const uid = args[0];
      bannedUsers.delete(uid);

      return api.sendMessage(`✅ Unbanned: ${uid}`, event.threadID);
    }

    // -------------------------
    // 👢 KICK USER
    // -------------------------
    if (cmd === "/kick") {
      if (!admins.includes(event.senderID))
        return api.sendMessage("❌ Admin only!", event.threadID);

      const uid = Object.keys(event.mentions)[0];
      if (!uid) return api.sendMessage("⚠️ Mention user", event.threadID);

      return api.removeUserFromGroup(uid, event.threadID);
    }
  }
};