const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Optimized fancy text function
const fancyText = (text) => {
  const letters = {
    A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆',
    H: '𝐇', I: '𝐈', J: '𝐉', K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍',
    O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓', U: '𝐔',
    V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙',
    a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠',
    h: '𝐡', i: '𝐢', j: '𝐣', k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧',
    o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮',
    v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳'
  };
  return text.split('').map(c => letters[c] || c).join('');
};

const quotes = [
  "I know you wanna ride the wave gotta wait in line but you",
  "Be low key & let em wonder",
  "You notice so much when you quiet",
  "Money is my religion",
  "You don't need nobody else I swear",
  "Say I'm actin' lightskin, I can't take you nowhere",
  "I ain't gotta compete with a single soul",
  "Girl you standin' right there lookin' so amazing",
  "Button start the foreign, oh my God I'm gorgeous",
  "I don't work for the money I make the money work for me",
  "Entry into my circle is more selective than a Rhodes scholar",
  "Mayonnaise colored benz I push miracle whips",
  "Thug girl who fly and talk so nicely",
  "Ironic you been sleepin on the one you been dreaming bout...."
];

function makeIntro() {
  const randomQuotes = quotes
    .sort(() => 0.5 - Math.random())
    .slice(0, 5)
    .map(q => fancyText(q))
    .join("\n\n");

  const intro = `
╔══✦══◇══✦══╗
    🍨 ${fancyText("B O T  I N T R O")} 🍰
╚══✦══◇══✦══╝

${fancyText("NAME")}: 𝐘𝐄𝐀 𝐌𝐈𝐊𝐎 💋
${fancyText("CLASS")}: 𝐘𝐎𝐔𝐑 𝐇𝐄𝐀𝐑𝐓 💞
${fancyText("AGE")}: 𝚄𝙽𝙺𝙽𝙾𝚆𝙴𝙳 𝙲𝚄𝚉 𝙽𝙾𝚃 𝙰 𝙷𝚄𝙼𝙰𝙽 [𝐖𝐈𝐒𝐇 𝐌𝐄 - 𝐃𝐄𝐂𝐄𝐌𝐁𝐄𝐑 28𝐭𝐡 🥺💋]
${fancyText("FROM")}: 𝐑𝐔𝐒𝐒𝐈𝐀 🥵
${fancyText("RELATIONSHIP")}: 𝐖𝐈𝐓𝐇 𝐀𝐘𝐀𝐍𝐎𝐊𝐔𝐉𝐎 💞
${fancyText("YOUR CRUSH ME BBE")}: 𝐔𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐚𝐡 💋
`;

  return `💫 ${fancyText("𝙱𝙱𝙴 𝙸𝚃'𝚂 𝙼𝙴 𝚄𝚁 𝙼𝙸𝙺𝙾")} 💫\n\n${randomQuotes}\n\n${intro}`;
}

module.exports = {
  config: {
    name: "bbyintro",
    version: "1.0.8",
    author: "Maya x AYAN",
    countDown: 5,
    role: 0,
    shortDescription: "Fancy quotes with Alaya intro + picture",
    longDescription: "Fancy quotes with Alaya intro + picture",
    category: "Fun",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, message }) {
    const imgURL = "https://files.catbox.moe/ms2o68.jpeg";
    const cachePath = path.join(__dirname, "cache", "bbyintro.jpg");

    try {
      // ফোল্ডার চেক
      if (!fs.existsSync(path.join(__dirname, "cache"))) {
        fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
      }

      const response = await axios.get(imgURL, { responseType: "arraybuffer" });
      fs.writeFileSync(cachePath, Buffer.from(response.data));

      // GoatBot এ message.reply ব্যবহার করা বেশি নিরাপদ
      return message.reply({
        body: makeIntro(),
        attachment: fs.createReadStream(cachePath)
      }, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      });

    } catch (err) {
      console.error(err);
      return message.reply("🍭 | Couldn't send the image, but here’s the text:\n\n" + makeIntro());
    }
  }
};