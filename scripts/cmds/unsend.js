module.exports = {
  config: {
    name: "unsend",
    aliases: ["un", "uns", "unsef", "u"],
    version: "1.1",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "Gỡ tin nhắn của bot",
      en: "Unsend bot's message"
    },
    longDescription: {
      vi: "Gỡ tin nhắn của bot",
      en: "Unsend bot's message"
    },
    category: "box chat",
    guide: {
      vi: "reply tin nhắn muốn gỡ của bot và gọi lệnh {pn}",
      en: "reply the message you want to unsend and call the command {pn}"
    },
    noPrefix: true
  },

  langs: {
    vi: {
      syntaxError: "Vui lòng reply tin nhắn muốn gỡ của bot"
    },
    en: {
      syntaxError: "Please reply the message you want to unsend"
    }
  },

  onStart: async function ({ message, event, api, getLang }) {
    if (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID())
      return message.reply(getLang("syntaxError"));
    message.unsend(event.messageReply.messageID);
  },

  // noPrefix handler
  onChat: async function ({ event, message, api, getLang }) {
    const input = event.body?.toLowerCase().trim();
    const { config } = module.exports;
    const triggers = [config.name, ...(config.aliases || [])];

    if (!triggers.includes(input)) return;

    if (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID())
      return message.reply(getLang("syntaxError"));

    message.unsend(event.messageReply.messageID);
  }
};
