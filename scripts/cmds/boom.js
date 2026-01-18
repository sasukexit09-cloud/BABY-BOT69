module.exports = {
  config: {
    name: "boom",
    version: "1.0.5",
    author: "AYAN ✨",
    countDown: 7,
    role: 2, // Admin mate
    shortDescription: { en: "War in chatbox (Spamming)" },
    category: "wargroup",
    guide: { en: "{pn} @mention or reply" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, mentions, messageReply } = event;
    let targetID;

    // 1. Target ID nakki karvu (Reply athva Mention)
    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      return api.sendMessage("⚠️ Please mention a user or reply to boom!", threadID, messageID);
    }

    // 2. Messages ni list
    const messages = [
      "73R! 83H4N K4 9HUD4 M4RO9 ! G4NDU K4 BACHA 😝😝😝❤️😂😂TERI AMA KI KALI GAND MAROU 😂😂 CONDOMS LGA KY 😂😂😂❤️",
      "777333RRR111 BAAHN KKK111 LLLLAAALLL GGGGAAANNNDDD VVVIICHHH M3RRR444 LLLLOOORRRAAAA 😂😂😂😂",
      "RRRRRRAAAAANNNNNDDDIIIIIII KKKKKKKKKAAAAAAAA BBBBBAAACCCCHHHAAAAA❤️❤️❤️ 😂😂😂",
      "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMAAAAAAADDDDDDEEEEERRRRRRRRRRRRRR CCCCCCHHHHHHOOOOOOOOODDDDDDDD KI OLAD😝😝❤️❤️😂😂😂😂",
      "TTTTTTTTTEEEEERRRRRRIIIIIIIIIIIII BBBBBBBBBBBAAAAAAHHHHHHHAAAAAAAAANNNNNNNNNNNNNNNNNNN KKKKKKKKKAAAAAAAA PPPPPPPPUUUUUUUDDDDAAAAAA MNMMAAAAAARRRRROOOOOUUUUUUUUU 😂😂😂😂🤔🤔😝😝😝😝❤️😂😂😂❤️",
      "BBBBBBBBBBBAAAAAAHHHHHHHAAAAAAAAANNNNNNNNNNNNNNNNNNN 😂😂😂😂CCCCCCHHHHHHOOOOOOOOODDDDDDDD GGGGGGGGGGGGGGGGGAAAAAAAAAAAAAAAAAAAAAAAAAANNNNNNNNNNNNNNNNNNNNNNDDDDDDDDDDDDDDDUUUUUUUUUUUUUU❤️❤️❤️❤️😂😂😂 ❤️",
      "GANG BANG 🫡🫡🫡 TERI AMA KI CHUTHI MAROOOUUUUUU ❤️❤️❤️😂😂😂",
      "TERI AMA KO 100 BAR 🫣🫣🫣 MARU ❤️😂😂😂❤️",
      "HAHAHAHA TERI AMA KI CHUTH MARU ❤️😂😂",
      "GAAND MAROO TERI AMA KI ❤️❤️😂😂",
      "TERI AMA KI CHUTH MAROO ❤️❤️😂😂",
      "GAND MAROO TERI AMA KI ❤️😂😂",
      "TERI AMA KI CHUTH ❤️❤️😂😂",
      "GAAND MAROO TERI AMA KI ❤️😂😂",
      "TERI AMA KI CHUTH ❤️😂😂❤️",
      "TERI AMA KI CHUTH MAROO ❤️❤️😂😂",
      "GAND MAROO TERI AMA KI ❤️❤️😂😂"
      // Tame biju add kari shako cho...
    ];

    const delay = 3000; // 3 seconds no gap

    try {
      api.sendMessage("🔥 Boom started! Target ID: " + targetID, threadID);

      messages.forEach((msg, i) => {
        setTimeout(() => {
          api.sendMessage(msg, threadID);
        }, delay * i);
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ An error occurred!", threadID);
    }
  }
};