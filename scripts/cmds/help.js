module.exports = {
  config: {
    name: "help",
    aliases: ["h","help"],
    version: "2.0",
    author: "TAREK",
    countDown: 5,
    role: 0,
    shortDescription: "Display categorized command list",
    longDescription: "Shows all available bot commands organized by category.",
    category: "info",
    guide: {
      en: "• .help [empty | <page number> | <command name>]\n• .help <command name> [-u | usage | -g | guide]: only show command usage\n• .help <command name> [-i | info]: only show command info\n• .help <command name> [-r | role]: only show command role\n• .help <command name> [-a | alias]: only show command alias"
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

    const sortedCategories = Object.keys(categories).sort();

    const arg = args[0];
    const flag = args[1]?.toLowerCase();

    if (arg && isNaN(arg)) {
      const input = arg.toLowerCase();
      const command = allCommands.get(input) || allCommands.get(global.GoatBot.aliases.get(input));
      if (!command) return message.reply(`❌ Command "${input}" not found.`);

      const config = command.config;
      const guide = typeof config.guide === "object" ? config.guide.en : config.guide || "Not provided";
      const aliases = config.aliases?.join(", ") || "Do not have";

      let msg = "";

      switch(flag) {
        case "-u":
        case "usage":
        case "-g":
        case "guide":
          msg += "֍─────| USAGE |─────֎\n";
          msg += `🛠 ${guide}\n`;
          msg += "╰────────────────⦿\n";
          break;
        case "-i":
        case "info":
          msg += "֍─────| INFO |──────֎\n";
          msg += `🛠 Command name: ${prefix}${config.name}\n`;
          msg += `📝 Description: ${config.longDescription || config.shortDescription || "Not provided"}\n`;
          msg += `🌊 Other names: ${aliases}\n`;
          msg += `📦 Version: ${config.version || "1.0"}\n`;
          msg += `🎭 Role: ${config.role}\n`;
          msg += `⏱ Time per command: ${config.countDown || "1s"}\n`;
          msg += `✍️ Author: ${config.author || "Unknown"}\n`;
          msg += "╰───────────────⦿\n";
          break;
        case "-r":
        case "role":
          msg += "֍────| ROLE |────֎\n";
          msg += `🎭 ${config.role} (${config.role === 0 ? "All users" : "Restricted"})\n`;
          msg += "╰─────────────⦿\n";
          break;
        case "-a":
        case "alias":
          msg += "֍─────| ALIAS |─────֎\n";
          msg += `🌊 Other names: ${aliases}\n`;
          msg += `📦 Other names in your group: ${aliases}\n`;
          msg += "╰───────────────⦿\n";
          break;
        default:
          msg += "֎─────────────────֍\n";
          msg += "📌 Command Information\n\n";
          msg += `💠 Name: ${prefix}${config.name}\n`;
          msg += `📝 Description: ${config.longDescription || config.shortDescription || "Not provided"}\n`;
          msg += `📦 Version: ${config.version || "1.0"}\n`;
          msg += `✍️ Author: ${config.author || "Unknown"}\n`;
          msg += `🎭 Role Required: ${config.role}\n`;
          msg += `🌊 Aliases: ${aliases}\n`;
          msg += `🛠 Usage: ${guide}\n`;
          msg += "╰─────────────────⦿\n";
          break;
      }

      return message.reply(msg);
    }

    // Show all commands in one page
    let msg = "";
    for (const cat of sortedCategories) {
      msg += `╭──⦿ 【 ${cat} 】\n`;
      msg += `✧${categories[cat].join(" ✧")}\n`;
      msg += "╰────────⦿\n";
    }

    msg += "╭──────────⦿\n";
    msg += `│ 𝗧𝗼𝘁𝗮𝗹 𝗰𝗺𝗱𝘀:「${allCommands.size}」\n`;
    msg += `│ 𝗢𝘄𝗻𝗲𝗿: 𝗧𝗮𝗿𝗲𝗸\n`;
    msg += `│ 𝗣𝗿𝗲𝗳𝗶𝘅: [ ${prefix} ] \n`;
    msg += "╰─────────────⦿";

    return message.reply(msg);
  }
};
