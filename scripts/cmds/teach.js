const axios = require("axios");

// rX Api Author rX Abdullah
const GITHUB_API_URL = "https://raw.githubusercontent.com/rummmmna21/rx-api/main/baseApiUrl.json";
let mentionApiUrl = "";

// ===== Fetch mentionapi URL from GitHub =====
async function fetchMentionAPI() {
  try {
    const res = await axios.get(GITHUB_API_URL);
    mentionApiUrl = res.data?.mentionapi || "";
  } catch (err) {
    mentionApiUrl = "";
    console.error("❌ Could not fetch mentionapi URL:", err.message);
  }
}

module.exports = {
  config: {
    name: "teach",
    version: "6.0.0",
    author: "rX Abdullah & Gemini",
    countDown: 0,
    role: 0,
    shortDescription: { en: "Teach, reply & delete system via mentionapi" },
    longDescription: { en: "Dynamic teaching system using external API with multiple replies support." },
    category: "noprefix",
    guide: { en: "!teach <trigger> - <reply>\n!delteach <trigger>\n!teach list\n!teach msg <trigger>" }
  },

  // ===== Reply system =====
  onChat: async function ({ api, event, usersData }) {
    if (!event.body || event.body.startsWith("!")) return;
    const text = event.body.trim();

    await fetchMentionAPI();
    if (!mentionApiUrl) return;

    try {
      const res = await axios.get(`${mentionApiUrl}/reply/${encodeURIComponent(text)}`);
      const replies = Array.isArray(res.data?.reply)
        ? res.data.reply
        : (res.data?.reply ? [res.data.reply] : []);

      if (replies.length > 0) {
        const userData = await usersData.get(event.senderID);
        const name = userData.name || "User";
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        const messageBody = `@${name} ${randomReply}`;
        return api.sendMessage({
          body: messageBody,
          mentions: [{
            tag: `@${name}`,
            id: event.senderID
          }]
        }, event.threadID, event.messageID);
      }
    } catch (_) { }
  },

  // ===== Teach / Delete / List =====
  onStart: async function ({ api, event, args, usersData }) {

    const { threadID, messageID, body, senderID } = event;
    const content = args.join(" ").trim();

    await fetchMentionAPI();
    if (!mentionApiUrl)
      return api.sendMessage("❌ mentionapi not available at the moment.", threadID, messageID);

    // --- !teach ---
    if (body.startsWith("!teach")) {

      const subCmd = args[0]?.toLowerCase();

      // list
      if (subCmd === "list") {
        try {
          const res = await axios.get(`${mentionApiUrl}/list`);
          if (res.data?.triggers?.length) {
            const listMsg = res.data.triggers
              .map((t, i) => `${i + 1}. ${t.trigger} (${t.replies.length} replies)`)
              .join("\n");
            return api.sendMessage(`📚 Trigger List:\n${listMsg}`, threadID, messageID);
          }
          return api.sendMessage("⚠ No triggers found in database.", threadID, messageID);
        } catch (err) {
          return api.sendMessage(`❌ API error: ${err.message}`, threadID, messageID);
        }
      }

      // msg
      if (subCmd === "msg" && args[1]) {
        const trigger = args.slice(1).join(" ").trim();
        try {
          const res = await axios.get(`${mentionApiUrl}/replies/${encodeURIComponent(trigger)}`);
          if (res.data?.replies?.length) {
            const msgList = res.data.replies.map((r, i) => `${i + 1}. ${r}`).join("\n");
            return api.sendMessage(`📝 Replies for "${trigger}":\n${msgList}`, threadID, messageID);
          }
          return api.sendMessage(`⚠ No replies found for "${trigger}"`, threadID, messageID);
        } catch (err) {
          return api.sendMessage(`❌ API error: ${err.message}`, threadID, messageID);
        }
      }

      // ===== NORMAL TEACH =====
      const parts = content.split(" - ");
      if (parts.length < 2)
        return api.sendMessage("❌ Format: !teach <trigger> - <reply>", threadID, messageID);

      const trigger = parts[0].trim();
      const reply = parts[1].trim();

      try {

        const res = await axios.post(`${mentionApiUrl}/teach`, { trigger, reply });

        // ===== ONLY ADD THIS REWARD SYSTEM =====
        const reward = 100;

        const userData = await usersData.get(senderID);
        const balance = userData.money || 0;
        const newBalance = balance + reward;

        await usersData.set(senderID, {
          money: newBalance
        });

        return api.sendMessage(
          `${res.data?.message || `✅ Saved: "${trigger}"`}
💰 Balance Added +${reward}
💳 Your Balance: ${newBalance}`,
          threadID,
          messageID
        );

      } catch (err) {
        return api.sendMessage(`❌ API error: ${err.response?.data?.message || err.message}`, threadID, messageID);
      }
    }

    // --- !delteach ---
    if (body.startsWith("!delteach")) {
      if (!content)
        return api.sendMessage("❌ Please provide a trigger to delete.", threadID, messageID);
      try {
        const res = await axios.delete(`${mentionApiUrl}/delete/${encodeURIComponent(content)}`);
        return api.sendMessage(res.data?.message || `🗑 Deleted: "${content}"`, threadID, messageID);
      } catch (err) {
        return api.sendMessage(`❌ API error: ${err.response?.data?.message || err.message}`, threadID, messageID);
      }
    }

  }
};