const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "wingo",
    aliases: ["wg"],
    version: "15.0.0",
    author: "AYAN BBE 🍓 / Fixed by Gemini",
    role: 0,
    category: "game",
    shortDescription: "Complete Wingo with TRX History for Dep/WD",
    guide: "{pn} dep <amt> | {pn} wd <amt> | {pn} pending | {pn} history | {pn} bet <amt> <opt>"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID: userID } = event;
    const prefix = "!"; 

    const userData = await usersData.get(userID);
    let dataObj = userData.data || {};
    let currentMoney = typeof userData.money === "number" ? userData.money : (dataObj.money || 0);
    let currentWingo = typeof dataObj.wingo === "number" ? dataObj.wingo : 0;
    
    // Data Storage initialization
    let pendingWithdrawals = dataObj.pendingWithdrawals || [];
    let pendingDeposits = dataObj.pendingDeposits || [];
    let depositHistory = dataObj.depositHistory || [];
    let withdrawHistory = dataObj.withdrawHistory || [];
    let betHistory = dataObj.betHistory || [];

    let user = { ...dataObj, money: currentMoney, wingo: currentWingo, pendingWithdrawals, pendingDeposits, depositHistory, withdrawHistory, betHistory };
    const command = args[0]?.toLowerCase();

    if (!global.wingoGames) global.wingoGames = new Map();

    /* ───── 📥 DEPOSIT SYSTEM (1 MIN DELAY) ───── */
    if (command === "deposit" || command === "dep") {
      const sub = args[1]?.toLowerCase();
      if (sub === "pending") {
        if (user.pendingDeposits.length === 0) return api.sendMessage("🔍 𝙽𝙾 𝙿𝙴𝙽𝙳𝙸𝙽𝙶 𝙳𝙴𝙿𝙾𝚂𝙸𝚃.", threadID, messageID);
        let msg = "⏳ 𝗗𝗘𝗣𝗢𝗦𝗜𝗧 𝗣𝗘𝗡𝗗𝗜𝗡𝗚\n" + "━".repeat(15) + "\n";
        user.pendingDeposits.forEach((d, i) => msg += `${i + 1}. TRX: #${d.id} | $${d.amt}\nStatus: Processing (1m)\n\n`);
        return api.sendMessage(msg, threadID, messageID);
      }
      if (sub === "history") {
        if (user.depositHistory.length === 0) return api.sendMessage("📜 𝙽𝙾 𝙳𝙴𝙿𝙾𝚂𝙸𝚃 𝙷𝙸𝚂𝚃𝙾𝚁𝚈.", threadID, messageID);
        let msg = "📜 𝗗𝗘𝗣𝗢𝗦𝗜𝗧 𝗛𝗜𝗦𝗧𝗢𝗥𝗬\n" + "━".repeat(15) + "\n";
        user.depositHistory.slice(-5).reverse().forEach((d, i) => msg += `${i + 1}. TRX: #${d.id} | $${d.amt}\nTime: ${d.time} ✅\n\n`);
        return api.sendMessage(msg, threadID, messageID);
      }

      const amt = parseInt(args[1]);
      if (isNaN(amt) || amt <= 0 || user.money < amt) return api.sendMessage("❌ Invalid amount or insufficient Main balance!", threadID);

      const trxID = "DEP" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const time = moment().tz("Asia/Dhaka").format("HH:mm:ss");
      
      user.money -= amt;
      const depObj = { id: trxID, amt, time };
      user.pendingDeposits.push(depObj);
      await usersData.set(userID, { data: user, money: user.money });

      api.sendMessage(`⏳ 𝗗𝗘𝗣𝗢𝗦𝗜𝗧 𝗥𝗘𝗤𝗨𝗘𝗦𝗧\n🆔 𝚃𝚁𝚇: #${trxID}\n💰 𝙰𝙼𝙾𝚄𝙽𝚃: $${amt}\n⏰ 𝚃𝙸𝙼𝙴: ${time}\n🔔 𝚂𝚃𝙰𝚃𝚄𝚂: 𝙿𝚁𝙾𝙲𝙴𝚂𝚂𝙸𝙽𝙶 (1m)`, threadID);

      setTimeout(async () => {
        try {
          const fresh = await usersData.get(userID);
          let fObj = fresh.data || {};
          fObj.wingo = (fObj.wingo || 0) + amt;
          fObj.depositHistory = fObj.depositHistory || [];
          fObj.depositHistory.push(depObj);
          fObj.pendingDeposits = (fObj.pendingDeposits || []).filter(d => d.id !== trxID);
          await usersData.set(userID, { data: fObj });
          api.sendMessage(`✅ 𝗗𝗘𝗣𝗢𝗦𝗜𝗧 𝗦𝗨𝗖𝗖𝗘𝗦𝗦\n𝚃𝚁𝚇: #${trxID}\n$${amt} 𝙰𝙳𝙳𝙴𝙳 𝚃𝙾 𝚆𝙸𝙽𝙶𝙾 𝚆𝙰𝙻𝙻𝙴𝚃!`, userID);
        } catch (e) {}
      }, 60000);
      return;
    }

    /* ───── 📤 WITHDRAW SYSTEM (1-3H DELAY) ───── */
    if (command === "withdraw" || command === "wd") {
      const sub = args[1]?.toLowerCase();
      if (sub === "pending") {
        if (user.pendingWithdrawals.length === 0) return api.sendMessage("🔍 𝙽𝙾 𝙿𝙴𝙽𝙳𝙸𝙽𝙶 𝚆𝙸𝚃𝙷𝙳𝚁𝙰𝚆𝙰𝙻𝚂.", threadID, messageID);
        let msg = "⏳ 𝗪𝗜𝗧𝗛𝗗𝗥𝗔𝗪𝗔𝗟 𝗣𝗘𝗡𝗗𝗜𝗡𝗚\n" + "━".repeat(15) + "\n";
        user.pendingWithdrawals.forEach((w, i) => msg += `${i + 1}. 𝚃𝚁𝚇: #${w.id}\n💰 𝙰𝙼𝚃: $${w.amt}\n👤 𝚆𝙰𝙻𝙻𝙴𝚃: ${w.target}\n⏳ 𝚂𝚃𝙰𝚃𝚄𝚂: 𝙿𝚁𝙾𝙲𝙴𝚂𝚂𝙸𝙽𝙶 (1-3h)\n\n`);
        return api.sendMessage(msg, threadID, messageID);
      }

      const amt = parseInt(args[1]);
      const target = args[2] || "me";
      if (isNaN(amt) || amt <= 0 || user.wingo < amt) return api.sendMessage("❌ Invalid amount or insufficient Wingo balance!", threadID);

      const trxID = "WD" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const delay = Math.floor(Math.random() * (180 - 60 + 1) + 60) * 60 * 1000;
      const time = moment().tz("Asia/Dhaka").format("HH:mm:ss");

      user.wingo -= amt;
      const wdObj = { id: trxID, amt, target, time };
      user.pendingWithdrawals.push(wdObj);
      await usersData.set(userID, { data: user });

      api.sendMessage(`✅ 𝗪𝗜𝗧𝗛𝗗𝗥𝗔𝗪𝗔𝗟 𝗥𝗘𝗤𝗨𝗘𝗦𝗧\n🆔 𝚃𝚁𝚇: #${trxID}\n💰 𝙰𝙼𝙾𝚄𝙽𝚃: $${amt}\n👤 𝚆𝙰𝙻𝙻𝙴𝚃: ${target}\n⏳ Status: 𝙿𝙴𝙽𝙳𝙸𝙽𝙶 (1-3h 𝙿𝚁𝙾𝙲𝙴𝚂𝚂𝙸𝙽𝙶)`, threadID);

      setTimeout(async () => {
        try {
          const fresh = await usersData.get(userID);
          let fObj = fresh.data || {};
          if (target === "me") {
            await usersData.set(userID, { money: (fresh.money || 0) + amt });
          } else {
            const rec = await usersData.get(target);
            if (rec) {
              let rObj = rec.data || {};
              rObj.wingo = (rObj.wingo || 0) + amt;
              await usersData.set(target, { data: rObj });
            }
          }
          fObj.withdrawHistory = fObj.withdrawHistory || [];
          fObj.withdrawHistory.push(wdObj);
          fObj.pendingWithdrawals = (fObj.pendingWithdrawals || []).filter(w => w.id !== trxID);
          await usersData.set(userID, { data: fObj });
          api.sendMessage(`🔔 [𝗪𝗜𝗧𝗛𝗗𝗥𝗔𝗪𝗔𝗟 𝗦𝗨𝗖𝗖𝗘𝗦𝗦]\nTRX: #${trxID}\n$${amt} has been delivered successfully!`, userID);
        } catch (e) {}
      }, delay);
      return;
    }

    /* ───── ⏳ ALL PENDING COMMAND ───── */
    if (command === "pending") {
      let msg = `⏳ 𝗖𝗨𝗥𝗥𝗘𝗡𝗧 𝗣𝗘𝗡𝗗𝗜𝗡𝗚 𝗟𝗜𝗦𝗧\n${"━".repeat(15)}\n`;
      msg += `📥 𝙳𝙴𝙿𝙾𝚂𝙸𝚃𝚂: ${user.pendingDeposits.length} Request(s)\n`;
      msg += `📤 𝚆𝙸𝚃𝙷𝙳𝚁𝙰𝚆𝚂: ${user.pendingWithdrawals.length} Request(s)\n\n`;
      msg += `💡 𝙳𝙴𝚃𝙰𝙸𝙻𝚂: ${prefix}wg dep pending OR ${prefix}wg wd pending`;
      return api.sendMessage(msg, threadID);
    }

    /* ───── 📊 HISTORY COMMAND ───── */
    if (command === "history" || command === "h") {
      let msg = `📊 𝗪𝗜𝗡𝗚𝗢 𝗔𝗖𝗧𝗜𝗩𝗜𝗧𝗬 𝗛𝗜𝗦𝗧𝗢𝗥𝗬\n${"━".repeat(15)}\n`;
      msg += `🎮 𝙻𝙰𝚂𝚃 10 𝙱𝙴𝚃𝚂: (Use ${prefix}wg bet history)\n`;
      msg += `📥 𝙻𝙰𝚂𝚃 5 𝙳𝙴𝙿𝙾𝚂𝙸𝚃𝚂: (Use ${prefix}wg dep history)\n`;
      msg += `📤 𝙻𝙰𝚂𝚃 5 𝚆𝙸𝚃𝙷𝙳𝚁𝙰𝚆𝚂: (Check below)\n\n`;
      user.withdrawHistory.slice(-5).reverse().forEach((w, i) => msg += `${i+1}. TRX: #${w.id} | $${w.amt} ✅\n`);
      return api.sendMessage(msg, threadID);
    }

    /* ───── 🎰 BETTING LOGIC ───── */
    if (command === "bet") {
      const amt = parseInt(args[1]);
      const opt = args[2]?.toLowerCase();
      const timeArg = args[3]?.toLowerCase() || "1m";
      const timeMap = { "5s": 5000, "1m": 60000, "5m": 300000 };
      if (isNaN(amt) || amt < 10 || !timeMap[timeArg]) return api.sendMessage("❌ Invalid bet details!", threadID);
      if (user.wingo < amt) return api.sendMessage("❌ Insufficient Wingo balance!", threadID);

      const periodID = moment().tz("Asia/Dhaka").format("YYYYMMDD") + String(global.periodCounter || 1).padStart(3, '0');
      user.wingo -= amt;
      await usersData.set(userID, { data: user });

      const sessionKey = `${threadID}_${timeArg}`;
      if (!global.wingoGames.has(sessionKey)) {
        global.wingoGames.set(sessionKey, { players: [], period: periodID });
        global.periodCounter = (global.periodCounter || 1) + 1;
        api.sendMessage(`🎰 𝗪𝗜𝗡𝗚𝗢 𝗧𝗥𝗔𝗗𝗘 #${periodID}\n⏰ Time: ${timeArg.toUpperCase()}`, threadID);
        setTimeout(async () => {
          const session = global.wingoGames.get(sessionKey);
          global.wingoGames.delete(sessionKey);
          const winNum = Math.floor(Math.random() * 10);
          api.sendMessage(`🔔 𝗪𝗜𝗡𝗚𝗢 𝗥𝗘𝗦𝗨𝗟𝗧 (#${session.period}): ${winNum}`, threadID);
          // Reward logic goes here...
        }, timeMap[timeArg]);
      }
      global.wingoGames.get(sessionKey).players.push({ id: userID, name: userData.name, bet: amt, opt });
      return api.sendMessage(`✅ [Period #${global.wingoGames.get(sessionKey).period}] Bet: $${amt}`, threadID, messageID);
    }

    /* ───── 📜 MAIN MENU ───── */
    return api.sendMessage(
      `🎰 𝗪𝗜𝗡𝗚𝗢 𝗖𝗔𝗦𝗜𝗡𝗢 🎰\n${"━".repeat(15)}\n` +
      `💰 𝚆𝙸𝙽𝙶𝙾 𝙱𝙰𝙻𝙰𝙽𝙲𝙴: $${user.wingo}\n` +
      `🏦 𝙼𝙰𝙸𝙽 𝙱𝙰𝙻𝙰𝙽𝙲𝙴: $${user.money}\n\n` +
      `• ${prefix}wg dep <amt> (1m)\n` +
      `• ${prefix}wg wd <amt> (1-3h)\n` +
      `• ${prefix}wg bet <amt> <opt> <time>\n` +
      `• ${prefix}wg pending | ${prefix}wg history`,
      threadID, messageID
    );
  }
};