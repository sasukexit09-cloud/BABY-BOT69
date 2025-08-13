const fs = require("fs-extra");
const moment = require("moment-timezone");
const { createCanvas } = require("canvas");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "2.3",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    shortDescription: "Customize bot prefix",
    longDescription: "Modify the bot's prefix for individual threads or globally (admin only).",
    category: "config",
    guide: {
      en: `
        {pn} <new prefix>: Change the prefix for your chat box.
        Example: {pn} #

        {pn} <new prefix> -g: Change the prefix globally (admin only).
        Example: {pn} # -g

        {pn} reset: Reset prefix to the default.
      `
    }
  },

  langs: {
    en: {
      reset: "🔄 Your prefix has been reset to default: %1",
      onlyAdmin: "🚫 Only admins can modify the global prefix.",
      confirmGlobal: "⚠️ React below to confirm changing the global prefix.",
      confirmThisThread: "⚠️ React below to confirm changing the thread prefix.",
      successGlobal: "✅ Global prefix successfully updated to: %1",
      successThisThread: "✅ Thread prefix successfully updated to: %1",
      myPrefix: "Here's your prefix information:"
    }
  },

  onStart: async function ({ message, role, args, event, threadsData, getLang }) {
    if (!args[0]) return message.reply("❌ Please provide a valid prefix or use 'reset'.");

    const newPrefix = args[0];
    const isGlobal = args[1] === "-g";

    if (newPrefix === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    if (isGlobal && role < 2) return message.reply(getLang("onlyAdmin"));

    const confirmationMessage = isGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread");
    return message.reply(confirmationMessage, (err, info) => {
      global.GoatBot.onReaction.set(info.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        newPrefix,
        setGlobal: isGlobal,
        messageID: info.messageID
      });
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;

    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(getLang("successGlobal", newPrefix));
    } else {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      return message.reply(getLang("successThisThread", newPrefix));
    }
  },

  onChat: async function ({ event, message, usersData, getLang }) {
    if (event.body.toLowerCase() === "prefix") {
      const data = await usersData.get(event.senderID);
      const name = data.name || "User";
      const currentTime = moment.tz("Asia/Dhaka").format("hh:mm:ss A");
      const threadPrefix = utils.getPrefix(event.threadID);
      const globalPrefix = global.GoatBot.config.prefix;

      // Create canvas
      const width = 800;
      const height = 450;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(1, "#16213e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add decorative elements
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * width,
          Math.random() * height,
          Math.random() * 5,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      // Main box
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.strokeStyle = "#4facfe";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(50, 50, width - 100, height - 150, 20);
      ctx.fill();
      ctx.stroke();

      // Title
      ctx.fillStyle = "#4facfe";
      ctx.font = "bold 30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("PREFIX INFORMATION", width / 2, 100);

      // User info
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`👤 User: ${name}`, 100, 150);

      // Prefix info
      ctx.fillStyle = "#4facfe";
      ctx.font = "bold 24px Arial";
      ctx.fillText("🛸 Group Prefix:", 100, 200);
      ctx.fillText("🌍 System Prefix:", 100, 250);
      ctx.fillText("🕒 Current Time:", 100, 300);

      ctx.fillStyle = "#ffffff";
      ctx.font = "24px Arial";
      ctx.fillText(threadPrefix, 350, 200);
      ctx.fillText(globalPrefix, 350, 250);
      ctx.fillText(currentTime, 350, 300);

      // Footer with "Powered by Tarek Shikdar" in yellow with glow
      ctx.fillStyle = "#FFFF00"; // Bright yellow color
      ctx.font = "italic bold 18px Arial";
      ctx.textAlign = "center";
      ctx.shadowColor = "#FFFF00";
      ctx.shadowBlur = 15;
      ctx.fillText("⚡ Powered by Tarek Shikdar", width / 2, height - 70);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Save and send image
      const buffer = canvas.toBuffer();
      const imagePath = `${__dirname}/tmp/prefixInfo.png`;
      fs.ensureDirSync(`${__dirname}/tmp`);
      fs.writeFileSync(imagePath, buffer);

      return message.reply({
        body: getLang("myPrefix"),
        attachment: fs.createReadStream(imagePath)
      }, () => fs.unlinkSync(imagePath));
    }
  }
};
