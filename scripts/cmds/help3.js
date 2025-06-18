module.exports = {
  config: {
    name: "help3",
    aliases: ["h3","ch"],
    version: "2.0",
    author: "Tarek ✨",
    countDown: 5,
    role: 0,
    shortDescription: "Display categorized command list",
    longDescription: "Shows all available bot commands organized by category, with pagination.",
    category: "info",
    guide: {
      en: "{pn} [page number or command name]"
    }
  },

  onStart: async function ({ message, args, commandName, event, threadsData }) {
    const allCommands = global.GoatBot.commands;
    const prefix = (await threadsData.get(event.threadID))?.prefix || global.GoatBot.config.prefix;

    // Group commands by category
    const categories = {};
    for (const cmd of allCommands.values()) {
      const cat = (cmd.config.category || "Uncategorized").toUpperCase();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd.config.name);
    }

    // Sort categories alphabetically
    const sortedCategories = Object.keys(categories).sort();

    // Pagination setup
    const pageSize = 8;
    const totalPage = Math.ceil(sortedCategories.length / pageSize);
    let page = 1;
    const arg = args[0];

    // If command detail requested
    if (arg && isNaN(arg)) {
      const input = arg.toLowerCase();
      const command = allCommands.get(input) || allCommands.get(global.GoatBot.aliases.get(input));
      if (!command) return message.reply(`❌ Command "${input}" not found.`);

      const config = command.config;
      const guide = typeof config.guide === "object" ? config.guide.en : config.guide || "Not provided";

      let msg = `📄 Command Info: ${prefix}${config.name}\n`;
      msg += `• Description: ${config.longDescription || config.shortDescription || "Not provided"}\n`;
      msg += `• Version: ${config.version || "1.0"}\n`;
      msg += `• Author: ${config.author || "Unknown"}\n`;
      msg += `• Role Required: ${config.role}\n`;
      msg += `• Aliases: ${config.aliases?.join(", ") || "None"}\n`;
      msg += `• Usage: ${guide}`;

      return message.reply(msg);
    }

    if (!isNaN(arg)) page = parseInt(arg);
    if (page < 1 || page > totalPage) return message.reply(`❌ Invalid page number. Total: ${totalPage}`);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const categorySlice = sortedCategories.slice(start, end);

    let msg = `┏━━[ 𝐁𝐎𝐓 𝐌𝐄𝐍𝐔 - 𝐏𝐚𝐠𝐞 ${page}/${totalPage} ]━━┓\n┃`;
    for (const cat of categorySlice) {
      msg += `\n┃ ✦ 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐲: ${cat}\n┃    ⤷ ${categories[cat].join("\n┃    ⤷ ")}`;
    }

    msg += `\n┣━━━━━━━━━━━━┫`;
    msg += `\n┃ 🦈 𝐓𝐨𝐭𝐚𝐥 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬: ${allCommands.size}`;
    msg += `\n┃ 📘 𝐔𝐬𝐚𝐠𝐞: "${prefix}${commandName} <command>"`;
    msg += `\n┃ 📄 𝐔𝐬𝐚𝐠𝐞: "${prefix}${commandName} <page>"`;
    msg += `\n┗━━━━━━━━━━━━━┛`;

    return message.reply(msg);
  }
};
