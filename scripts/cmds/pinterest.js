const axios = require("axios");
const path = require("path");
const fs = require("fs");

module.exports = {
 config: {
   name: "pinterest",
   aliases: ["pin"],
   version: "1.2",
   author: "ArYAN | Maya",
   role: 0,
   countDown: 20,
   longDescription: {
     en: "Search Pinterest images (VIP only, free for VIP)"
   },
   category: "media",
   guide: {
     en: "{pn} <search query> - <number of images>\nExample: {pn} cat - 10"
   }
 },

 onStart: async function ({ api, event, args, usersData }) {
   const senderID = event.senderID;
   const userData = await usersData.get(senderID);

   // VIP CHECK
   if (!userData?.vip) {
     return api.sendMessage(
       "🔒 | **VIP ONLY**\n\n🥺 Baby, তুমি VIP না। আগে VIP নাও তারপর এই command use করো 💋",
       event.threadID,
       event.messageID
     );
   }

   // ==== START ORIGINAL CODE ====
   try {
     const keySearch = args.join(" ");
     if (!keySearch.includes("-")) {
       return api.sendMessage(
         `Please enter the search query and number of images\n\nExample:\n{p}pin cat - 10.`,
         event.threadID,
         event.messageID
       );
     }

     const keySearchs = keySearch.substr(0, keySearch.indexOf('-')).trim();
     let numberSearch = parseInt(keySearch.split("-").pop()) || 6;
     if (numberSearch > 20) numberSearch = 20;

     const apiUrl = `https://aryan-error-api.onrender.com/pinterest?search=${encodeURIComponent(keySearchs)}&count=${numberSearch}`;
     const res = await axios.get(apiUrl);
     const data = res.data.data;
     const imgData = [];

     const cacheDir = path.join(__dirname, "cache");
     if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

     for (let i = 0; i < Math.min(numberSearch, data.length); i++) {
       try {
         const imgResponse = await axios.get(data[i], {
           responseType: "arraybuffer",
           headers: {
             'User-Agent': 'Mozilla/5.0'
           }
         });
         const imgPath = path.join(cacheDir, `${i + 1}.jpg`);
         await fs.promises.writeFile(imgPath, imgResponse.data, 'binary');
         imgData.push(fs.createReadStream(imgPath));
       } catch (error) {
         console.error(`Error downloading image ${data[i]}:`, error.message);
       }
     }

     await api.sendMessage({
       body: `✨ Pinterest images (VIP free)`,
       attachment: imgData,
     }, event.threadID, event.messageID);

     if (fs.existsSync(cacheDir)) await fs.promises.rm(cacheDir, { recursive: true });
   } catch (error) {
     console.error(error);
     return api.sendMessage(`An error occurred: ${error.message}`, event.threadID, event.messageID);
   }
 }
};
