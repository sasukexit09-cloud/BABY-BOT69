const axios = require("axios");

let API_BASE = null;
const baseApiUrl = async () => {
  if (API_BASE) return API_BASE;
  const res = await axios.get(
    "https://raw.githubusercontent.com/ARYAN-AROHI-STORE/A4YA9-A40H1/refs/heads/main/APIRUL.json"
  );
  API_BASE = res.data.api;
  return API_BASE;
};

module.exports.config = {
  name: "manga",
  aliases: [],
  version: "1.8",
  author: "Dipto",
  role: 0,
  category: "media",
  description: {
    en: "Get manga info and read manga chapters (VIP only)"
  },
  countDown: 2,
  guide: {
    en: "{pn} <manga name>"
  }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
  const { senderID, threadID, messageID } = event;

  // ===== VIP CHECK =====
  const userData = await usersData.get(senderID);
  if (!userData || userData.vip !== true) {
    return api.sendMessage(
      "🔒 | **VIP ONLY COMMAND**\n\n🥺 Baby, তুমি VIP না\n✨ আগে VIP নাও তারপর manga use করো 💋",
      threadID,
      messageID
    );
  }
  // =====================

  try {
    const name = args.join(" ");
    if (!name)
      return api.sendMessage(
        "❌ | Please provide a manga name.",
        threadID,
        messageID
      );

    const apiBase = await baseApiUrl();
    const res = await axios.get(
      `${apiBase}/searchManga?search=${encodeURIComponent(name)}`
    );

    const results = res.data;
    if (!results?.length)
      return api.sendMessage(
        "❌ | No manga found.",
        threadID,
        messageID
      );

    let msg = "╭───✦ Available Manga ✦───\n";
    results.forEach((m, i) => {
      msg += `├‣ ${i + 1}. ${m.attributes.title.en}\n`;
    });
    msg += "╰──────────────⧕\nReply with a number.";

    api.sendMessage(msg, threadID, (err, info) => {
      if (err) return;
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        type: "select_manga",
        author: senderID,
        mangas: results.map(m => ({
          id: m.id,
          title: m.attributes.title.en
        }))
      });
    });
  } catch (e) {
    api.sendMessage(`❌ Error: ${e.message}`, threadID);
  }
};

module.exports.onReply = async ({ api, event, Reply, usersData }) => {
  const { senderID, threadID } = event;

  // ===== VIP CHECK (Reply Time) =====
  const userData = await usersData.get(senderID);
  if (!userData || userData.vip !== true) {
    return api.sendMessage(
      "🔒 | VIP only\n✨ Read manga করার জন্য VIP লাগবে 💋",
      threadID
    );
  }
  // =================================

  const apiBase = await baseApiUrl();
  const authorName = await usersData.getName(senderID);

  /* ================= MANGA SELECT ================= */
  if (Reply.type === "select_manga") {
    const index = parseInt(event.body) - 1;
    if (isNaN(index) || index < 0 || index >= Reply.mangas.length)
      return api.sendMessage("❌ | Invalid number.", threadID);

    const manga = Reply.mangas[index];
    api.unsendMessage(Reply.messageID);

    try {
      const res = await axios.get(
        `${apiBase}/getChapter?mangaID=${manga.id}`
      );

      const chapters = res.data.data.sort(
        (a, b) =>
          parseFloat(a.attributes.chapter || 0) -
          parseFloat(b.attributes.chapter || 0)
      );

      let msg = `╭• 📘 ${manga.title}\n│\n`;
      chapters.forEach((c, i) => {
        msg += `├‣ ${i + 1}. Chapter ${c.attributes.chapter} (${c.attributes.pages} pages)\n`;
      });
      msg += "╰──────────────⧕\nReply with chapter number.";

      api.sendMessage(msg, threadID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          type: "select_chapter",
          author: senderID,
          chapters: chapters.map(c => ({
            id: c.id,
            chapter: c.attributes.chapter,
            pages: c.attributes.pages
          }))
        });
      });
    } catch (e) {
      api.sendMessage(`❌ Error: ${e.message}`, threadID);
    }
  }

  /* ================= CHAPTER SELECT ================= */
  else if (Reply.type === "select_chapter") {
    const index = parseInt(event.body) - 1;
    if (isNaN(index) || index < 0 || index >= Reply.chapters.length)
      return api.sendMessage("❌ | Invalid chapter.", threadID);

    const chap = Reply.chapters[index];

    try {
      const res = await axios.get(
        `${apiBase}/getManga?chapterID=${chap.id}`
      );

      await sendPages(api, event, {
        images: res.data,
        chapter: chap,
        pageIndex: 0,
        authorName
      });
    } catch (e) {
      api.sendMessage(`❌ Error: ${e.message}`, threadID);
    }
  }

  /* ================= PAGE VIEW ================= */
  else if (Reply.type === "view_chapter") {
    let page = Reply.pageIndex;

    if (event.body.toLowerCase() === "next") page += 4;
    else if (event.body.toLowerCase() === "prev") page -= 4;
    else if (!isNaN(event.body)) page = parseInt(event.body) - 1;
    else
      return api.sendMessage(
        "Type page number or next/prev.",
        threadID
      );

    if (page < 0 || page >= Reply.images.length)
      return api.sendMessage("❌ | No more pages.", threadID);

    await sendPages(api, event, {
      images: Reply.images,
      chapter: Reply.chapter,
      pageIndex: page,
      authorName
    });
  }
};

/* ================= HELPER ================= */
async function sendPages(api, event, data) {
  const { images, chapter, pageIndex, authorName } = data;

  const files = [];
  for (let i = 0; i < 4 && images[pageIndex + i]; i++) {
    const stream = images[pageIndex + i];
    files.push(stream);
  }

  let msg = `📘 Chapter ${chapter.chapter}\n`;
  msg += files.map((f, idx) => `Page ${pageIndex + idx + 1}: ${f}`).join("\n");
  msg += `\n\nType 'next' or 'prev' or page number to navigate.`;

  const sent = await api.sendMessage(msg, event.threadID);

  global.GoatBot.onReply.set(sent.messageID, {
    type: "view_chapter",
    images,
    chapter,
    pageIndex,
    author: event.senderID
  });
}
