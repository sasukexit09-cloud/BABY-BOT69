const axios = require("axios");
const fs = require("fs");

let userSession = {};

module.exports = {
  config: {
    name: "segs",
    version: "2.0",
    author: "AYAN BBE💋 (VIP removed by Maya)",
    role: 0, // সবাই ব্যবহার করতে পারবে
    category: "18+",
    shortDescription: "Search & select HD videos",
    longDescription: "Search, paginate and download HD porn videos (FREE)"
  },

  onStart: async ({ api, event, args }) => {
    const sender = event.senderID;
    const thread = event.threadID;
    const keyword = args.join(" ");

    if (!keyword) {
      return api.sendMessage(
        `❗ KEYWORD দাও\n👉 Example: /segs mia khalifa`,
        thread
      );
    }

    api.sendMessage(
      `🔍 𝗦𝗘𝗔𝗥𝗖𝗛𝗜𝗡𝗚...\nPlease wait...`,
      thread
    );

    try {
      const res = await axios.get(
        `https://azadx69x-segs.onrender.com/api/search?q=${encodeURIComponent(keyword)}`
      );

      const results = res.data.list || [];
      if (!results.length) {
        return api.sendMessage(
          `❌ No result found!`,
          thread
        );
      }

      userSession[sender] = {
        results,
        page: 0,
        perPage: 20,
        expires: Date.now() + 90_000
      };

      sendPage(api, thread, sender);

    } catch (e) {
      console.error(e);
      api.sendMessage(`❌ Search error!`, thread);
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
        `⏳ Time out!\nAbar /segs use করো।`,
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
        return api.sendMessage("❗ First page!", thread);

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
        `⬇️ Downloading...\n🎬 ${item.name}`,
        thread
      );

      try {
        const filePath = __dirname + `/video_${sender}_${Date.now()}.mp4`;

        const video = await axios.get(item.video, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        fs.writeFileSync(filePath, video.data);

        api.sendMessage(
          {
            body: `🎬 ${item.name}\nEnjoy 😈🔥`,
            attachment: fs.createReadStream(filePath)
          },
          thread,
          () => fs.unlinkSync(filePath)
        );

        delete userSession[sender];

      } catch (e) {
        console.error(e);
        api.sendMessage("❌ Video load error!", thread);
      }
    }
  }
};

function sendPage(api, thread, user) {
  const s = userSession[user];
  const start = s.page * s.perPage;
  const end = Math.min(start + s.perPage, s.results.length);

  let msg =
`🔥 HD VIDEO SEARCH 🔥
📄 Page: ${s.page + 1}
🎯 Results: ${start + 1}-${end} / ${s.results.length}

`;

  s.results.slice(start, end).forEach((item, i) => {
    msg += `${i + 1}. ${item.name}\n⏱ ${item.time}\n\n`;
  });

  msg +=
`➡ next | ⬅ prev
🎬 Select: 1 - 20

Made by AYAN 💜`;

  api.sendMessage(msg, thread);
}
