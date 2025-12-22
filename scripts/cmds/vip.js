const fs = require("fs");

const header = `👑 𝗩𝗜𝗣 𝗨𝗦𝗘𝗥𝗦 👑`;

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
  30: { price: 1_000_000_000, days: 30 }
};

function loadJSON(path) {
  if (!fs.existsSync(path)) fs.writeFileSync(path, "{}");
  try {
    return JSON.parse(fs.readFileSync(path));
  } catch {
    return {};
  }
}

function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function cleanExpiredVIP(vipData) {
  let changed = false;
  for (const uid in vipData) {
    const v = vipData[uid];
    if (v.expiry && Date.now() > v.expiry) {
      delete vipData[uid];
      changed = true;
    }
  }
  if (changed) saveJSON(vipFilePath, vipData);
}

function isVIP(uid, vipData) {
  const vip = vipData[uid];
  if (!vip) return false;
  if (vip.type === "admin") return true;
  if (vip.expiry && Date.now() > vip.expiry) return false;
  return true;
}

module.exports = {
  config: {
    name: "vip",
    version: "8.0",
    author: "AYAN BBE💋 (Fixed by Maya)",
    role: 0,
    category: "Config"
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const senderID = event.senderID;
    const sub = args[0];

    let vipData = loadJSON(vipFilePath);
    let pendingData = loadJSON(pendingFilePath);
    let vipCmds = loadJSON(vipCmdFilePath);

    cleanExpiredVIP(vipData);

    // ================= ADD VIP =================
    if (sub === "add" && ADMIN_UIDS.includes(senderID)) {
      let targets = [];

      if (event.type === "message_reply")
        targets.push(event.messageReply.senderID);
      else if (Object.keys(event.mentions || {}).length)
        targets = Object.keys(event.mentions);
      else if (args[1])
        targets.push(args[1]);

      if (!targets.length)
        return message.reply(`${header}\nUID / Reply / Mention দাও`);

      for (const uid of targets) {
        const user = await usersData.get(uid);
        vipData[uid] = {
          type: "admin",
          name: user?.name || "Unknown"
        };
        api.sendMessage(`${header}\n🎉 তুমি এখন VIP`, uid);
      }

      saveJSON(vipFilePath, vipData);
      return message.reply(`${header}\n✅ VIP Added`);
    }

    // ================= REMOVE VIP =================
    if (sub === "rm" && ADMIN_UIDS.includes(senderID)) {
      const uid = args[1];
      if (!uid || !vipData[uid])
        return message.reply(`${header}\nInvalid UID`);

      delete vipData[uid];
      saveJSON(vipFilePath, vipData);
      api.sendMessage(`${header}\n❌ VIP Removed`, uid);
      return message.reply(`${header}\nRemoved successfully`);
    }

    // ================= VIP LIST =================
    if (sub === "list") {
      const list = Object.entries(vipData)
        .map(([uid, v]) => {
          if (v.type === "admin") return `🛡 ${v.name} (${uid})`;
          return `💰 ${v.name} (${uid}) → ${new Date(v.expiry).toLocaleString()}`;
        })
        .join("\n");

      return message.reply(`${header}\n\n${list || "No VIP Found"}`);
    }

    // ================= VIP BUY =================
    if (sub === "buy") {
      if (isVIP(senderID, vipData))
        return message.reply(`${header}\nতুমি আগেই VIP`);

      const contact = args[1];
      const days = parseInt(args[2]);
      const review = args.slice(3).join(" ");

      if (!contact || !days || !review)
        return message.reply(
          `${header}\nFormat:\n!vip buy Name-Contact <days> <review>`
        );

      if (!VIP_OPTIONS[days])
        return message.reply(`${header}\nInvalid days`);

      const key = Date.now().toString();

      pendingData[key] = {
        uid: senderID,
        contact,
        days,
        price: VIP_OPTIONS[days].price,
        review,
        time: Date.now()
      };

      saveJSON(pendingFilePath, pendingData);

      ADMIN_UIDS.forEach(a =>
        api.sendMessage(
          `${header}\n📩 New VIP Request\nUID: ${senderID}\nDays: ${days}\nPrice: ${VIP_OPTIONS[days].price}\nReview: ${review}`,
          a
        )
      );

      return message.reply(`${header}\n✅ Request sent for approval`);
    }

    // ================= VIP APPROVE =================
    if (sub === "approve" && ADMIN_UIDS.includes(senderID)) {
      const index = parseInt(args[1]) - 1;
      const keys = Object.keys(pendingData).sort();

      if (!keys[index])
        return message.reply(`${header}\nInvalid number`);

      const req = pendingData[keys[index]];
      const userData = await usersData.get(req.uid);

      if (userData.money < req.price)
        return message.reply(`${header}\nUser has insufficient balance`);

      await usersData.set(req.uid, {
        money: userData.money - req.price
      });

      vipData[req.uid] = {
        type: "purchase",
        name: req.contact,
        expiry: Date.now() + req.days * 86400000
      };

      delete pendingData[keys[index]];

      saveJSON(vipFilePath, vipData);
      saveJSON(pendingFilePath, pendingData);

      api.sendMessage(`${header}\n🎉 VIP Approved`, req.uid);
      return message.reply(`${header}\nVIP Activated`);
    }

    // ================= VIP CMD MANAGE =================
    if (sub === "cmd" && ADMIN_UIDS.includes(senderID)) {
      const action = args[1];
      const cmd = args[2];

      if (action === "add") vipCmds[cmd] = true;
      if (action === "remove") delete vipCmds[cmd];

      saveJSON(vipCmdFilePath, vipCmds);
      return message.reply(`${header}\nUpdated`);
    }

    // ================= VIP FUTURES =================
    if (sub === "futures") {
      return message.reply(
        `${header}\n${Object.keys(vipCmds).join("\n") || "None"}`
      );
    }
  }
};
