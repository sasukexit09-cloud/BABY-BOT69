const axios = require("axios");

module.exports.config = {
  name: "imgur2",
  version: "1.0.5",
  role: 0,
  author: "Shahadat Islam & Gemini",
  description: "Upload image/video to Imgur directly",
  category: "utility",
  guide: { en: "Reply to an image or video with {pn}" },
  countDown: 2
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID, messageReply } = event;

  // ১. চেক করা হচ্ছে মেসেজে রিপ্লাই দেওয়া হয়েছে কি না
  if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage(
      "দয়া করে একটি ছবি বা ভিডিওতে রিপ্লাই দিয়ে এই কমান্ডটি ব্যবহার করুন! ✅",
      threadID,
      messageID
    );
  }

  const links = [];
  api.setMessageReaction("⌛", messageID, () => {}, true);

  // ২. প্রতিটি এটাচমেন্ট লুপ করে আপলোড করা হচ্ছে
  for (const attachment of messageReply.attachments) {
    try {
      // এই এপিআইটি সরাসরি মিডিয়া ফাইলকে ইমগুর লিংকে কনভার্ট করে
      const res = await axios.get(`https://api.vyturex.com/imgur?url=${encodeURIComponent(attachment.url)}`);
      
      // এপিআই রেসপন্স থেকে লিংক নেওয়া
      if (res.data && res.data.link) {
        links.push(res.data.link);
      } else {
        links.push("❌ লিংক পাওয়া যায়নি");
      }
    } catch (e) {
      console.error(e);
      links.push("❌ আপলোড ব্যর্থ হয়েছে");
    }
  }

  // ৩. রেজাল্ট মেসেজ পাঠানো
  const resultMessage = links.length === 1 
    ? `✅ Imgur Link: ${links[0]}` 
    : `✅ Uploaded Links:\n\n${links.map((link, i) => `${i + 1}. ${link}`).join("\n")}`;

  api.setMessageReaction("✅", messageID, () => {}, true);
  return api.sendMessage(resultMessage, threadID, messageID);
};