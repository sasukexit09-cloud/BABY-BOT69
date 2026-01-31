const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "trade",
    aliases: ["quotex", "iq", "td", "lb"],
    version: "38.0.0",
    author: "AYAN BBE 🍓 / Fixed by Gemini",
    role: 0,
    category: "game",
    shortDescription: "Quotex Ultimate (WD, DEP, LB, HIS)",
    guide: "{pn} <amt> <up/down> <sec> | {pn} wd <amt> me | {pn} lb"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID: userID } = event;

    // --- ADMIN CONFIG ---
    const ADMINS = ["61584308632995"]; 
    const isAdmin = ADMINS.includes(userID);

    const userData = await usersData.get(userID);
    let dataObj = userData.data || {};
    let currentMoney = typeof userData.money === "number" ? userData.money : (dataObj.money || 0);
    let tradeWallet = typeof dataObj.wingo === "number" ? dataObj.wingo : 0;
    
    // Data structures initialization
    dataObj.depositHistory = dataObj.depositHistory || [];
    dataObj.withdrawHistory = dataObj.withdrawHistory || [];
    dataObj.tradeHistory = dataObj.tradeHistory || [];

    let user = { ...dataObj, money: currentMoney, wingo: tradeWallet };
    const command = args[0]?.toLowerCase();

    const generateTXID = (prefix) => prefix + Math.random().toString(36).substring(2, 8).toUpperCase();

    /* ───── 📤 WITHDRAW SYSTEM (FIXED & VISIBLE) ───── */
    if (command === "wd" || command === "withdraw") {
      const amt = parseInt(args[1]);
      const target = args[2]?.toLowerCase();

      if (isNaN(amt) || amt < 1000) return api.sendMessage("❌ Minimum Withdraw $1000", threadID);
      if (user.wingo < amt) return api.sendMessage("❌ 𝙲𝙷𝙴𝙲𝙺 𝚈𝙾𝚄𝚁 𝙱𝙰𝙻𝙰𝙽𝙲𝙴 𝚃𝚁𝚈 𝙰𝙶𝙸𝙽🍓", threadID);
      if (!target) return api.sendMessage("❓ Specify: /trade wd <amt> me (Self) OR <UID>", threadID);

      let targetID = target === "me" ? userID : target;
      const txid = generateTXID("WD");
      const delay = Math.floor(Math.random() * 25) + 5;

      // Processing Withdrawal
      user.wingo -= amt;
      user.withdrawHistory.push({ id: txid, amt, time: moment().tz("Asia/Dhaka").format("HH:mm"), status: "⏳ 𝙿𝙴𝙽𝙳𝙸𝙽𝙶", target: targetID });
      await usersData.set(userID, { data: user });

      api.sendMessage(
        `╭━━━━ 𝚆𝙸𝚃𝙷𝙳𝚁𝙰𝚆𝙰𝙻 ━━━━╮\n` +
        `  𝙸𝙳: #${txid}\n` +
        `  𝙰𝙼𝚃: $${amt}\n` +
        `  𝚆𝙰𝙻𝙻𝙴𝚃: ${target === 'me' ? 'Self' : targetID}\n` +
        `  𝚂𝚃𝙰𝚃𝚄𝚂: Verifying...\n` +
        `  𝙴𝚂𝚃: ${delay} mins\n` +
        `╰━━━━━━━━━━━━━━━━━━━━╯`, threadID);

      setTimeout(async () => {
        const freshTarget = await usersData.get(targetID);
        await usersData.set(targetID, { money: (freshTarget.money || 0) + amt });
        
        const sender = await usersData.get(userID);
        let sData = sender.data || {};
        let idx = sData.withdrawHistory.findIndex(w => w.id === txid);
        if (idx !== -1) sData.withdrawHistory[idx].status = "✅ Success";
        await usersData.set(userID, { data: sData });
        
        api.sendMessage(`💰 Payment Received: #${txid} ($${amt}) credited to Main Balance!`, targetID);
      }, delay * 60000);
      return;
    }

    /* ───── 🏆 LEADERBOARD ───── */
    if (command === "lb") {
      const all = await usersData.getAll();
      const top = all.filter(u => u.data && (u.data.wingo || 0) > 0).sort((a,b) => (b.data.wingo || 0) - (a.data.wingo || 0)).slice(0, 5);
      let lb = `╭━━━━ 𝗟𝗘𝗔𝗗𝗘𝗥𝗕𝗢𝗥𝗗 ━━━━╮\n`;
      top.forEach((t, i) => lb += `  ${i+1}. ${t.name || "User"}: $${t.data.wingo}\n`);
      lb += `╰━━━━━━━━━━━━━━━━━━━━╯`;
      return api.sendMessage(lb, threadID);
    }

    /* ───── 📉 𝐓𝐑𝐀𝐃𝐄 𝐄𝐗𝐄𝐂𝐔𝐓𝐀𝐈𝐎𝐍 ───── */
    if (!isNaN(args[0]) && args[0] !== "" && args[1]) {
      let amt = parseInt(args[0]);
      let pos = args[1]?.toLowerCase();
      let duration = parseInt(args[2]) || 5; 
      if (amt < 10 || user.wingo < amt) return api.sendMessage("❌ Check Balance/Amt", threadID);

      const txid = generateTXID("TRD");
      const entry = (1.93900 + Math.random() * 0.001).toFixed(5);
      api.sendMessage(`╭━━━━ 𝙾𝙳𝙴𝚁 𝙾𝙿𝙴𝙽 ━━━━╮\n  ID: #${txid}\n  Entry: ${entry}\n  Side: ${pos.toUpperCase()}\n╰━━━━━━━━━━━━━━━━━━╯`, threadID);

      setTimeout(async () => {
        let exit, win;
        if (isAdmin) {
          win = Math.random() < 0.95;
          exit = win ? (pos === "up" ? (parseFloat(entry) + 0.0002).toFixed(5) : (parseFloat(entry) - 0.0002).toFixed(5)) : (pos === "up" ? (parseFloat(entry) - 0.0002).toFixed(5) : (parseFloat(entry) + 0.0002).toFixed(5));
        } else {
          exit = (parseFloat(entry) + (Math.random() * 0.0006 - 0.0003)).toFixed(5);
          win = (pos === "up" && exit > entry) || (pos === "down" && exit < entry);
        }
        const profit = Math.floor(amt * 0.90);
        user.wingo = win ? user.wingo + profit : user.wingo - amt;
        user.tradeHistory.push({ txid, amt, pos, entry, exit, win });
        await usersData.set(userID, { data: user });
        api.sendMessage(`╭━━━━ 𝚁𝙴𝚂𝚄𝙻𝚃 ━━━━╮\n  ID: #${txid}\n  Result: ${win ? "✅ 𝚆𝙸𝙽" : "❌ 𝙻𝙾𝚂𝚂"}\n  Wallet: $${user.wingo}\n╰━━━━━━━━━━━━━━━━╯`, threadID, messageID);
      }, duration * 1000);
      return;
    }

    /* ───── 📥 𝐃𝐄𝐏𝐎𝐒𝐈𝐓𝐄 (5-30s) ───── */
    if (command === "dep") {
      const amt = parseInt(args[1]);
      if (user.money < amt) return api.sendMessage("❌ No Main Balance!", threadID);
      const txid = generateTXID("DEP");
      user.money -= amt;
      await usersData.set(userID, { money: user.money, data: user });
      api.sendMessage(`⏳ 𝙳𝙴𝙿𝙾𝚂𝙸𝚃𝙴 𝙸𝚂 𝙿𝚁𝙾𝙲𝙴𝚂𝚂𝙸𝙽𝙶 𝙿𝙻𝚉 𝚆𝙰𝙸𝚃 🍒: #${txid}`, threadID);
      setTimeout(async () => {
        const fresh = await usersData.get(userID);
        let fData = fresh.data || {};
        fData.wingo = (fData.wingo || 0) + amt;
        fData.depositHistory.push({ id: txid, amt, time: moment().tz("Asia/Dhaka").format("HH:mm") });
        await usersData.set(userID, { data: fData });
        api.sendMessage(`✅ Dep Success: #${txid} ($${amt})`, userID);
      }, (Math.floor(Math.random()*15)+5)*1000);
      return;
    }

    /* ───── 📜 𝗛𝗜𝗦𝗧𝗢𝗥𝗬 ───── */
    if (command === "history") {
      const type = args[1]?.toLowerCase();
      let list = type === "trade" ? user.tradeHistory : (type === "dep" ? user.depositHistory : user.withdrawHistory);
      if (!list || list.length === 0) return api.sendMessage("🔍 𝙽𝙾 𝚁𝙴𝙲𝙾𝚁𝙳𝚂 𝙱𝙱𝙴 🍓!", threadID);
      let msg = `╭━━━━ ${type.toUpperCase()} RECORDS ━━━━╮\n`;
      list.slice(-5).reverse().forEach((item, i) => msg += `  ${i+1}. ID: #${item.txid || item.id} | $${item.amt}\n`);
      msg += `╰━━━━━━━━━━━━━━━━━━━━━╯`;
      return api.sendMessage(msg, threadID);
    }

    /* ───── 📊 DASHBOARD ───── */
    return api.sendMessage(
      `╭━━━━ 𝗤𝗨𝗢𝗧𝗘𝗫 𝗣𝗥𝗢 𝗠𝗘𝗡𝗨 ━━━━╮\n` +
      `  🏦 𝙼𝙰𝙸𝙽 𝙱𝙰𝙻𝙰𝙽𝙲𝙴: $${user.money}\n` +
      `  💳 𝚃𝚁𝙰𝙳𝙴 𝙱𝙰𝙻𝙰𝙽𝙲𝙴: $${user.wingo}\n` +
      `  ━━━━━━━━━━━━━━━━━━━━\n` +
      `  📈 𝚃𝚁𝙰𝙳𝙴: !trade <amt> <up/down> <sec>\n` +
      `  📥 𝙳𝙴𝙿𝙾𝚂𝙸𝚃𝙴: !trade dep <amt>\n` +
      `  📤 𝚆𝙸𝚃𝙷𝙳𝚁𝙰𝚆: !trade wd <amt> me\n` +
      `  🏆 𝙻𝙴𝙰𝙳𝙴𝚁𝙱𝙾𝚁𝙳: !trade lb\n` +
      `  📜 𝙷𝙸𝚂𝚃𝙾𝚁𝚈: !trade history <trade/dep/wd>\n` +
      `  ━━━━━━━━━━━━━━━━━━━━\n` +
      `  "𝑻𝒓𝒂𝒅𝒆 𝒍𝒊𝒌𝒆 𝒂 𝒑𝒓𝒐, 𝑰𝒏𝒗𝒆𝒔𝒕 𝒍𝒊𝒌𝒆 𝒂 𝒌𝒊𝒏𝒈.\n` +
      `   𝑺𝒖𝒄𝒄𝒆𝒔𝒔 𝒊𝒔 a 𝒋𝒐𝒖𝒓𝒏𝒆𝒚, 𝑵𝒐𝒕 𝒂 𝒅𝒆𝒔𝒕𝒊𝒏𝒂𝒕𝒊𝒐𝒏."\n` +
      `  ━━━━━━━━━━━━━━━━━━━━`, threadID);
  }
};