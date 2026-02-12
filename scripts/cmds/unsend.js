module.exports = {
  config: {
    name: "unsend",
    aliases: ["un", "uns", "u"],
    version: "3.0",
    author: "NTKhang | Fixed",
    countDown: 5,
    role: 0,
    category: "box chat",
    noPrefix: true
  },

  langs: {
    en: {
      syntaxError: "⚠️ Reply to the bot message you want to unsend.",
      notEnoughBalance: "💸 You need 50₮ to use this command."
    }
  },

  async handleUnsend({ event, message, api, usersData, getLang }) {
    const userID = event.senderID;

    if (!event.messageReply ||
        event.messageReply.senderID !== api.getCurrentUserID()) {
      return message.reply(getLang("syntaxError"));
    }

    const userData = await usersData.get(userID);
    const balance = userData.money || 0;

    if (balance < 50) {
      return message.reply(getLang("notEnoughBalance"));
    }

    await usersData.set(userID, {
      money: balance - 50
    });

    await message.unsend(event.messageReply.messageID);

    return message.reply(
      `✅ Message Unsent!\n💸 -50₮\n💰 Remaining: ${balance - 50}₮`
    );
  },

  async onStart(ctx) {
    return this.handleUnsend(ctx);
  },

  async onChat({ event }) {
    const input = event.body?.toLowerCase().trim();
    if (!input) return;

    const triggers = [this.config.name, ...(this.config.aliases || [])];
    if (!triggers.includes(input)) return;

    return this.handleUnsend(arguments[0]);
  }
};