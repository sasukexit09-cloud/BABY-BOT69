module.exports = {
  config: {
    name: "unsend",
    aliases: ["un", "uns", "unsef", "u"],
    version: "1.2",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    category: "box chat",
    guide: {
      vi: "reply tin nhắn muốn gỡ của bot và gọi lệnh {pn}",
      en: "reply the message you want to unsend and call the command {pn}"
    },
    noPrefix: true
  },

  langs: {
    vi: {
      syntaxError: "Vui lòng reply tin nhắn muốn gỡ của bot",
      notEnoughBalance: "Bạn không có đủ 50₮ để dùng lệnh này"
    },
    en: {
      syntaxError: "Please reply the message you want to unsend",
      notEnoughBalance: "You need 50₮ to use this command"
    }
  },

  // Mock user balance storage (replace with DB in real bot)
  userBalance: {},

  // Check if user has enough balance
  checkBalance: function(userID) {
    if (!this.userBalance[userID]) this.userBalance[userID] = 1000; // Default balance
    return this.userBalance[userID] >= 50;
  },

  // Deduct balance
  deductBalance: function(userID) {
    this.userBalance[userID] -= 50;
  },

  checkReply: function({ event, api, message, getLang }) {
    if (!event.messageReply || event.messageReply.senderID !== api.getCurrentUserID()) {
      message.reply(getLang("syntaxError"));
      return false;
    }
    return true;
  },

  onStart: async function ({ message, event, api, getLang }) {
    const userID = event.senderID;

    if (!this.checkBalance(userID)) {
      return message.reply(getLang("notEnoughBalance"));
    }

    if (!this.checkReply({ event, api, message, getLang })) return;

    this.deductBalance(userID);
    await message.unsend(event.messageReply.messageID);
    message.reply(`50₮ deducted. Remaining balance: ${this.userBalance[userID]}₮`);
  },

  onChat: async function ({ event, message, api, getLang }) {
    const input = event.body?.toLowerCase().trim();
    if (!input) return;

    const triggers = [this.config.name, ...(this.config.aliases || [])];
    if (!triggers.includes(input)) return;

    const userID = event.senderID;
    if (!this.checkBalance(userID)) {
      return message.reply(getLang("notEnoughBalance"));
    }

    if (!this.checkReply({ event, api, message, getLang })) return;

    this.deductBalance(userID);
    await message.unsend(event.messageReply.messageID);
    message.reply(`50₮ deducted. Remaining balance: ${this.userBalance[userID]}₮`);
  }
};
