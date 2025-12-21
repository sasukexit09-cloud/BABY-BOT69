const header = `👑 𝗩𝗜𝗣 𝗨𝗦𝗘𝗥𝗦 👑`;
const fs = require("fs");

const vipFilePath = "vip.json";
const pendingFilePath = "pendingVip.json";
const vipCmdFilePath = "vipCmd.json";
const changelogFilePath = "changelog.json";

const ADMIN_UIDS = ["61584308632995"];
const VIP_OPTIONS = {
  1: { price: 100_000, days: 1 },
  2: { price: 250_000, days: 2 },
  3: { price: 420_000, days: 3 },
  4: { price: 540_000, days: 4 },
  5: { price: 650_000, days: 5 },
  6: { price: 700_000, days: 6 },
  7: { price: 890_000, days: 7 },
  15: { price: 500_000_000, days: 15 },
  30: { price: 1_000_000_000, days: 30 },
};

function loadJSON(path) {
  if (!fs.existsSync(path)) fs.writeFileSync(path, "{}");
  try { return JSON.parse(fs.readFileSync(path)); } 
  catch { return {}; }
}

function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "vip",
    version: "7.3",
    author: "AYAN BBE💋",
    role: 0,
    category: "Config",
    guide: {
      en: `
!vip add <uid|reply|mention> → Admin add VIP
!vip rm <uid|reply|mention> → Admin remove VIP
!vip list → Show VIP list
!vip buy → Request VIP (step-by-step form)
!vip pending → Admin view pending requests
!vip approve <number> → Admin approve pending
!vip futures → Show VIP-only commands
!vip cmd <add/remove/list> → Set VIP-only commands
!vip changelog → View changelog`
    }
  },

  onStart: async function({ api, event, args, message, usersData }) {
    if (!args[0]) return;

    let vipData = loadJSON(vipFilePath);
    let pendingData = loadJSON(pendingFilePath);
    let vipCmds = loadJSON(vipCmdFilePath);

    const senderID = event.senderID;
    const sub = args[0];

    const isVIP = (uid) => {
      const vip = vipData[uid];
      if (!vip) return false;
      if (vip.type === "admin") return true;
      if (vip.expiry && Date.now() > vip.expiry) {
        delete vipData[uid];
        saveJSON(vipFilePath, vipData);
        return false;
      }
      return true;
    };

    // ---------------- VIP ADD ----------------
    if ((sub === "add" || sub === "-a") && ADMIN_UIDS.includes(senderID)) {
      let targets = [];
      if (event.type === "message_reply") targets.push(event.messageReply.senderID);
      else if (Object.keys(event.mentions || {}).length) targets = Object.keys(event.mentions);
      else if (args[1]) targets.push(args[1]);
      if (!targets.length) return message.reply(`${header}\nProvide UID / reply / mention to add.`);

      for (const uid of targets) {
        const user = await usersData.get(uid);
        const name = user?.name || "Unknown User";
        vipData[uid] = { type: "admin", name };
        saveJSON(vipFilePath, vipData);
        message.reply(`${header}\n✅ ${name} added to VIP by admin.`);
        api.sendMessage(`${header}\n🎉 You are now VIP!`, uid);
      }
      return;
    }

    // ---------------- VIP REMOVE ----------------
    if ((sub === "rm" || sub === "-r") && ADMIN_UIDS.includes(senderID)) {
      let targets = [];
      if (event.type === "message_reply") targets.push(event.messageReply.senderID);
      else if (Object.keys(event.mentions || {}).length) targets = Object.keys(event.mentions);
      else if (args[1]) targets.push(args[1]);
      if (!targets.length) return message.reply(`${header}\nProvide UID / reply / mention to remove.`);

      for (const uid of targets) {
        if (vipData[uid]) {
          const name = vipData[uid].name;
          delete vipData[uid];
          saveJSON(vipFilePath, vipData);
          message.reply(`${header}\n❌ ${name} removed from VIP.`);
          api.sendMessage(`${header}\n⚠️ You are no longer VIP.`, uid);
        }
      }
      return;
    }

    // ---------------- VIP LIST ----------------
    if (sub === "list") {
      const adminVIP = [], purchasedVIP = [];
      for (const uid of Object.keys(vipData)) {
        const v = vipData[uid];
        if (!isVIP(uid)) continue;
        if (v.type === "admin") adminVIP.push(`• ${v.name} (${uid})`);
        else purchasedVIP.push(`• ${v.name} (${uid}) (Expires: ${new Date(v.expiry).toLocaleString()})`);
      }
      const text = `${header}\n\n🛡 Admin-added VIP:\n${adminVIP.join("\n") || "None"}\n\n💰 Purchased VIP:\n${purchasedVIP.join("\n") || "None"}`;
      return message.reply(text);
    }

    // ---------------- VIP BUY FORM ----------------
    if (sub === "buy") {
      const uid = senderID;
      if (isVIP(uid)) return message.reply(`${header}\nYou are already VIP!`);

      // Step 1: Name / Contact info
      if (!args[1]) return message.reply(`${header}\n📋 Please provide your Name / Contact info:\nExample: !vip buy MyName-Contact`);

      const contactInfo = args[1];

      // Step 2: How many days
      if (!args[2]) return message.reply(`${header}\n⏳ How many days VIP do you want? Options: ${Object.keys(VIP_OPTIONS).join(", ")}\nExample: !vip buy MyName-Contact 3`);

      const days = parseInt(args[2]);
      const option = VIP_OPTIONS[days];
      if (!option) return message.reply(`${header}\n❌ Invalid duration. Available: ${Object.keys(VIP_OPTIONS).join(", ")} days`);

      // Step 3: Short review
      if (!args[3]) return message.reply(`${header}\n✏️ Please give a short review about your experience with the bot.\nExample: !vip buy MyName-Contact 3 "This bot is amazing!"`);

      const review = args.slice(3).join(" ");

      // Add to pending
      const index = Object.keys(pendingData).length + 1;
      pendingData[index] = { uid, contactInfo, days: option.days, price: option.price, review, time: Date.now() };
      saveJSON(pendingFilePath, pendingData);

      message.reply(`${header}\n✅ VIP request submitted for admin approval.`);
      ADMIN_UIDS.forEach(admin => api.sendMessage(`${header}\n📩 New VIP Request:\nName/Contact: ${contactInfo}\nUID: ${uid}\nDays: ${option.days}\nPrice: ${option.price}\nReview: ${review}`, admin));
      return;
    }

    // ---------------- VIP PENDING ----------------
    if (sub === "pending" && ADMIN_UIDS.includes(senderID)) {
      const listText = Object.keys(pendingData).map((k, i) => {
        const req = pendingData[k];
        return `${i + 1}. UID: ${req.uid}, Name: ${req.contactInfo}, Days: ${req.days}, Price: ${req.price}, Review: ${req.review}`;
      }).join("\n");

      return message.reply(listText ? `${header}\n📋 Pending VIP Requests:\n\n${listText}\n\nUse 'vip approve <number>' to approve.` : `${header}\nNo pending requests.`);
    }

    // ---------------- VIP APPROVE ----------------
    if (sub === "approve" && ADMIN_UIDS.includes(senderID)) {
      const number = parseInt(args[1]);
      const keys = Object.keys(pendingData);
      if (isNaN(number) || number < 1 || number > keys.length) return message.reply(`${header}\nInvalid request number.`);
      const key = keys[number - 1];
      const req = pendingData[key];
      const uid = req.uid;

      const userData = await usersData.get(uid);
      if (!userData.money || userData.money < req.price) return message.reply(`${header}\nUser does not have enough balance.`);

      userData.money -= req.price;
      await usersData.set(uid, { money: userData.money });

      vipData[uid] = { type: "purchase", name: req.contactInfo, expiry: Date.now() + req.days*24*60*60*1000 };
      saveJSON(vipFilePath, vipData);

      delete pendingData[key];
      saveJSON(pendingFilePath, pendingData);

      message.reply(`${header}\n✅ ${req.contactInfo} is now VIP for ${req.days} day(s).`);
      api.sendMessage(`${header}\n🎉 Congratulations ${req.contactInfo}, VIP approved!\nRemaining balance: ${userData.money}`, uid);
      return;
    }

    // ---------------- VIP FUTURES ----------------
    if (sub === "futures") {
      const vipOnlyCommands = Object.keys(vipCmds);
      if (!vipOnlyCommands.length) return message.reply(`${header}\nNo VIP-only commands detected.`);
      const listText = vipOnlyCommands.map(cmd => `• ${cmd}`).join("\n");
      return message.reply(`${header}\n🛡 VIP-only commands:\n\n${listText}`);
    }

    // ---------------- VIP CMD MANAGEMENT ----------------
    if (sub === "cmd" && ADMIN_UIDS.includes(senderID)) {
      const action = args[1];
      if (!action) return message.reply(`${header}\nSpecify add/remove/list.`);
      if (action === "add" && args[2]) { vipCmds[args[2]] = true; saveJSON(vipCmdFilePath, vipCmds); return message.reply(`${header}\nCommand '${args[2]}' added to VIP-only list.`); }
      else if (action === "remove" && args[2]) { delete vipCmds[args[2]]; saveJSON(vipCmdFilePath, vipCmds); return message.reply(`${header}\nCommand '${args[2]}' removed from VIP-only list.`); }
      else if (action === "list") return message.reply(`${header}\nVIP-only commands:\n${Object.keys(vipCmds).join("\n") || "None"}`);
      return;
    }

    // ---------------- VIP CMD RESTRICTION ----------------
    if (vipCmds[sub] && !isVIP(senderID)) return message.reply(`${header}\n❌ You need VIP to use this command.`);

    // ---------------- CHANGELOG ----------------
    if (sub === "changelog") {
      const changelogData = loadJSON(changelogFilePath);
      const entries = Object.keys(changelogData).filter(v => parseFloat(v) >= 1.0);
      if (entries.length) message.reply(`${header}\nCurrent Version: ${module.exports.config.version}\nChangelog:\n${entries.map(v => `Version ${v}: ${changelogData[v]}`).join("\n")}`);
      else message.reply(`${header}\nNo changelog entries found.`);
      return;
    }
  }
};
