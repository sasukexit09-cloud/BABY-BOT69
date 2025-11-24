const header = `👑 𝗛𝗜𝗠𝗔 𝗩𝗜𝗣 𝗨𝗦𝗘𝗥𝗦 👑`;

const fs = require("fs");

const vipFilePath = "vip.json";
const pendingFilePath = "pendingVip.json";
const vipCmdFilePath = "vipCmd.json";
const changelogFilePath = "changelog.json";

const ADMIN_UIDS = ["61584308632995"];
const VIP_COST = 5000;

function loadJSON(path) {
  try {
    if (!fs.existsSync(path)) fs.writeFileSync(path, "{}");
    return JSON.parse(fs.readFileSync(path));
  } catch (err) {
    console.error(`Error loading ${path}:`, err);
    return {};
  }
}

function saveJSON(path, data) {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error saving ${path}:`, err);
  }
}

module.exports = {
  config: {
    name: "vip",
    version: "6.2",
    author: "TAREK",
    role: 0,
    category: "Config",
    guide: {
      en: `
!vip add <uid|reply|mention> → Admin add VIP
!vip rm <uid|reply|mention> → Admin remove VIP
!vip list → Show VIP list
!vip buy → Request VIP
!vip pending → Admin view pending
!vip approve <number> → Admin approve pending
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

    // ---------------- VIP ADD ----------------
    if ((sub === "add" || sub === "-a")) {
      if (!ADMIN_UIDS.includes(senderID)) {
        return message.reply(`${header}\n❌ Only admin can add/remove VIP.`);
      }

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
    if ((sub === "rm" || sub === "-r")) {
      if (!ADMIN_UIDS.includes(senderID)) {
        return message.reply(`${header}\n❌ Only admin can add/remove VIP.`);
      }

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
      const adminVIP = [];
      const purchasedVIP = [];
      for (const uid of Object.keys(vipData)) {
        const v = vipData[uid];
        if (v.type === "admin") adminVIP.push(`• ${v.name} (${uid})`);
        else purchasedVIP.push(`• ${v.name} (${uid})`);
      }
      let text = `${header}\n\n🛡 Admin-added VIP:\n${adminVIP.join("\n") || "None"}\n\n💰 Purchased VIP:\n${purchasedVIP.join("\n") || "None"}`;
      message.reply(text);
      return;
    }

    // ---------------- VIP BUY ----------------
    if (sub === "buy") {
      const uid = senderID;
      if (vipData[uid]) return message.reply(`${header}\nYou are already VIP!`);
      const user = await usersData.get(uid);
      const name = user?.name || "Unknown";

      const index = Object.keys(pendingData).length + 1;
      pendingData[index] = { uid, name, time: Date.now() };
      saveJSON(pendingFilePath, pendingData);

      message.reply(`${header}\n✅ VIP request sent for admin approval.`);
      ADMIN_UIDS.forEach(admin => api.sendMessage(`${header}\n📩 New VIP Request:\n${name} (${uid})`, admin));
      return;
    }

    // ---------------- VIP PENDING ----------------
    if (sub === "pending" && ADMIN_UIDS.includes(senderID)) {
      const listText = Object.keys(pendingData).map((k, i) => {
        const req = pendingData[k];
        return `${i + 1}. ${req.name} (${req.uid})`;
      }).join("\n");

      message.reply(listText ? `${header}\n📋 Pending VIP Requests:\n\n${listText}\n\nUse 'vip approve <number>' to approve.` : `${header}\nNo pending requests.`);
      return;
    }

    // ---------------- VIP APPROVE ----------------
    if (sub === "approve" && ADMIN_UIDS.includes(senderID)) {
      const number = parseInt(args[1]);
      const keys = Object.keys(pendingData);
      if (isNaN(number) || number < 1 || number > keys.length) return message.reply(`${header}\nInvalid request number.`);
      const key = keys[number - 1];
      const req = pendingData[key];
      const uid = req.uid;
      const name = req.name;

      let userData = await usersData.get(uid);
      if (!userData.money || userData.money < VIP_COST) return message.reply(`${header}\n${name} does not have enough balance.`);
      userData.money -= VIP_COST;
      await usersData.set(uid, { money: userData.money });

      vipData[uid] = { type: "purchase", name };
      saveJSON(vipFilePath, vipData);

      delete pendingData[key];
      saveJSON(pendingFilePath, pendingData);

      message.reply(`${header}\n✅ ${name} is now VIP.`);
      api.sendMessage(`${header}\n🎉 Congratulations ${name}, VIP approved!\nRemaining balance: ${userData.money}`, uid);
      return;
    }

    // ---------------- VIP CMD ----------------
    if (sub === "cmd" && ADMIN_UIDS.includes(senderID)) {
      const action = args[1];
      if (!action) return message.reply(`${header}\nSpecify add/remove/list.`);
      if (action === "add" && args[2]) {
        vipCmds[args[2]] = true;
        saveJSON(vipCmdFilePath, vipCmds);
        return message.reply(`${header}\nCommand '${args[2]}' added to VIP-only list.`);
      } else if (action === "remove" && args[2]) {
        delete vipCmds[args[2]];
        saveJSON(vipCmdFilePath, vipCmds);
        return message.reply(`${header}\nCommand '${args[2]}' removed from VIP-only list.`);
      } else if (action === "list") {
        return message.reply(`${header}\nVIP-only commands:\n${Object.keys(vipCmds).join("\n") || "None"}`);
      }
      return;
    }

    // ---------------- CHANGELOG ----------------
    if (sub === "changelog") {
      const changelogData = loadJSON(changelogFilePath);
      const entries = Object.keys(changelogData).filter(v => parseFloat(v) >= 1.0);
      if (entries.length) {
        message.reply(`${header}\nCurrent Version: ${module.exports.config.version}\nChangelog:\n${entries.map(v => `Version ${v}: ${changelogData[v]}`).join("\n")}`);
      } else message.reply(`${header}\nNo changelog entries found.`);
      return;
    }

    // ---------------- VIP CMD RESTRICTION ----------------
    if (vipCmds[sub] && !vipData[senderID]) {
      return message.reply(`${header}\n❌ You need VIP to use this command.`);
    }
  }
};
