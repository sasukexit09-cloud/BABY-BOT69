const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "pair",
    version: "token-dp-ultra",
    author: "Tarek Shikdar",
    countDown: 5,
    role: 0,
    shortDescription: "Pair 2 users with profile pictures",
    longDescription: "Pairs you with a random user and shows both profile pictures",
    category: "fun",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, usersData }) {
    const { senderID, threadID } = event;

    // ===== Safe name fetch =====
    const getName = async (uid) => {
      try {
        return await usersData.getName(uid)
          || (await api.getUserInfo(uid))[uid]?.name
          || "💔 Mystery Lover";
      } catch {
        return "💔 Mystery Lover";
      }
    };

    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    const users = threadInfo.participantIDs.filter(
      id => id !== senderID && id !== botID
    );

    if (users.length < 1) {
      return api.sendMessage(
        "😅 Pair করার মতো কেউ নেই!",
        threadID
      );
    }

    const pairedID = users[Math.floor(Math.random() * users.length)];

    const name1 = await getName(senderID);
    const name2 = await getName(pairedID);

    const love = Math.floor(Math.random() * 21) + 80;
    const match = Math.floor(Math.random() * 31) + 70;

    // ===== Token based DP URL =====
    const avatar = (uid) =>
      `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=${FB_TOKEN}`;

    const dir = path.join(__dirname, "tmp");
    const img1 = path.join(dir, `pair_${senderID}.jpg`);
    const img2 = path.join(dir, `pair_${pairedID}.jpg`);

    try {
      fs.ensureDirSync(dir);

      const [a, b] = await Promise.all([
        axios.get(avatar(senderID), {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        }),
        axios.get(avatar(pairedID), {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        })
      ]);

      fs.writeFileSync(img1, a.data);
      fs.writeFileSync(img2, b.data);

      const text =
`💞✨ New Pair Alert ✨💞

👩‍❤️‍👨 ${name1} ❤️ ${name2}

💖 Love: ${love}%
🔗 Match: ${match}%

🌹 Destiny never lies 🌹`;

      const index = text.indexOf(name2);

      api.sendMessage({
        body: text,
        mentions: index !== -1 ? [{
          tag: name2,
          id: pairedID,
          fromIndex: index
        }] : [],
        attachment: [
          fs.createReadStream(img1),
          fs.createReadStream(img2)
        ]
      }, threadID, () => {
        fs.unlinkSync(img1);
        fs.unlinkSync(img2);
      });

    } catch (err) {
      console.error("PAIR ERROR:", err);
      api.sendMessage(
        "😢 Profile picture আনতে সমস্যা হচ্ছে!",
        threadID
      );
    }
  }
};
