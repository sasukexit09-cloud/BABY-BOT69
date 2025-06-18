const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "out",
    aliases: ["o"],
    version: "1.0",
    author: "Sandy",
    countDown: 5,
    role: 2,
    shortDescription: "bot will leave gc",
    longDescription: "",
    category: "admin",
    guide: {
      vi: "{pn} [tid,blank]",
      en: "{pn} [tid,blank]"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    var id;
    if (!args.join(" ")) {
      id = event.threadID;
    } else {
      id = parseInt(args.join(" "));
    }

    const leaveMessage = 
`✨YOUR BABY✨
━━━━━━━━━━━━━━━━━━
আল্লাহ হাফেজ..!!🌸🫶🏻
খোদা হাফেজ..!!🥱✨
ভালো থাকবেন সুস্থ থাকবেন অন্যকে ভালো রাখবেন..!! 😟
বেঁচে থাকলে পরবর্তী সময় আবার কথা হবে..!! 🙂❤️‍🩹`;

    return api.sendMessage(leaveMessage, id, () => 
      api.removeUserFromGroup(api.getCurrentUserID(), id)
    );
  }
} 
