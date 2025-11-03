module.exports.config = {
 name: "art3",
 version: "1.0.0",
 hasPermssion: 0,
 credits: "𝐁𝐀𝐁𝐘 𝐁𝐎𝐓 𝐓𝐄𝐀𝐌",
 description: "Apply AI art style (anime)",
 commandCategory: "editing",
 usages: "reply to an image",
 cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
 const axios = require('axios');
 const fs = require('fs-extra');
 const FormData = require('form-data');
 const path = __dirname + `/cache/artify.jpg`;

 const { messageReply, threadID, messageID } = event;

 if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
 return api.sendMessage("❌ অনুগ্রহ করে কোনো একটি ছবির রিপ্লাই দিন।", threadID, messageID);
 }

 const url = messageReply.attachments[0].url;

 try {
 // ডাউনলোড করে লোকাল সেভ
 const response = await axios.get(url, { responseType: "arraybuffer" });
 fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

 // ফর্ম ডেটা তৈরি করে API তে পাঠানো
 const form = new FormData();
 form.append("image", fs.createReadStream(path));

 const apiRes = await axios.post(
 "https://art-api-97wn.onrender.com/artify?style=anime",
 form,
 { headers: form.getHeaders(), responseType: "arraybuffer" }
 );

 // রেসপন্স সেভ করে পাঠানো
 fs.writeFileSync(path, apiRes.data);

 api.sendMessage({
 body: "✅ AI artify করা হয়েছে!",
 attachment: fs.createReadStream(path)
 }, threadID, () => fs.unlinkSync(path), messageID);

 } catch (err) {
 console.error(err);
 api.sendMessage("❌ কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।", threadID, messageID);
 }
};
