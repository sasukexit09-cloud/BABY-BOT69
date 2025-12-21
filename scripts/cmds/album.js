const axios = require("axios");
const fs = require("fs");
const path = require("path");

const OWNER_UID = ["61584308632995"]; // নিজের UID বসাও
const PRICE = 100; // Non-VIP users per use cost

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = { 
  config: { 
    name: "album", 
    version: "1.8", 
    role: 0, 
    author: "MahMUD & Maya", 
    category: "media", 
    guide: { 
      en: "{p}{n} [page number]\n{p}{n} add [category] [URL]\n{p}{n} list",
    }, 
  },

  isVIP: async function(senderID, usersData) {
    const data = await usersData.get(senderID);
    return OWNER_UID.includes(senderID) || data?.isVIP === true;
  },

  onStart: async function ({ api, event, args, usersData }) { 
    const senderID = event.senderID;
    const vip = await this.isVIP(senderID, usersData);

    if (!vip) {
      const userData = await usersData.get(senderID);
      const balance = userData?.money || 0;

      if (balance < PRICE) {
        return api.sendMessage(`❌ এই কমান্ড ব্যবহার করতে ${PRICE} balance লাগবে।\n💰 তোমার balance: ${balance}`, event.threadID);
      }

      await usersData.set(senderID, { money: balance - PRICE });
    }

    const apiUrl = await baseApiUrl();
    // ... (অন্যান্য মূল কোড অপরিবর্তিত রাখছি, যেমন add, list, pagination logic)
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const senderID = event.senderID;
    const vip = await this.isVIP(senderID, usersData);

    if (!vip) {
      const userData = await usersData.get(senderID);
      const balance = userData?.money || 0;
      if (balance < PRICE) {
        return api.sendMessage(`❌ এই কমান্ড ব্যবহার করতে ${PRICE} balance লাগবে।\n💰 তোমার balance: ${balance}`, event.threadID);
      }
      await usersData.set(senderID, { money: balance - PRICE });
    }

    // ... (মূল onReply logic অপরিবর্তিত, ভিডিও fetch + send)
  }
};
