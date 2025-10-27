const fs = require("fs");
const path = require("path");

const rolesFile = path.join(__dirname, "roles.json");

// Ensure roles.json exists
if (!fs.existsSync(rolesFile)) {
  fs.writeFileSync(rolesFile, JSON.stringify({}, null, 2));
}

module.exports = {
  config: {
    name: "set",
    aliases: ['ap'],
    version: "3.0",
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
    const permission = ["61582355550594"]; // Owner ID
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
        // Load roles.json
        let rolesData = JSON.parse(fs.readFileSync(rolesFile, "utf8"));
        rolesData[commandName] = newRole;

        // Save back to file
        fs.writeFileSync(rolesFile, JSON.stringify(rolesData, null, 2), "utf8");

        // Reload command
        const cmdPath = path.join(__dirname, `${commandName}.js`);
        if (!fs.existsSync(cmdPath)) {
          return api.sendMessage(`❌ Command file '${commandName}.js' not found.`, event.threadID);
        }

        delete require.cache[require.resolve(cmdPath)];
        const newCmd = require(cmdPath);

        // Override role from saved data
        newCmd.config.role = newRole;

        global.GoatBot.commands.set(newCmd.config.name, newCmd);

        return api.sendMessage(`⚡ Role of '${commandName}' command updated to ${newRole} (saved & auto-reloaded).`, event.threadID);

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
