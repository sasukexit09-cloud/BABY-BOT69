module.exports = {
  config: {
    name: "friends",
    version: "1.0.2",
    author: "ryuko & Gemini",
    countDown: 5,
    role: 3, // শুধুমাত্র বটের মালিক বা অপারেটরের জন্য
    shortDescription: { en: "List friends and unfriend via reply" },
    category: "operator",
    guide: { en: "{pn} [page number]" }
  },

  handleReply: async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    
    // চেক করা হচ্ছে যে কমান্ডদাতা এবং রিপ্লাইদাতা একই ব্যক্তি কি না
    if (parseInt(senderID) !== parseInt(handleReply.author)) return;

    if (handleReply.type === "reply") {
      let msg = "";
      const arrnum = body.split(" ").map(n => parseInt(n)).filter(n => !isNaN(n));
      
      if (arrnum.length === 0) return api.sendMessage("❌ দয়া করে সঠিক নম্বর লিখে রিপ্লাই দিন।", threadID, messageID);

      for (const num of arrnum) {
        const name = handleReply.nameUser[num - 1];
        const uidUser = handleReply.uidUser[num - 1];
        const urlUser = handleReply.urlUser[num - 1];

        if (uidUser) {
          try {
            await api.unfriend(uidUser);
            msg += `✅ নাম: ${name}\n🔗 লিঙ্ক: ${urlUser}\n\n`;
          } catch (e) {
            msg += `❌ নাম: ${name} (আনফ্রেন্ড করতে সমস্যা হয়েছে)\n\n`;
          }
        }
      }

      return api.sendMessage(`সফলভাবে ফ্রেন্ড লিস্ট থেকে ডিলিট করা হয়েছে:\n\n${msg}`, threadID, () => {
        api.unsendMessage(handleReply.messageID);
      }, messageID);
    }
  },

  onStart: async function ({ event, api, args }) {
    const { threadID, messageID, senderID } = event;

    try {
      const dataFriend = await api.getFriendsList();
      const countFr = dataFriend.length;

      if (countFr === 0) return api.sendMessage("বটের কোনো বন্ধু নেই! 🥲", threadID, messageID);

      const listFriend = dataFriend.map(friends => ({
        name: friends.fullName || "No Name",
        uid: friends.userID,
        gender: friends.gender,
        vanity: friends.vanity,
        profileUrl: friends.profileUrl
      }));

      const nameUser = [], urlUser = [], uidUser = [];
      let page = parseInt(args[0]) || 1;
      const limit = 10;
      const numPage = Math.ceil(listFriend.length / limit);
      
      if (page > numPage) page = numPage;
      if (page < 1) page = 1;

      let msg = `📋 আপনার বর্তমানে ${countFr} জন বন্ধু আছে।\n━━━━━━━━━━━━━━\n`;

      for (let i = limit * (page - 1); i < limit * (page - 1) + limit; i++) {
        if (i >= listFriend.length) break;
        const info = listFriend[i];
        msg += `${i + 1}. ${info.name}\n🆔 আইডি: ${info.uid}\n🔗 লিঙ্ক: ${info.profileUrl}\n\n`;
        
        nameUser.push(info.name);
        urlUser.push(info.profileUrl);
        uidUser.push(info.uid);
      }

      msg += `━━━━━━━━━━━━━━\n📖 পাতা: ${page}/${numPage}\n\n💡 আনফ্রেন্ড করতে চাইলে ওই ব্যক্তির নম্বর লিখে রিপ্লাই দিন। একাধিক হলে স্পেস দিন (যেমন: 1 2 5)।`;

      return api.sendMessage(msg, threadID, (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          messageID: info.messageID,
          nameUser,
          urlUser,
          uidUser,
          type: 'reply'
        });
      }, messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage("ফ্রেন্ড লিস্ট আনতে সমস্যা হয়েছে।", threadID, messageID);
    }
  }
};