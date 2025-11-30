const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');

module.exports.config = {
  name: "art3",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "𝐁𝐀𝐁𝐘 𝐁𝐎𝐓 𝐓𝐄𝐀𝐌 (Optimized by Maya)",
  description: "Apply AI art style (anime)",
  commandCategory: "editing",
  usages: "reply to an image",
  cooldowns: 5
};

// ⭐ BOT ON-START LOAD MESSAGE ⭐
module.exports.onStart = () => {
  console.log("✅ art3 Command Loaded Successfully!");
};

module.exports.run = async ({ api, event }) => {
  const { messageReply, threadID, messageID } = event;

  if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("❌ অনুগ্রহ করে কোনো একটি ছবির রিপ্লাই দিন।", threadID, messageID);
  }

  const url = messageReply.attachments[0].url;

  const cacheFolder = path.join(__dirname, 'cache');
  const fileName = `artify_${Date.now()}.jpg`;
  const filePath = path.join(cacheFolder, fileName);

  try {
    // ensure cache folder
    fs.ensureDirSync(cacheFolder);

    // download as stream
    const imgStream = await axios.get(url, { responseType: "stream", timeout: 60000 });

    // save local
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      imgStream.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // prepare form
    const form = new FormData();
    form.append("image", fs.createReadStream(filePath));

    // send to api
    const result = await axios.post(
      "https://art-api-97wn.onrender.com/artify?style=anime",
      form,
      {
        headers: form.getHeaders(),
        responseType: "arraybuffer",
        timeout: 120000
      }
    );

    // save ai output
    fs.writeFileSync(filePath, Buffer.from(result.data));

    // send result
    api.sendMessage(
      {
        body: "✅ AI Artify করা হয়েছে!",
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => {
        try { fs.unlinkSync(filePath); } catch (e) {}
      },
      messageID
    );

  } catch (err) {
    console.log("❌ art3 Error:", err);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
    api.sendMessage("❌ কিছু একটা সমস্যা হয়েছে! পরে আবার চেষ্টা করুন।", threadID, messageID);
  }
};
