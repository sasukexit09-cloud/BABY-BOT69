const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "attitude",
    version: "1.0.2",
    author: "𝐀𝐘𝐀𝐍 𝐀𝐇𝐌𝐄𝐃𝐙 & Gemini",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Send random attitude video"
    },
    longDescription: {
      en: "Sends a random attitude video from a large collection of Drive links."
    },
    category: "media",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, message }) {
    const { threadID, messageID } = event;

    // র‍্যান্ডম মেসেজ
    const messages = [
      "𝐀𝐓𝐓𝐈𝐓𝐔𝐃𝐄 𝐕𝐈𝐃𝐄𝐎 𝐁𝐘 😇\n\n𝗬𝗼𝘂𝗥 𝗙𝗮𝘃𝗼𝘂𝗿𝗶𝘁𝗲 𝐀𝐘𝐀𝐍 🥺💋"
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    // গুগল ড্রাইভ লিঙ্কগুলো (আপনার দেওয়া সব লিঙ্ক এখানে ব্যবহার করা হয়েছে)
    const links = [
      "https://drive.google.com/uc?id=11dUXILgge35GyV9ilD_JmzLiL7yq5WMc",
      "https://drive.google.com/uc?id=11Wr0yQ3QVG1BucbdlANkSo5vE-a___Sn",
      "https://drive.google.com/uc?id=10e1TdrCvj0w2GIBrczbQYUFvb5HddTaW",
      "https://drive.google.com/uc?id=114eZDQU1xbBa2BKrfaboA8tQlJi2fWcS",
      "https://drive.google.com/uc?id=11x0wO9uv9foBrq0B585QEVTk1h0Ci6L_",
      "https://drive.google.com/uc?id=11PXirNeOGwoJblFBxp5M9DFYaGVDlyzT",
      "https://drive.google.com/uc?id=10qGgG0YdBksgEp1k9fCAsv46PrWfUCSm",
      "https://drive.google.com/uc?id=11f2yNWaoLNVORhsuwiQto47oLSqEFmyB",
      "https://drive.google.com/uc?id=10hxxvZ3zwKqmwxvZFg1YkIsEcI2x0d_a",
      "https://drive.google.com/uc?id=158uOCkcLSgn0yAmb9A3GxNBuwhQ6whJl",
      "https://drive.google.com/uc?id=1-0nXpw6ch9JTDRcSrN5bdsXzh67lyEDe",
      "https://drive.google.com/uc?id=1-LC1zOtGFf2Toa0zfTUN9Y8xC-CQloHp",
      "https://drive.google.com/uc?id=13AMbqn7jai43XgbNADQ8nqW7tieDY4fa",
      "https://drive.google.com/uc?id=10C_AagqYOXSp67gkPpwXOdhIXhSosf_O",
      "https://drive.google.com/uc?id=13068I_ImTH0RQkWHgxGddKMzC0qMirS3",
      "https://drive.google.com/uc?id=10CvsLzpZGbTyGbf9ysMWQHe4rwmC1yw3",
      "https://drive.google.com/uc?id=14dqAKDGlPsee-85XvJTld_Jcx6P7mNaI",
      "https://drive.google.com/uc?id=15BmVYod3VW0zePhdNGD3-RpPoQyFI65U",
      "https://drive.google.com/uc?id=14-ymwZdWOKj89pWtA0MiLGN7Eh2xmHaG",
      "https://drive.google.com/uc?id=1-y_vYnJYSPe2gMsPfZQjmjOvhkyVw35R",
      "https://drive.google.com/uc?id=14oBehghDvtnmJL3wNvN0Kc6YGzJt2iQJ",
      "https://drive.google.com/uc?id=13pTcxmag7B893dWzfe7OavvayD7OYiRa",
      "https://drive.google.com/uc?id=1-6mtt_fnc9czRRGsRqCqcURBZQUzczBy",
      "https://drive.google.com/uc?id=13xMtvrgt__qUUQ-U9PKGyUlq88x1CIPZ",
      "https://drive.google.com/uc?id=14OMrLCa7ef1jH7I39fouKG4lxwbd4K0b",
      "https://drive.google.com/uc?id=14HaSbb4fSHfUhUgKfNWJc66gNmqYgmPW",
      "https://drive.google.com/uc?id=1-E1mcGTX6_RCc5vEXOsDV2ODC059o6bF",
      "https://drive.google.com/uc?id=14Szrzz4CL3BBN1oQrH04cQ1zM1sNhx7s",
      "https://drive.google.com/uc?id=13UmjKL6oKSbDYJbOKr6qGfqJQgUoC-qa",
      "https://drive.google.com/uc?id=10BIFhf82pTFOq0Z1v4b-FFsPr877zsLo",
      "https://drive.google.com/uc?id=1-hHkePC6ukBhPTcaTKFlaJ5d5-aREthq",
      "https://drive.google.com/uc?id=1-bgjrQn6gfM7QOF-tAsu5t05KLwqK4_R",
      "https://drive.google.com/uc?id=14FeUarN4GoWwPQuv9ef3zdpAOu0p1PNi",
      "https://drive.google.com/uc?id=15C7IXIXsXwyC0Kj_CVsx-PHOuatPvjnx",
      "https://drive.google.com/uc?id=13W2XS8AxEcjKAX_MRD-rh4Sp00t_8XKq",
      "https://drive.google.com/uc?id=1-6Qh6CIsQ-Yhrb2sppnN4F7qhJ1tk3rO",
      "https://drive.google.com/uc?id=1-aI8DTnd2t1bmnyDAzq4VKb8Me0JaCPn",
      "https://drive.google.com/uc?id=1-884CM0iZpTAy6cSVA9MnLtfNHhILfov",
      "https://drive.google.com/uc?id=13McQhw-0wzraruEMKg7GxS8gudjLRA7c",
      "https://drive.google.com/uc?id=13kMv4G1hs0COispW70439SvAGKqv4XuA",
      "https://drive.google.com/uc?id=141f7fm8eUFvQl7C5XAk9-csm3PnaXaGT",
      "https://drive.google.com/uc?id=10R60lJzy8TfRGi48QJbTl68JdMTg21MU",
      "https://drive.google.com/uc?id=10V3eeUBXnW5N4UwtafHzgOjbnzWithX-",
      "https://drive.google.com/uc?id=11qS8wAi3HORxKQ4kZnwRlo-6HfrkS8tC",
      "https://drive.google.com/uc?id=119JOKHCHSDS9Hyuzrb586kxMQ4cbJPpx",
      "https://drive.google.com/uc?id=11-nUAWil79-wOLDtP-KwrlGF9xEGF6uh",
      "https://drive.google.com/uc?id=11G7osUuxilHaP8t4hGDVIQuH1iW9WKkw",
      "https://drive.google.com/uc?id=10a8nyCgJKN49ZBD1PxA1x2ZR6f-46oxR",
      "https://drive.google.com/uc?id=10z2V4bgJO23c5Nyc_-1Z4gDgmA4ZKXgk",
      "https://drive.google.com/uc?id=10fQP-HgzGTeSAhTRalFoBDi7cAoKrDO6",
      "https://drive.google.com/uc?id=11Y3RhXhlFjuc3hAH6haqw5u82Uz1j1rU",
      "https://drive.google.com/uc?id=12-YteljsOqh__Vcy7DCd1FrgZxhKjKVf",
      "https://drive.google.com/uc?id=11tllUwvnX_4W-sVq-QqYeaIpoF_cc9pJ",
      "https://drive.google.com/uc?id=119Da1fFnWTbDX4wCI0FUYlsyMaMjalXo",
      "https://drive.google.com/uc?id=144UKwffDum2KPi3wWNo_ArpdK-imnDOj"
    ];

    const videoUrl = links[Math.floor(Math.random() * links.length)];
    const cacheDir = path.join(__dirname, "cache");
    const videoPath = path.join(cacheDir, `attitude_${messageID}.mp4`);

    try {
      // ক্যাশ ফোল্ডার না থাকলে তৈরি করা
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      message.reply("⏳ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭, 𝐬𝐞𝐧𝐝𝐢𝐧𝐠 𝐚𝐭𝐭𝐢𝐭𝐮𝐝𝐞 𝐯𝐢𝐝𝐞𝐨...");

      const res = await axios.get(videoUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(videoPath, Buffer.from(res.data));

      return api.sendMessage({
        body: randomMsg,
        attachment: fs.createReadStream(videoPath)
      }, threadID, () => {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return message.reply("❌ ভিডিওটি পাঠাতে সমস্যা হয়েছে। ড্রাইভ লিঙ্কটি হয়তো কাজ করছে না।");
    }
  }
};