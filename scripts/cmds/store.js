const mongoose = require("mongoose");
const crypto = require("crypto");

// ✅ MongoDB URI
const MONGODB_URI = "mongodb+srv://tarekshikdar09:tarek099@bot-cluster.a7rzjf4.mongodb.net/?retryWrites=true&w=majority&appName=bot-cluster";

module.exports = {
  config: {
    name: "store",
    version: "3.0",
    author: "TAREK",
    category: "system",
    description: "AIO Command Store — preview, lock, versions, debug, import/export, logs, modes and more"
  },

  onStart: async function ({ api, event, args, usersData, Threads }) {
    const sender = event.senderID;
    const threadID = event.threadID;
    const [action, cmdName, extra] = args; // extra used for tokens or subcommands
    const OWNER_UID = "100047994102529";

    // connect db
    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
      } catch (err) {
        console.error(err);
        return api.sendMessage("❌ MongoDB connection failed!", threadID);
      }
    }

    //
    // Models
    //
    let Command;
    try {
      Command = mongoose.model("Command");
    } catch {
      const schema = new mongoose.Schema({
        name: String,
        code: String,
        author: String, // stored as name
        createdAt: { type: Date, default: Date.now },
        locked: { type: Boolean, default: false }
      });
      Command = mongoose.model("Command", schema);
    }

    let CommandVersion;
    try {
      CommandVersion = mongoose.model("CommandVersion");
    } catch {
      const schema = new mongoose.Schema({
        name: String,
        code: String,
        author: String,
        versionAt: { type: Date, default: Date.now }
      });
      CommandVersion = mongoose.model("CommandVersion", schema);
    }

    let Permission;
    try {
      Permission = mongoose.model("Permission");
    } catch {
      const schema = new mongoose.Schema({
        userID: String
      });
      Permission = mongoose.model("Permission", schema);
    }

    let Activity;
    try {
      Activity = mongoose.model("Activity");
    } catch {
      const schema = new mongoose.Schema({
        type: String, // upload/edit/del/run/import/export
        name: String,
        by: String,
        at: { type: Date, default: Date.now },
        threadID: String,
        note: String
      });
      Activity = mongoose.model("Activity", schema);
    }

    let PreviewToken;
    try {
      PreviewToken = mongoose.model("PreviewToken");
    } catch {
      const schema = new mongoose.Schema({
        token: String,
        cmdName: String,
        owner: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date
      });
      PreviewToken = mongoose.model("PreviewToken", schema);
    }

    let Config;
    try {
      Config = mongoose.model("StoreConfig");
    } catch {
      const schema = new mongoose.Schema({
        threadID: String,
        mode: { type: String, default: "classic" } // neon | classic
      });
      Config = mongoose.model("StoreConfig", schema);
    }

    // ensure owner permission
    const ownerPerm = await Permission.findOne({ userID: OWNER_UID });
    if (!ownerPerm) await Permission.create({ userID: OWNER_UID });

    const hasPerm = await Permission.findOne({ userID: sender });
    const { messageReply, mentions } = event;

    // USAGE
    if (!action) {
      return api.sendMessage(
        "╭───۞ 𝗦𝗧𝗢𝗥𝗘 𝗠𝗔𝗡𝗔𝗚𝗘𝗥\n" +
        "├ Usage:\n" +
        "├- up [name] → reply JS code to upload\n" +
        "├- edit [name] → reply new JS code\n" +
        "├- out [name] → show command(s) (with preview token)\n" +
        "├- run <token> → run preview token (use token from out)\n" +
        "├- del [name] → delete command(s)\n" +
        "├- list → list all commands\n" +
        "├- src [keyword] → search by name\n" +
        "├- history [name] → show versions\n" +
        "├- export [name] → export JSON\n" +
        "├- import → reply JSON to import\n" +
        "├- random → show random command\n" +
        "├- mode [neon|classic] → set output theme for this thread\n" +
        "├- log → show activity (recent)\n" +
        "├- add [mention/reply/uid] → give access\n" +
        "├- remove [mention/reply/uid] → remove access\n" +
        "╰─────────────۞",
        threadID
      );
    }

    // ---------- Permission management ----------
    if (["add", "remove"].includes(action)) {
      if (sender !== OWNER_UID)
        return api.sendMessage("🚫 Only owner can manage permissions!", threadID);

      if (args[1] === "list") {
        const all = await Permission.find();
        if (!all.length) return api.sendMessage("📭 No users have store permission.", threadID);
        let msg = "╭───۞ 𝗣𝗘𝗥𝗠𝗜𝗦𝗦𝗜𝗢𝗡 𝗟𝗜𝗦𝗧\n";
        all.forEach((p, i) => (msg += `├ ${i + 1}. ${p.userID}\n`));
        msg += "╰─────────────۞";
        return api.sendMessage(msg, threadID);
      }

      const target =
        Object.keys(mentions)[0] ||
        (messageReply && messageReply.senderID) ||
        args[1];

      if (!target) return api.sendMessage("⚠️ Mention, reply or UID দিন!", threadID);

      if (action === "add") {
        const exists = await Permission.findOne({ userID: target });
        if (exists) return api.sendMessage("✅ User already has permission.", threadID);
        await Permission.create({ userID: target });
        await Activity.create({ type: "perm_add", name: target, by: (await usersData.getName(sender)) || sender, threadID });
        return api.sendMessage(`🌼 Added permission for ${target}`, threadID);
      }

      if (action === "remove") {
        const result = await Permission.deleteOne({ userID: target });
        if (!result.deletedCount) return api.sendMessage("⚠️ User not found in permission list.", threadID);
        await Activity.create({ type: "perm_remove", name: target, by: (await usersData.getName(sender)) || sender, threadID });
        return api.sendMessage(`🚫 Removed permission for ${target}`, threadID);
      }
    }

    // permission check for regular actions
    if (!hasPerm)
      return api.sendMessage("🚫 You are not authorized to use this command.", threadID);

    //
    // Helper functions
    //
    const bold = (s) => `*${s}*`;
    const jsBlock = (s) => "```js\n" + s + "\n```"; // syntax highlighting / monospace
    const genToken = (len = 16) => crypto.randomBytes(len).toString("hex");

    const logActivity = async (type, name, note = "") => {
      try {
        await Activity.create({ type, name, by: (await usersData.getName(sender)) || sender, threadID, note });
      } catch (e) {
        console.error("Activity log failed:", e);
      }
    };

    const getModeForThread = async (tID) => {
      const c = await Config.findOne({ threadID: tID });
      return c ? c.mode : "classic";
    };

    //
    // UPLOAD
    //
    if (action === "up") {
      if (!messageReply?.body)
        return api.sendMessage("📩 Reply to valid JavaScript code to upload!", threadID);

      const code = messageReply.body.trim();
      // Basic AI-powered debugger: try to create function
      try {
        new Function(code);
      } catch (err) {
        // try to give friendly message
        const message = err && err.message ? err.message : String(err);
        await logActivity("upload_failed", cmdName || "unknown", message);
        return api.sendMessage(`⚠️ Invalid JS code! Debug:\n${message}`, threadID);
      }

      const authorName = await usersData.getName(sender);

      // create command
      await Command.create({ name: cmdName, code, author: authorName, locked: false });
      await logActivity("upload", cmdName, `Uploaded by ${authorName}`);

      return api.sendMessage(`✅ Uploaded command ${bold(cmdName)} by ${bold(authorName)}`, threadID);
    }

    //
    // EDIT (with versioning)
    //
    if (action === "edit") {
      if (!messageReply?.body)
        return api.sendMessage("📩 Reply to new JS code to edit!", threadID);

      const code = messageReply.body.trim();
      const commands = await Command.find({ name: cmdName });
      if (!commands.length)
        return api.sendMessage(`⚠️ No command named ${bold(cmdName)} found.`, threadID);

      // locked check (any one locked prevents edit)
      if (commands.some(c => c.locked)) {
        return api.sendMessage("🚫 This command is locked. Only authorized users can edit it.", threadID);
      }

      // debug check
      try {
        new Function(code);
      } catch (err) {
        const message = err && err.message ? err.message : String(err);
        await logActivity("edit_failed", cmdName, message);
        return api.sendMessage(`⚠️ Invalid JS code! Debug:\n${message}`, threadID);
      }

      // versioning: save current versions
      for (const c of commands) {
        await CommandVersion.create({ name: c.name, code: c.code, author: c.author });
      }

      const authorName = await usersData.getName(sender);
      const result = await Command.updateMany({ name: cmdName }, { code });
      await logActivity("edit", cmdName, `Edited by ${authorName}`);

      return api.sendMessage(`📝 Updated ${bold(cmdName)} successfully!`, threadID);
    }

    //
    // OUT (show code + preview token + syntax-highlight)
    //
    if (action === "out") {
      const commands = await Command.find({ name: cmdName });
      if (!commands.length) return api.sendMessage(`⚠️ Command ${bold(cmdName)} not found!`, threadID);

      // Build message
      let msg = `|──۞ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗢𝗨𝗧𝗣𝗨𝗧 ۞──|\n\n`;
      for (const cmd of commands) {
        msg += `${bold(cmd.name)}\n`;
        msg += `${bold(cmd.author)}\n\n`;
        // syntax highlight using fenced block
        msg += jsBlock(cmd.code) + "\n";
        // create preview token (valid for 10 minutes)
        const token = genToken(8);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await PreviewToken.create({ token, cmdName: cmd.name, owner: sender, createdAt: new Date(), expiresAt });
        msg += `Preview Token: ${token}\nReply with: ${bold(`store run ${token}`)} to execute (valid 10m)\n\n`;
      }

      await logActivity("out", cmdName, `Viewed by ${(await usersData.getName(sender)) || sender}`);
      return api.sendMessage(msg, threadID);
    }

    //
    // RUN preview token
    //
    if (action === "run") {
      const token = cmdName || extra;
      if (!token) return api.sendMessage("🔎 Use: store run <token>", threadID);

      const tk = await PreviewToken.findOne({ token });
      if (!tk) return api.sendMessage("⚠️ Invalid or expired token.", threadID);
      if (tk.expiresAt && new Date() > tk.expiresAt) {
        await PreviewToken.deleteOne({ token });
        return api.sendMessage("⚠️ Token expired.", threadID);
      }

      // fetch command
      const commands = await Command.find({ name: tk.cmdName });
      if (!commands.length) return api.sendMessage("⚠️ Command not found.", threadID);

      // execute only first match
      const cmd = commands[0];

      // Run sandboxed (best-effort) — provide api, event, args, usersData as allowed globals
      try {
        const fn = new Function("api", "event", "args", "usersData", `${cmd.code}`);
        // call safely
        await Promise.resolve(fn(api, event, [], usersData));
        await logActivity("run", cmd.name, `Run by ${(await usersData.getName(sender)) || sender}`);
        return api.sendMessage(`✅ Executed preview of ${bold(cmd.name)} (check actions)`, threadID);
      } catch (err) {
        const message = err && err.message ? err.message : String(err);
        await logActivity("run_failed", cmd.name, message);
        return api.sendMessage(`⚠️ Runtime Error:\n${message}`, threadID);
      }
    }

    //
    // DELETE (with lock check)
    //
    if (action === "del") {
      const commands = await Command.find({ name: cmdName });
      if (!commands.length) return api.sendMessage(`⚠️ No command named ${bold(cmdName)} found.`, threadID);

      if (commands.some(c => c.locked)) return api.sendMessage("🚫 This command is locked. You cannot delete it.", threadID);

      const result = await Command.deleteMany({ name: cmdName });
      if (!result.deletedCount) return api.sendMessage(`⚠️ No command named ${bold(cmdName)} found.`, threadID);

      await logActivity("delete", cmdName, `Deleted by ${(await usersData.getName(sender)) || sender}`);
      return api.sendMessage(`🗑️ Deleted ${bold(cmdName)} successfully!`, threadID);
    }

    //
    // LIST (styled)
    //
    if (action === "list") {
      const commands = await Command.find().sort({ createdAt: -1 });
      if (!commands.length) return api.sendMessage("⚠️ No commands found!", threadID);

      const mode = await getModeForThread(threadID);
      let header = `╭───۞ 𝗦𝗧𝗢𝗥𝗘\n├--𝐓𝐨𝐭𝐚𝐥 𝐜𝐦𝐝:「${commands.length}」\n╰─────────────۞\n\n`;
      if (mode === "neon") header = "╭───۞ 𝗡𝗘𝗢𝗡 𝗦𝗧𝗢𝗥𝗘\n" + `├--𝐓𝐨𝐭𝐚𝐥 𝐜𝐦𝐝:「${commands.length}」\n╰─────────────۞\n\n`;

      let msg = header;
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        msg += `╭─────────────۞\n`;
        msg += `├──۞ ${i + 1}. ${bold(cmd.name)}\n`;
        msg += `├👑 Author: ${bold(cmd.author)}\n`;
        msg += `├🔒 Locked: ${cmd.locked ? "Yes" : "No"}\n`;
        msg += `├🌐 Date: ${cmd.createdAt.toLocaleDateString()}\n`;
        msg += `╰─────────────۞\n`;
      }
      await logActivity("list", "all", `Listed by ${(await usersData.getName(sender)) || sender}`);
      return api.sendMessage(msg, threadID);
    }

    //
    // SEARCH
    //
    if (action === "src") {
      if (!cmdName) return api.sendMessage("🔎 Use: store src [keyword]", threadID);
      const results = await Command.find({ name: { $regex: cmdName, $options: "i" } });
      if (!results.length) return api.sendMessage("⚠️ No matching commands found!", threadID);

      let msg = `|──۞ 𝗦𝗘𝗔𝗥𝗖𝗛 𝗥𝗘𝗦𝗨𝗟𝗧𝗦 ۞──|\n\n`;
      results.forEach((cmd, i) => {
        msg += `╭─────────────۞\n`;
        msg += `├──۞ ${i + 1}. ${bold(cmd.name)}\n`;
        msg += `├👑 Author: ${bold(cmd.author)}\n`;
        msg += `├🔒 Locked: ${cmd.locked ? "Yes" : "No"}\n`;
        msg += `├🌐 Date: ${cmd.createdAt.toLocaleDateString()}\n`;
        msg += `╰─────────────۞\n`;
      });
      await logActivity("search", cmdName, `Searched by ${(await usersData.getName(sender)) || sender}`);
      return api.sendMessage(msg, threadID);
    }

    //
    // HISTORY (versions)
    //
    if (action === "history") {
      if (!cmdName) return api.sendMessage("🔎 Use: store history [name]", threadID);
      const versions = await CommandVersion.find({ name: cmdName }).sort({ versionAt: -1 });
      if (!versions.length) return api.sendMessage("⚠️ No history for this command.", threadID);

      let msg = `╭───۞ 𝗛𝗜𝗦𝗧𝗢𝗥𝗬: ${bold(cmdName)}\n`;
      versions.forEach((v, i) => {
        msg += `├ ${i + 1}. ${v.versionAt.toLocaleString()} by ${v.author}\n`;
      });
      msg += "╰─────────────۞";
      await logActivity("history", cmdName, `Viewed by ${(await usersData.getName(sender)) || sender}`);
      return api.sendMessage(msg, threadID);
    }

    //
    // EXPORT
    //
    if (action === "export") {
      if (!cmdName) return api.sendMessage("🔎 Use: store export [name]", threadID);
      const commands = await Command.find({ name: cmdName });
      if (!commands.length) return api.sendMessage("⚠️ No command found to export.", threadID);

      // create export JSON for all matching (could be multiple)
      const payload = commands.map(c => ({ name: c.name, code: c.code, author: c.author, createdAt: c.createdAt }));
      const json = JSON.stringify(payload, null, 2);
      await logActivity("export", cmdName, `Exported by ${(await usersData.getName(sender)) || sender}`);
      // send as code block (user can copy)
      return api.sendMessage(`Export JSON for ${bold(cmdName)}:\n\`\`\`\n${json}\n\`\`\``, threadID);
    }

    //
    // IMPORT (reply JSON)
    //
    if (action === "import") {
      if (!messageReply?.body) return api.sendMessage("📩 Reply to a JSON payload to import commands.", threadID);
      let body = messageReply.body.trim();
      try {
        const data = JSON.parse(body);
        // data can be object or array
        const arr = Array.isArray(data) ? data : [data];
        for (const item of arr) {
          if (!item.name || !item.code) continue;
          const authorName = await usersData.getName(sender);
          await Command.create({ name: item.name, code: item.code, author: item.author || authorName });
          await logActivity("import_item", item.name, `Imported by ${(await usersData.getName(sender)) || sender}`);
        }
        await logActivity("import", "bulk", `Imported by ${(await usersData.getName(sender)) || sender}`);
        return api.sendMessage("✅ Import completed.", threadID);
      } catch (err) {
        return api.sendMessage("⚠️ Invalid JSON. Make sure it's valid and contains name & code fields.", threadID);
      }
    }

    //
    // RANDOM
    //
    if (action === "random") {
      const count = await Command.countDocuments();
      if (!count) return api.sendMessage("⚠️ No commands stored.", threadID);
      const skip = Math.floor(Math.random() * count);
      const cmd = await Command.findOne().skip(skip);
      if (!cmd) return api.sendMessage("⚠️ Could not fetch random command.", threadID);

      const msg = `╭───۞ 𝗥𝗔𝗡𝗗𝗢𝗠 𝗖𝗢𝗠𝗠𝗔𝗡𝗗\n├ ${bold(cmd.name)}\n├ ${bold(cmd.author)}\n\n${jsBlock(cmd.code)}\n╰─────────────۞`;
      await logActivity("random", cmd.name, `Requested by ${(await usersData.getName(sender)) || sender}`);
      return api.sendMessage(msg, threadID);
    }

    //
    // LOG
    //
    if (action === "log") {
      const logs = await Activity.find().sort({ at: -1 }).limit(20);
      if (!logs.length) return api.sendMessage("⚠️ No activity logs yet.", threadID);
      let msg = `╭───۞ 𝗔𝗖𝗧𝗜𝗩𝗜𝗧𝗬 𝗟𝗢𝗚\n`;
      logs.forEach((l, i) => {
        msg += `├ ${i + 1}. [${l.type}] ${l.name} — ${l.by} — ${l.at.toLocaleString()}\n`;
      });
      msg += "╰─────────────۞";
      return api.sendMessage(msg, threadID);
    }

    //
    // MODE (neon/classic)
    //
    if (action === "mode") {
      const m = cmdName;
      if (!m || !["neon", "classic"].includes(m)) return api.sendMessage("🔎 Use: store mode [neon|classic]", threadID);
      let cfg = await Config.findOne({ threadID });
      if (!cfg) cfg = await Config.create({ threadID, mode: m });
      else cfg.mode = m, await cfg.save();
      await logActivity("mode", m, `Set by ${(await usersData.getName(sender)) || sender}`);
      return api.sendMessage(`✨ Mode set to ${m}`, threadID);
    }

    // anything else
    return api.sendMessage("⚙️ Invalid action! Use: up / edit / out / run / del / list / src / history / export / import / random / mode / log", threadID);
  }
};
