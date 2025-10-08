const mongoose = require("mongoose");

// ✅ MongoDB URI
const MONGODB_URI = "mongodb+srv://tarekshikdar09:tarek099@bot-cluster.a7rzjf4.mongodb.net/?retryWrites=true&w=majority&appName=bot-cluster";

module.exports = {
  config: {
    name: "store",
    version: "5.2",
    author: "TAREK",
    category: "system",
    description: "Advanced MongoDB Command Manager (with styled output + permission control)"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const sender = event.senderID;
    const [action, cmdName] = args;
    const OWNER_UID = "100047994102529";

    // 🧠 MongoDB connect
    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
      } catch {
        return api.sendMessage("❌ MongoDB connection failed!", event.threadID);
      }
    }

    // 📜 Schema setup
    let Command, Permission;
    try {
      Command = mongoose.model("Command");
    } catch {
      const schema = new mongoose.Schema({
        name: String,
        code: String,
        author: String,
        createdAt: { type: Date, default: Date.now }
      });
      Command = mongoose.model("Command", schema);
    }

    try {
      Permission = mongoose.model("Permission");
    } catch {
      const schema = new mongoose.Schema({
        userID: String
      });
      Permission = mongoose.model("Permission", schema);
    }

    // Ensure owner always has permission
    const ownerPerm = await Permission.findOne({ userID: OWNER_UID });
    if (!ownerPerm) await Permission.create({ userID: OWNER_UID });

    const hasPerm = await Permission.findOne({ userID: sender });
    const { messageReply, mentions } = event;

    // ⚙️ Usage
    if (!action)
      return api.sendMessage(
        "╭───۞ 𝗦𝗧𝗢𝗥𝗘 𝗠𝗔𝗡𝗔𝗚𝗘𝗥\n│\n" +
        "├⚙️ 𝗨𝘀𝗮𝗴𝗲:\n" +
        "│\n" +
        "├- up [name] → reply JS code to upload\n" +
        "├- edit [name] → reply new JS code\n" +
        "├- out [name] → show command(s)\n" +
        "├- del [name] → delete command(s)\n" +
        "├- list → list all commands\n" +
        "├- src [keyword] → search by name\n" +
        "│\n" +
        "├- add [mention/reply/uid] → give access\n" +
        "├- remove [mention/reply/uid] → remove access\n" +
        "├- add list → show all access users\n" +
        "╰─────────────۞",
        event.threadID
      );

    // Permission management
    if (["add", "remove"].includes(action)) {
      if (sender !== OWNER_UID)
        return api.sendMessage("🚫 Only owner can manage permissions!", event.threadID);

      if (args[1] === "list") {
        const all = await Permission.find();
        if (!all.length)
          return api.sendMessage("📭 No users have store permission.", event.threadID);
        let msg = "╭───۞ 𝗣𝗘𝗥𝗠𝗜𝗦𝗦𝗜𝗢𝗡 𝗟𝗜𝗦𝗧\n";
        all.forEach((p, i) => (msg += `├ ${i + 1}. ${p.userID}\n`));
        msg += "╰─────────────۞";
        return api.sendMessage(msg, event.threadID);
      }

      const target =
        Object.keys(mentions)[0] ||
        (messageReply && messageReply.senderID) ||
        args[1];

      if (!target) return api.sendMessage("⚠️ Mention, reply or UID দিন!", event.threadID);

      if (action === "add") {
        const exists = await Permission.findOne({ userID: target });
        if (exists) return api.sendMessage("✅ User already has permission.", event.threadID);
        await Permission.create({ userID: target });
        return api.sendMessage(`🌼 Added permission for ${target}`, event.threadID);
      }

      if (action === "remove") {
        const result = await Permission.deleteOne({ userID: target });
        if (!result.deletedCount)
          return api.sendMessage("⚠️ User not found in permission list.", event.threadID);
        return api.sendMessage(`🚫 Removed permission for ${target}`, event.threadID);
      }
    }

    // Permission check
    if (!hasPerm)
      return api.sendMessage("🚫 You are not authorized to use this command.", event.threadID);

    // 🆙 UPLOAD
    if (action === "up") {
      if (!messageReply?.body)
        return api.sendMessage("📩 Reply to valid JavaScript code to upload!", event.threadID);

      const code = messageReply.body.trim();
      try {
        new Function(code);
      } catch {
        return api.sendMessage("⚠️ Invalid JS code! Upload failed.", event.threadID);
      }

      // 🔹 Author নাম auto fetch from UID
      const author = await usersData.getName(sender);
      await Command.create({ name: cmdName, code, author });

      return api.sendMessage(`✅ Uploaded command ${cmdName} by ${author}`, event.threadID);
    }

    // ✏️ EDIT
    if (action === "edit") {
      if (!messageReply?.body)
        return api.sendMessage("📩 Reply to new JS code to edit!", event.threadID);

      const code = messageReply.body.trim();
      try {
        new Function(code);
      } catch {
        return api.sendMessage("⚠️ Invalid JS code! Edit failed.", event.threadID);
      }

      const result = await Command.updateMany({ name: cmdName }, { code });
      if (!result.modifiedCount)
        return api.sendMessage(`⚠️ No command named ${cmdName} found.`, event.threadID);

      return api.sendMessage(`📝 Updated ${cmdName} successfully!`, event.threadID);
    }

    // 📤 OUT
    if (action === "out") {
      const commands = await Command.find({ name: cmdName });
      if (!commands.length)
        return api.sendMessage(`⚠️ Command ${cmdName} not found!`, event.threadID);

      let msg = `|──۞ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗢𝗨𝗧𝗣𝗨𝗧 ۞──|\n\n`;
      commands.forEach((cmd) => {
        msg += `${cmd.code}\n\n`;
      });
      return api.sendMessage(msg, event.threadID);
    }

    // 🗑️ DELETE
    if (action === "del") {
      const result = await Command.deleteMany({ name: cmdName });
      if (!result.deletedCount)
        return api.sendMessage(`⚠️ No command named ${cmdName} found.`, event.threadID);

      return api.sendMessage(`🗑️ Deleted ${cmdName} successfully!`, event.threadID);
    }

    // 📋 LIST
    if (action === "list") {
      const commands = await Command.find().sort({ createdAt: -1 });
      if (!commands.length)
        return api.sendMessage("⚠️ No commands found!", event.threadID);

      let msg = `╭───۞ 𝗦𝗧𝗢𝗥𝗘\n├--𝐓𝐨𝐭𝐚𝐥 𝐜𝐦𝐝:「${commands.length}」\n╰─────────────۞\n\n`;
      commands.forEach((cmd, i) => {
        msg += `╭─────────────۞\n`;
        msg += `├──۞ ${i + 1}. ${cmd.name}\n`;
        msg += `├👑 Author: ${cmd.author}\n`;
        msg += `├🌐 Date: ${cmd.createdAt.toLocaleDateString()}\n`;
        msg += `╰─────────────۞\n`;
      });
      return api.sendMessage(msg, event.threadID);
    }

    // 🔍 SEARCH
    if (action === "src") {
      if (!cmdName)
        return api.sendMessage("🔎 Use: store src [keyword]", event.threadID);

      const results = await Command.find({ name: { $regex: cmdName, $options: "i" } });
      if (!results.length)
        return api.sendMessage("⚠️ No matching commands found!", event.threadID);

      let msg = `|──۞ 𝗦𝗘𝗔𝗥𝗖𝗛 𝗥𝗘𝗦𝗨𝗟𝗧𝗦 ۞──|\n\n`;
      results.forEach((cmd, i) => {
        msg += `╭─────────────۞\n`;
        msg += `├──۞ ${i + 1}. ${cmd.name}\n`;
        msg += `├👑 Author: ${cmd.author}\n`;
        msg += `├🌐 Date: ${cmd.createdAt.toLocaleDateString()}\n`;
        msg += `╰─────────────۞\n`;
      });
      return api.sendMessage(msg, event.threadID);
    }

    // Invalid
    return api.sendMessage("⚙️ Invalid action! Use: up / edit / out / del / list / src", event.threadID);
  }
};
