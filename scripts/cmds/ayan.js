module.exports = {
config: {
name: "AYAN",
version: "1.0",
author: "aYan",
countDown: 5,
role: 0,
shortDescription: "no prefix",
longDescription: "no prefix",
category: "no prefix",
},

onStart: async function(){}, 
onChat: async function({ event, message, getLang }) {
if (event.body && event.body.toLowerCase() === "ayan") {
return message.reply({
body: " ──────────◊\n‣ 𝐁𝐨𝐭 & 𝐎𝐰𝐧𝐞𝐫  \n\n‣ 𝐍𝐚𝐦𝐞:AYAN💋👅               ‣ 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞:◦•●♡ʏᴏᴜʀ ʙʙʏ♡●•◦",
attachment: await global.utils.getStreamFromURL("https://files.catbox.moe/qh4864.mp4")
});
}
}
}
