const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const OWNER_ID = "61584308632995";
const COMMAND_FEE = 2000;

module.exports = {
config: {
name: "video2",
version: "3.3.0",
author: "Ayan bbe🍓",
countDown: 5,
role: 0,
shortDescription: "Fast YouTube downloader",
longDescription: "Search 5 results & download selected video",
category: "media",
guide: {
en: "{p}video2 <video name>"
}
},

onStart: async function ({ api, event, args, usersData }) {
const { threadID, messageID, senderID } = event;

const query = args.join(" ");
if (!query)
return api.sendMessage("⚠️ | Usage: {p}video2 <name>", threadID, messageID);

// 💰 Check balance
const userMoney = await usersData.get(senderID, "money") || 0;
if (userMoney < COMMAND_FEE)
return api.sendMessage(
`❌ | You need ${COMMAND_FEE} coins to use this command.`,
threadID,
messageID
);

try {

const searching = await api.sendMessage(
"🔍 Searching... Please wait...",
threadID
);

const res = await axios.get(
`https://betadash-search-download.vercel.app/yt?search=${encodeURIComponent(query)}`
);

await api.unsendMessage(searching.messageID);

if (!res.data || res.data.length === 0)
return api.sendMessage("❌ No results found.", threadID, messageID);

const results = res.data.slice(0, 5);

let msg = "🎬 | Reply with number (1-5)\n━━━━━━━━━━━━━━\n";

results.forEach((v, i) => {
msg += `${i + 1}. ${v.title}\n⏱ ${v.time}\n\n`;
});

const sentMsg = await api.sendMessage(msg, threadID);

global.video2Select = global.video2Select || {};
global.video2Select[sentMsg.messageID] = {
author: senderID,
results
};

} catch (err) {
api.sendMessage("❌ Search failed.", threadID, messageID);
}
},

onReply: async function ({ api, event, usersData }) {

if (!event.messageReply) return;

const data = global.video2Select?.[event.messageReply.messageID];
if (!data) return;

const { threadID, messageID, senderID, body } = event;

if (senderID !== data.author)
return api.sendMessage("⚠️ | Not your search.", threadID, messageID);

const choice = parseInt(body);
if (isNaN(choice) || choice < 1 || choice > 5)
return api.sendMessage("❌ | Choose 1-5 only.", threadID, messageID);

const video = data.results[choice - 1];

try {

// 💰 Safety check again
const userMoney = await usersData.get(senderID, "money") || 0;
if (userMoney < COMMAND_FEE)
return api.sendMessage("❌ | Not enough balance.", threadID, messageID);

// 💸 Cut from user
await usersData.set(senderID, {
money: userMoney - COMMAND_FEE
});

// 👑 Add to owner (silent)
const ownerMoney = await usersData.get(OWNER_ID, "money") || 0;
await usersData.set(OWNER_ID, {
money: ownerMoney + COMMAND_FEE
});

// 🚀 Download
const dl = await axios.get(
`https://yt-api-imran.vercel.app/api?url=${video.url}`
);

const downloadUrl = dl.data?.downloadUrl;
if (!downloadUrl) throw new Error("Download link not found");

const buffer = (
await axios.get(downloadUrl, { responseType: "arraybuffer" })
).data;

const cachePath = path.join(__dirname, "cache");
await fs.ensureDir(cachePath);

const filePath = path.join(cachePath, `video_${Date.now()}.mp4`);
await fs.writeFile(filePath, buffer);

await api.sendMessage(
{
body: `🎬 ${video.title}\n 🍓Bby ei neu tumar music video 🍒`,
attachment: fs.createReadStream(filePath)
},
threadID,
async () => {
if (fs.existsSync(filePath)) await fs.unlink(filePath);
},
messageID
);

delete global.video2Select[event.messageReply.messageID];

} catch (err) {
api.sendMessage("❌ Download failed.", threadID, messageID);
}
}
};