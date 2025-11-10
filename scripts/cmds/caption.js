const moment = require("moment-timezone");

module.exports.config = {
  name: "caption",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "random caption",
  commandCategory: "caption",
  usages: "caption",
  cooldowns: 5
};

const tl = [
  "অনেকের নতুন মানুষ হয়েছে তারা ভালো থাকুক আর আমার হঠাৎ মৃত্যু হোক তারা না জানুক🥹😭",
  "ভালো থাকা এখন শুধুমাত্র মিথ্যা হাসির সংজ্ঞা 🙂💔",
  "যত কম বলবে, তত কম কষ্ট পাবে 🙂",
  "একদিন চুপ করে চলে যাবো, কেউ খেয়ালও করবে না 🙂🥀",
  "অতিরিক্ত ভালোবাসা একদিন কষ্ট হয়ে ফিরে আসে 🙂🥀",
  "যাকে ভুলতে চাই, তাকেই বারবার মনে পড়ে 🙂💔",
  "প্রত্যাশা যত কম, দুঃখ তত কম 🙂",
  "মায়া যত বেশি দাও, কষ্ট তত বেশি পাও 🖤",
  "মানুষ শুধু কথা দেয়, সাথে থাকার নয় 🙂💔",
  "কষ্ট পেতে পেতে একদিন শক্ত হয়ে যাবো 🙂🥀"
];

function getRandomCaption() {
  return tl[Math.floor(Math.random() * tl.length)];
}

module.exports.onChat = async function ({ api, event }) {
  const { threadID, messageID, body } = event;
  if (!body) return;
  if (body.trim().toLowerCase() === module.exports.config.name) {
    return api.sendMessage(`🖤 Random Sad Caption 🖤\n\n${getRandomCaption()}`, threadID, messageID);
  }
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID } = event;
  return api.sendMessage(`🖤 Random Sad Caption 🖤\n\n${getRandomCaption()}`, threadID, messageID);
};
