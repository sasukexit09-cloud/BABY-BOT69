module.exports.config = {
  name: "bf",
  version: "7.3.2-fixed",
  hasPermssion: 0,
  credits: "AYAN✨ (fixed by Maya)",
  description: "Get Pair From Mention",
  commandCategory: "img",
  usages: "[@mention]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "jimp": ""
  }
};

const fs = global.nodemodule["fs-extra"];
const path = global.nodemodule["path"];
const axios = global.nodemodule["axios"];
const jimp = global.nodemodule["jimp"];

const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports.onLoad = async () => {
  const { downloadFile } = global.utils;

  const dir = path.resolve(__dirname, "cache", "canvas");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const bgPath = path.join(dir, "arr2.png");
  if (!fs.existsSync(bgPath)) {
    await downloadFile("https://i.imgur.com/iaOiAXe.jpeg", bgPath);
  }
};

async function makeCircle(imgPath) {
  const img = await jimp.read(imgPath);
  img.circle();
  return img;
}

async function makeImage({ one, two }) {
  const dir = path.resolve(__dirname, "cache", "canvas");

  const bg = await jimp.read(path.join(dir, "arr2.png"));
  const outPath = path.join(dir, `bf_${one}_${two}.png`);
  const avt1 = path.join(dir, `avt_${one}.jpg`);
  const avt2 = path.join(dir, `avt_${two}.jpg`);

  const avatar = uid =>
    `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${FB_TOKEN}`;

  const download = async (url, file) => {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    fs.writeFileSync(file, res.data);
  };

  await Promise.all([
    download(avatar(one), avt1),
    download(avatar(two), avt2)
  ]);

  const img1 = await makeCircle(avt1);
  const img2 = await makeCircle(avt2);

  bg.composite(img1.resize(200, 200), 70, 110);
  bg.composite(img2.resize(200, 200), 465, 110);

  await bg.writeAsync(outPath);

  fs.unlinkSync(avt1);
  fs.unlinkSync(avt2);

  return outPath;
}

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions || {});

  if (!mention[0]) {
    return api.sendMessage(
      "⚠️ Please mention 1 person.",
      threadID,
      messageID
    );
  }

  try {
    const imgPath = await makeImage({
      one: senderID,
      two: mention[0]
    });

    api.sendMessage(
      {
        body:
"╔═════❖••° °••❖═════╗\n" +
" 💘 ভালোবাসার সেরা জুটি 💘\n" +
"╚═════❖••° °••❖═════╝\n\n" +
" 👑 এই নে! এখন থেকে শুধু তোরই ❤️\n" +
" 💌 তোর একমাত্র বয়ফ্রেন্ড হাজির 🩷",
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );

  } catch (err) {
    console.error("BF ERROR:", err);
    api.sendMessage(
      "❌ Image generate করতে সমস্যা হয়েছে!",
      threadID,
      messageID
    );
  }
};
