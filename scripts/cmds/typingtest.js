module.exports.config = {
  name: "typingtest",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "𝙰𝚈𝙰𝙽",
  description: "Typing animation test (Got bot style, 10 seconds)",
  commandCategory: "system",
  usages: "",
  cooldowns: 5,
};

module.exports.onStart = async function ({ api, event }) {
  const threadID = event.threadID;

  try {
    // Got bot style typing start
    if (api.sendTypingIndicatorV2) {
      await api.sendTypingIndicatorV2(true, threadID);
    }

    // 10 seconds typing feel
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Stop typing
    if (api.sendTypingIndicatorV2) {
      await api.sendTypingIndicatorV2(false, threadID);
    }

    // Final message
    await api.sendMessage(
      "✨ 𝙱𝙰𝙱𝚄 𝚃𝚄𝙼𝙰𝙺𝙴 𝙰𝙼𝙸 𝚁𝙰𝚃𝙴 𝚅𝙰𝙻𝚄𝙿𝙰𝚂𝙸 ✨\n🖤 — 𝚃𝙰𝙺𝙴 𝙱𝙰𝙱𝚈 𝙻𝙾𝚅𝙴 💌",
      threadID
    );

  } catch (err) {
    console.error(err);
    api.sendMessage(
      "❌ Typing indicator error: " + err.message,
      threadID
    );
  }
};
