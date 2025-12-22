const itunes = require("searchitunes");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "appstore",
    version: "1.3",
    author: "NTKhang • VIP by Maya",
    countDown: 5,
    role: 0,
    description: {
      vi: "Tìm app trên appstore (VIP only)",
      en: "Search app on appstore (VIP only)"
    },
    category: "software",
    guide:
      "   {pn}: <keyword>\n" +
      "   - Example:\n" +
      "   {pn} PUBG",
    envConfig: {
      limitResult: 3
    }
  },

  langs: {
    vi: {
      missingKeyword: "Bạn chưa nhập từ khóa",
      noResult: "Không tìm thấy kết quả nào cho từ khóa %1",
      vipOnly: "🔒 Lệnh này chỉ dành cho VIP user"
    },
    en: {
      missingKeyword: "You haven't entered any keyword",
      noResult: "No result found for keyword %1",
      vipOnly: "🔒 This command is VIP only"
    }
  },

  onStart: async function ({
    message,
    args,
    commandName,
    envCommands,
    getLang,
    usersData,
    event
  }) {
    /* ===== VIP CHECK ===== */
    const userData = await usersData.get(event.senderID);
    if (!userData || userData.vip !== true) {
      return message.reply(getLang("vipOnly"));
    }
    /* ===================== */

    if (!args[0])
      return message.reply(getLang("missingKeyword"));

    let results = [];
    try {
      results = (
        await itunes({
          entity: "software",
          country: "VN",
          term: args.join(" "),
          limit: envCommands[commandName].limitResult
        })
      ).results;
    } catch (err) {
      return message.reply(getLang("noResult", args.join(" ")));
    }

    if (results.length > 0) {
      let msg = "";
      const pendingImages = [];

      for (const result of results) {
        msg +=
          `\n\n- ${result.trackCensoredName} by ${result.artistName}, ` +
          `${result.formattedPrice} and rated ` +
          `${"🌟".repeat(Math.round(result.averageUserRating || 0))} ` +
          `(${(result.averageUserRating || 0).toFixed(1)}/5)` +
          `\n- ${result.trackViewUrl}`;

        pendingImages.push(
          await getStreamFromURL(
            result.artworkUrl512 ||
            result.artworkUrl100 ||
            result.artworkUrl60
          )
        );
      }

      message.reply({
        body: msg,
        attachment: await Promise.all(pendingImages)
      });
    } else {
      message.reply(getLang("noResult", args.join(" ")));
    }
  }
};
