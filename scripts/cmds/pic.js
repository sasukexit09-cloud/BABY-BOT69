module.exports.config = {
 name: "pic",
 version: "1.1.0",
 hasPermssion: 0,
 credits: "Shaon Ahmed",
 description: "Image search (VIP only)",
 commandCategory: "Search",
 usages: "[Text]",
 cooldowns: 0,
};

module.exports.run = async function({ api, event, args, usersData }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  
  const senderID = event.senderID;
  const userData = await usersData.get(senderID);

  // VIP check
  if (!userData?.vip) {
    return api.sendMessage(
      "🔒 | **VIP ONLY**\n🥺 Baby, তুমি VIP না। আগে VIP নাও তারপর এই command use করো 💋",
      event.threadID,
      event.messageID
    );
  }

  const keySearch = args.join(" ");
  if(!keySearch.includes("-")) 
    return api.sendMessage(
      'Please enter in the format, example: pic mia khalifa-10\n(ইচ্ছে মতো কতগুলো ছবি চাও সেটা নির্ধারণ করবে)\ncreate by ─꯭─⃝𝗕𝗔𝗕𝗬 𝗕𝗢𝗧',
      event.threadID,
      event.messageID
    );

  try {
    const keySearchs = keySearch.substr(0, keySearch.indexOf('-')).trim();
    const numberSearch = Math.min(parseInt(keySearch.split("-").pop()), 20) || 6;

    const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
    const Shaon = apis.data.noobs;
    const res = await axios.get(`${Shaon}/pinterest?search=${encodeURIComponent(keySearchs)}`);
    const data = res.data.data;

    const imgData = [];
    for (let i = 0; i < numberSearch && i < data.length; i++) {
      const path = __dirname + `/cache/${i + 1}.jpg`;
      const getDown = (await axios.get(`${data[i]}`, { responseType: 'arraybuffer' })).data;
      fs.writeFileSync(path, Buffer.from(getDown, 'utf-8'));
      imgData.push(fs.createReadStream(path));
    }

    await api.sendMessage({
      attachment: imgData,
      body: `${numberSearch} Searching 🔎 results for you. Your keyword: ${keySearchs}`
    }, event.threadID, event.messageID);

    // Cleanup
    for (let i = 0; i < numberSearch; i++) {
      const filePath = __dirname + `/cache/${i + 1}.jpg`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

  } catch (err) {
    console.error(err);
    api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID);
  }
};
