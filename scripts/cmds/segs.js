const axios = require("axios");
const fs = require("fs");

// Mock user database
const users = {
  "123456789": { vip: true, balance: 50 }, // senderID : { vip, balance }
  "987654321": { vip: false, balance: 100 }
};

let userSession = {};

module.exports = {
  config: {
    name: "segs",
    version: "1.7",
    author: "AYAN BBE💋",
    role: 2,
    category: "18+",
    shortDescription: "Search & select HD videos (VIP only)",
    longDescription: "Search, paginate and download HD porn videos (requires VIP & balance)"
  },
  
  onStart: async ({ api, event, args }) => {
    const sender = event.senderID;
    const thread = event.threadID;
    const keyword = args.join(" ");

    // VIP চেক
    const user = users[sender];
    if (!user?.vip) {
      return api.sendMessage("❌ এই কমান্ডটি শুধুমাত্র VIP ইউজারদের জন্য!", thread);
    }

    // Balance চেক
    const cost = 10; // 10m balance
    if (user.balance < cost) {
      return api.sendMessage(
        `❌ আপনার ব্যালেন্স পর্যাপ্ত নয়! এই কমান্ডটি ব্যবহার করতে ${cost} balance প্রয়োজন।\n💰 আপনার বর্তমান ব্যালেন্স: ${user.balance}m\n⚡ ব্যালেন্স রিফিল করতে /addbalance <amount> ব্যবহার করুন।`,
        thread
      );
    }

    // Balance কাটুন
    user.balance -= cost;

    api.sendMessage(`💰 আপনার বর্তমান ব্যালেন্স: ${user.balance}m\n🔍 𝗦𝗘𝗔𝗥𝗖𝗛𝗜𝗡𝗚... Please wait...`, thread);

    if (!keyword)
      return api.sendMessage(
        `❗ 𝗞𝗘𝗬𝗪𝗢𝗥𝗗\n👉 Example: /segs mia khalifa`,
        thread
      );

    try {
      const res = await axios.get(
        `https://azadx69x-segs.onrender.com/api/search?q=${encodeURIComponent(keyword)}`
      );

      const results = res.data.list;

      if (!results.length)
        return api.sendMessage(`❌ 𝗡𝗢 𝗥𝗘𝗦𝗨𝗟𝗧\nVideo paowa gelo na!`, thread);
      
      userSession[sender] = {
        results,
        page: 0,
        perPage: 20,
        expires: Date.now() + 90_000
      };

      sendPage(api, thread, sender);

    } catch (e) {
      api.sendMessage(`❌ 𝗘𝗥𝗥𝗢𝗥\nSearch error!`, thread);
    }
  },
  
  onChat: async ({ api, event }) => {
    const sender = event.senderID;
    const thread = event.threadID;
    const msg = event.body.trim().toLowerCase();

    if (!userSession[sender]) return;

    if (Date.now() > userSession[sender].expires) {
      delete userSession[sender];
      return api.sendMessage(
        `⏳ 𝗧𝗜𝗠𝗘 𝗢𝗨𝗧\nAbar /segs use korun.`,
        thread
      );
    }

    const session = userSession[sender];
    
    if (msg === "next") {
      if ((session.page + 1) * session.perPage >= session.results.length)
        return api.sendMessage("❗ Last page!", thread);

      session.page++;
      return sendPage(api, thread, sender);
    }
    
    if (msg === "prev") {
      if (session.page === 0)
        return api.sendMessage("❗ Page 1 e achen!", thread);

      session.page--;
      return sendPage(api, thread, sender);
    }
    
    if (/^\d+$/.test(msg)) {
      const number = parseInt(msg);
      const start = session.page * session.perPage;
      const index = start + (number - 1);

      if (!session.results[index])
        return api.sendMessage("❌ Valid number dao!", thread);

      const item = session.results[index];

      api.sendMessage(
        `╔══ ⬇𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗜𝗡𝗚 ══╗\n🎬 ${item.name}\nPlease wait...\n╚═════════════════╝`,
        thread
      );

      try {
        const filePath = __dirname + `/video_${sender}.mp4`;

        const video = await axios.get(item.video, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        fs.writeFileSync(filePath, video.data);

        api.sendMessage(
          {
            body: `╔══ ✨ 𝗩𝗜𝗗𝗘𝗢 𝗥𝗘𝗔𝗗𝗬 ══╗\n🎬 ${item.name}\nMade by 𝐀𝐳𝐚𝐝𝐱𝟔𝟗𝐱 💜\n💰 আপনার বাকি ব্যালেন্স: ${users[sender].balance}m\n╚════════════════╝`,
            attachment: fs.createReadStream(filePath)
          },
          thread,
          () => fs.unlinkSync(filePath)
        );

        delete userSession[sender];

      } catch (e) {
        api.sendMessage("❌ Video load error!", thread);
      }

      return;
    }

    api.sendMessage("❗ next / prev / number dao.", thread);
  }
};


function sendPage(api, thread, user) {
  const s = userSession[user];
  const start = s.page * s.perPage;
  const end = Math.min(start + s.perPage, s.results.length);

  let msg =
`╔═🔥 𝗛𝗗 𝗩𝗜𝗗𝗘𝗢 𝗦𝗘𝗔𝗥𝗖𝗛 🔥═╗
📄 Page: ${s.page + 1}
🎯 Results: ${start + 1} - ${end} of ${s.results.length}
╚═══════════════════╝\n\n`;

  s.results.slice(start, end).forEach((item, i) => {
    msg +=
`┏━━━━━━━━━━━━━━━━━━━━┓
┃ 🆔 **${i + 1}. ${item.name}**
┃ ⏱ Duration: ${item.time}
┗━━━━━━━━━━━━━━━━━━━━┛\n\n`;
  });

  msg +=
`╔══ 📌 𝗖𝗢𝗡𝗧𝗥𝗢𝗟𝗦 ═╗
➡ Next Page:   next
⬅ Prev Page:   prev
🎬 Select Video: 1 - 20
╚══════════════╝

Made by AYAN 💜🥵`;

  api.sendMessage(msg, thread);
}
