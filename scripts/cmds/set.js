const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "set",
    aliases: ['ap'],
    version: "2.1",
    author: "Tarek",
    role: 0,
    shortDescription: {
      en: "Set coins, experience points for a user OR change role of a command"
    },
    longDescription: {
      en: "Set coins, experience points for a user or update the role (permission) of a command file"
    },
    category: "economy",
    guide: {
      en: "{pn} set [money|exp] [amount]\n{pn} set role [commandName] [role]"
    }
  },

  onStart: async function ({ args, event, api, usersData }) {
    const permission = ["100047994102529"]; // Owner ID
    if (!permission.includes(event.senderID)) {
      api.sendMessage("You don't have enough permission to use this command. Only My Lord Can Use It.", event.threadID, event.messageID);
      return;
    }

    const query = args[0];

    // ---------- COMMAND ROLE CHANGE ----------
    if (query && query.toLowerCase() === "role") {
      const commandName = args[1];
      const newRole = parseInt(args[2]);

      if (!commandName || isNaN(newRole)) {
        return api.sendMessage("❌ Usage: set role [commandName] [role]", event.threadID);
      }

      try {
        const cmdPath = path.join(__dirname, `${commandName}.js`);
        if (!fs.existsSync(cmdPath)) {
          return api.sendMessage(`❌ Command file '${commandName}.js' not found.`, event.threadID);
        }

        let content = fs.readFileSync(cmdPath, "utf8");

        if (!/role:\s*\d+/.test(content)) {
          return api.sendMessage(`❌ No 'role' property found in '${commandName}.js'`, event.threadID);
        }

        content = content.replace(/role:\s*\d+/, `role: ${newRole}`);
        fs.writeFileSync(cmdPath, content, "utf8");

        // 🔥 AUTO-RELOAD COMMAND
        delete require.cache[require.resolve(cmdPath)];
        const newCmd = require(cmdPath);
        global.GoatBot.commands.set(newCmd.config.name, newCmd);

        return api.sendMessage(`⚡ Role of '${commandName}' command updated to ${newRole} (auto-reloaded).`, event.threadID);

      } catch (err) {
        return api.sendMessage("❌ Error while changing command role: " + err.message, event.threadID);
      }
    }

    // ---------- USER MONEY/EXP ----------
    const amount = parseInt(args[1]);
    if (!query || isNaN(amount)) {
      return api.sendMessage("Invalid command arguments. Usage: set [money|exp] [amount] OR set role [cmdName] [role]", event.threadID);
    }

    const { senderID, threadID } = event;
    if (senderID === api.getCurrentUserID()) return;

    let targetUser;
    if (event.type === "message_reply") {
      targetUser = event.messageReply.senderID;
    } else {
      const mention = Object.keys(event.mentions);
      targetUser = mention[0] || senderID;
    }

    const userData = await usersData.get(targetUser);
    if (!userData) {
      return api.sendMessage("User not found.", threadID);
    }

    const name = await usersData.getName(targetUser);

    if (query.toLowerCase() === 'exp') {
      await usersData.set(targetUser, { ...userData, exp: amount });
      return api.sendMessage(`✅ Set experience points to ${amount} for ${name}.`, threadID);

    } else if (query.toLowerCase() === 'money') {
      await usersData.set(targetUser, { ...userData, money: amount });
      return api.sendMessage(`✅ Set coins to ${amount} for ${name}.`, threadID);

    } else {
      return api.sendMessage("Invalid query. Use 'money', 'exp' or 'role'.", threadID);
    }
  }
};
