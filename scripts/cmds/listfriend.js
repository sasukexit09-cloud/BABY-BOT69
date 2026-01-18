module.exports.config = {
  name: "listfriend",
  version: "1.1.0",
  role: 2, // Admin only
  author: "—͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 & Gemini",
  description: "বটের ফ্রেন্ড লিস্ট দেখুন এবং রিপ্লাই দিয়ে আনফ্রেন্ড করুন",
  category: "System",
  guide: { en: "{pn} [page number]" },
  countDown: 5
};

module.exports.handleReply = async function ({ api, handleReply, event }) {
  const { threadID, messageID, senderID, body } = event;
  
  // শুধুমাত্র যে কমান্ড দিয়েছে সে রিপ্লাই দিতে পারবে
  if (parseInt(senderID) !== parseInt(handleReply.author)) return;

  if (handleReply.type === "reply") {
    const arrnum = body.split(" ");
    const nums = arrnum.map(n => parseInt(n)).filter(n => !isNaN(n));
    
    let msg = "";
    let count = 0;

    for (const num of nums) {
      const index = num - 1;
      const name = handleReply.nameUser[index];
      const uidUser = handleReply.uidUser[index];

      if (uidUser) {
        await api.unfriend(uidUser);
        msg += `✅ ${name} (ID: ${uidUser})\n`;
        count++;
      }
    }

    if (count > 0) {
      api.sendMessage(`♻️ সফলভাবে ${count} জন বন্ধুকে আনফ্রেন্ড করা হয়েছে:\n\n${msg}`, threadID, () => 
        api.unsendMessage(handleReply.messageID), messageID);
    } else {
      api.sendMessage("⚠ সঠিক নম্বর দিন (১ থেকে ১০ এর মধ্যে)।", threadID, messageID);
    }
  }
};

module.exports.onStart = async function ({ event, api, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    const dataFriend = await api.getFriendsList();
    const countFr = dataFriend.length;

    if (countFr === 0) return api.sendMessage("বটের ফ্রেন্ড লিস্টে কোনো বন্ধু পাওয়া যায়নি।", threadID, messageID);

    let listFriend = dataFriend.map(friend => ({
      name: friend.fullName || "Unnamed",
      uid: friend.userID,
      gender: friend.gender,
      profileUrl: friend.profileUrl
    }));

    const limit = 10;
    const page = parseInt(args[0]) || 1;
    const numPage = Math.ceil(listFriend.length / limit);
    
    if (page > numPage) return api.sendMessage(`⚠ এই পেজটি নেই। মোট পেজ আছে: ${numPage} টি।`, threadID, messageID);

    let msg = `🎭 𝐁𝐎𝐓 𝐅𝐑𝐈𝐄𝐍𝐃 𝐋𝐈𝐒𝐓 (Total: ${countFr}) 🎭\n━━━━━━━━━━━━━━━━━━\n`;
    let nameUser = [], uidUser = [], urlUser = [];

    for (let i = limit * (page - 1); i < limit * (page - 1) + limit; i++) {
      if (i >= listFriend.length) break;
      
      let info = listFriend[i];
      msg += `${i + 1}. ${info.name}\n🙇‍♂️ ID: ${info.uid}\n🌐 Profile: ${info.profileUrl}\n\n`;
      
      nameUser.push(info.name);
      uidUser.push(info.uid);
      urlUser.push(info.profileUrl);
    }

    msg += `━━━━━━━━━━━━━━━━━━\n📖 Page: ${page}/${numPage}\n\n💡 আনফ্রেন্ড করতে ওই ফ্রেন্ডের নম্বরটি রিপ্লাই দিন (একাধিক হলে স্পেস দিয়ে লিখুন, যেমন: 1 3 5)`;

    return api.sendMessage(msg, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        author: senderID,
        messageID: info.messageID,
        nameUser,
        uidUser,
        urlUser,
        type: 'reply'
      });
    }, messageID);

  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ ফ্রেন্ড লিস্ট সংগ্রহ করতে সমস্যা হয়েছে। সম্ভবত ফেসবুকের নতুন আপডেটের কারণে এটি আপনার প্যানেলে কাজ করছে না।", threadID, messageID);
  }
};