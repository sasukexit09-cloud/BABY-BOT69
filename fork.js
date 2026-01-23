module.exports = {
  config: {
    name: "fork",
    aliases: [],
    version: "1.7",
    author: "MahMUD",
    countDown: 0,
    role: 0,
    category: "Bot make",
    guide: {
      en: "{pn} - Get the GitHub fork link and tutorial video."
    }
  },

  onStart: async function ({ message, api, event }) {
    const _0x2f = (function () {
      const _0xarr = [
        'YXV0aG9y', 
        'Y29uZmln', 
        'ZXhwb3J0cw==',
        'c2VuZE1lc3NhZ2U=',
        'WW91IGFyZSBub3QgYXV0aG9yaXplZCB0byBjaGFuZ2UgdGhlIGF1dGhvciBuYW1lLg==',
        'aHR0cHM6Ly9naXRodWIuY29tL21haG11ZHg3L2hpbmF0YS1iYWJ5LXYy', 
        'aHR0cHM6Ly95b3V0dS5iZS96SnNlbVhMYVJiWT9zaT04Ty1PLW5TWGdRbHNOdm5V',
        '4pyoIHwgRm9yayB0aGlzIHByb2plY3QgaGVyZToKCg==',
        'CgrigKIgQm90IG1ha2UgdHV0b3JpYWwgdmlkZW86Cg==', 
        'cmVwbHk=' 
      ];
      return function (_0xi) {
        return Buffer.from(_0xarr[_0xi], 'base64').toString();
      };
    })();

    const _0xauth = String.fromCharCode(77, 97, 104, 77, 85, 68);
    if (this.config.author !== _0xauth) {
      return api[_0x2f(3)](_0x2f(4), event.threadID, event.messageID);
    }

    const msg = _0x2f(7) + _0x2f(5) + _0x2f(8) + _0x2f(6);
    return api.sendMessage(msg, event.threadID, event.messageID);
  } 
};
