const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "logs",
    version: "3.0.0",
    author: "TAREK & MIKON",
    category: "events"
  },

  onEvent: async function ({ event, api, usersData, threadsData }) {
    const logGroupID = "1534849337581834"; // আপনার লগ গ্রুপ আইডি
    const statsFile = path.join(__dirname, "../../data/command_stats.json");

    // ডাটা ফাইল নিশ্চিত করা
    if (!fs.existsSync(statsFile)) {
      fs.outputJsonSync(statsFile, { lastUpdate: "", commands: {}, users: [] });
    }

    let stats = fs.readJsonSync(statsFile);
    const today = moment.tz("GMT").format("DD/MM/YYYY");
    const currentTime = moment.tz("GMT");

    // --- [ ১. DAILY SUMMARY CHART (GMT+0) ] ---
    if (stats.lastUpdate !== today && stats.lastUpdate !== "") {
      let totalUsage = 0;
      let chartText = `📊 DAILY USAGE REPORT (GMT+0)\n`;
      chartText += `📅 Date: ${stats.lastUpdate}\n`;
      chartText += `━━━━━━━━━━━━━━━━━━\n\n`;
      chartText += `👤 Unique Users: ${stats.users.length}\n\n`;
      chartText += `📜 Command Usage List:\n`;

      const sortedCommands = Object.entries(stats.commands).sort((a, b) => b[1] - a[1]);
      
      if (sortedCommands.length === 0) {
        chartText += "No commands used today.";
      } else {
        sortedCommands.forEach(([cmd, count]) => {
          chartText += `🔹 ${cmd}: ${count} times\n`;
          totalUsage += count;
        });
      }

      chartText += `\n━━━━━━━━━━━━━━━━━━\n`;
      chartText += `📈 Total Command Calls: ${totalUsage}\n`;
      chartText += `✅ Data reset for ${today}`;

      api.sendMessage(chartText, logGroupID).catch(err => console.log("Log Group Error: " + err));
      
      // ডাটা রিসেট করা
      stats = { lastUpdate: today, commands: {}, users: [] };
      fs.writeJsonSync(statsFile, stats);
    } else if (stats.lastUpdate === "") {
      stats.lastUpdate = today;
      fs.writeJsonSync(statsFile, stats);
    }

    try {
      // --- [ ২. BOT ADD/KICK LOG ] ---
      if (event.logMessageType === "log:subscribe" && event.logMessageData.addedParticipants.some(p => p.userFbId === api.getCurrentUserID())) {
        const authorName = await usersData.getName(event.author);
        const threadName = (await threadsData.get(event.threadID)).threadName || "Unnamed Group";
        const msg = `🛸 [ BOT ADDED ]\n👤 Added by: ${authorName}\n📌 Group: ${threadName}\n🆔 ID: ${event.threadID}\n⏰ Time: ${moment.tz("GMT").format("HH:mm:ss")}`;
        return api.sendMessage(msg, logGroupID);
      }

      if (event.logMessageType === "log:unsubscribe" && event.logMessageData.leftParticipantFbId === api.getCurrentUserID()) {
        const authorName = await usersData.getName(event.author);
        const threadName = (await threadsData.get(event.threadID)).threadName || "Unnamed Group";
        const msg = `⚡ [ BOT REMOVED ]\n👤 By: ${authorName}\n📌 Group: ${threadName}\n🆔 ID: ${event.threadID}\n⏰ Time: ${moment.tz("GMT").format("HH:mm:ss")}`;
        return api.sendMessage(msg, logGroupID);
      }

      // --- [ ৩. TRACKING COMMAND USAGE ] ---
      const prefix = (await threadsData.get(event.threadID)).prefix || global.GoatBot.config.prefix;
      if (event.type === "message" && event.body && event.body.startsWith(prefix)) {
        const commandName = event.body.slice(prefix.length).split(" ")[0].toLowerCase();
        
        // কমান্ড লিস্ট আপডেট
        stats.commands[commandName] = (stats.commands[commandName] || 0) + 1;
        
        // ইউনিক ইউজার আপডেট
        if (!stats.users.includes(event.senderID)) {
          stats.users.push(event.senderID);
        }
        
        fs.writeJsonSync(statsFile, stats);
      }

    } catch (error) {
      console.error("Logs Error:", error);
    }
  }
};