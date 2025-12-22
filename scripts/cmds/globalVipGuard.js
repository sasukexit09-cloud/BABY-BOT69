const fs = require("fs");

function loadJSON(path) {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path));
}

module.exports = async function ({ api, event }) {
  const vipCmds = loadJSON("vipCmd.json");
  const vipData = loadJSON("vip.json");

  const cmd = event.commandName;
  if (!vipCmds[cmd]) return;

  const vip = vipData[event.senderID];
  if (!vip) {
    return api.sendMessage(
      "❌ এই কমান্ড শুধু VIP ইউজারের জন্য",
      event.threadID
    );
  }

  if (vip.expiry && Date.now() > vip.expiry) {
    delete vipData[event.senderID];
    fs.writeFileSync("vip.json", JSON.stringify(vipData, null, 2));
    return api.sendMessage(
      "❌ তোমার VIP মেয়াদ শেষ",
      event.threadID
    );
  }
};