const request = require("request");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "japan",
  version: "1.2.0",
  role: 0,
  author: "rX & Gemini",
  description: "Random Japanese girls profile pictures (Stream Fix)",
  category: "Random-IMG",
  guide: { en: "{pn}" },
  countDown: 5
};

module.exports.onStart = async ({ api, event }) => {
  const { threadID, messageID } = event;

  const links = [
    "https://i.imgur.com/fwUBSqv.jpg", "https://i.imgur.com/Yj6ZHiL.jpg",
    "https://i.imgur.com/WR5uNY8.jpg", "https://i.imgur.com/Wc1GtyQ.jpg",
    "https://i.imgur.com/sXet1Cb.jpg", "https://i.imgur.com/2Z1cT0C.jpg",
    "https://i.imgur.com/UaXhcld.jpg", "https://i.imgur.com/48rV8lP.jpg",
    "https://i.imgur.com/MU5K9yF.jpg", "https://i.imgur.com/QCW4uZ0.jpg",
    "https://i.imgur.com/VjqTxXE.jpg", "https://i.imgur.com/Yw3yZEi.jpg",
    "https://i.imgur.com/3nxnRjX.jpg", "https://i.imgur.com/3wrDJSr.jpg",
    "https://i.imgur.com/g5IZqUB.jpg", "https://i.imgur.com/5SdxqpG.jpg",
    "https://i.imgur.com/MuHr7G8.jpg", "https://i.imgur.com/arX0MGQ.jpg",
    "https://i.imgur.com/6fjoIo9.jpg", "https://i.imgur.com/0zukClm.jpg"
  ];

  // একটি র‍্যান্ডম ইমেজ চুজ করা
  const randomImg = links[Math.floor(Math.random() * links.length)];
  
  // ক্যাশ পাফ ডিফাইন করা
  const cachePath = path.join(__dirname, "cache", `japan_v3.jpg`);

  // ক্যাশ ফোল্ডার না থাকলে তৈরি করবে
  if (!fs.existsSync(path.join(__dirname, "cache"))) {
    fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
  }

  try {
    // ইমেজটি ডাউনলোড করে সেভ করার ফাংশন
    const downloadImage = () => {
      return new Promise((resolve, reject) => {
        request(encodeURI(randomImg))
          .pipe(fs.createWriteStream(cachePath))
          .on("close", resolve)
          .on("error", reject);
      });
    };

    await downloadImage();

    // ইমেজ পাঠানো
    return api.sendMessage({
      body: `🇯🇵 জাপানি গার্ল প্রোফাইল পিকচার\n✨ মোট ছবি: ${links.length}`,
      attachment: fs.createReadStream(cachePath)
    }, threadID, () => {
      // পাঠানোর পর ফাইল রিমুভ করা
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ সার্ভার থেকে ছবি পাওয়া যাচ্ছে না। পরে আবার চেষ্টা করুন!", threadID, messageID);
  }
};