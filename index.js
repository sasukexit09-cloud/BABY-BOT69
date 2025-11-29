// 📌 Goat-Bot / NTKhang Optimized index.js (READY TO RUN)
// ----------------------------------------------------------
// ⚡ Ultra-Stable | Auto Loader | Auto Prefix Sync | Error Safe
// ----------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

console.clear();
console.log("🚀 Starting BOT...");

// ================================
// 🔧 Load Config
// ================================
let config = {};
try {
  config = require("./config.json");
  global.config = config;
} catch (err) {
  console.error("❌ config.json not found or corrupted!");
  process.exit(1);
}

// ================================
// 🌐 Load Core System
// ================================
try {
  require("./src/core/loader");
  require("./src/core/startup");
  console.log("✔ Core modules loaded");
} catch (err) {
  console.error("❌ Failed to load core modules:", err);
  process.exit(1);
}

// ================================
// 📩 Command & Event Handler
// ================================
try {
  global.client = {
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
  };

  require("./src/core/commandHandler");
  require("./src/core/eventHandler");

  console.log("✔ Command + Event Handler Loaded");
} catch (err) {
  console.error("❌ Handler loading failed:", err);
  process.exit(1);
}

// ================================
// 🧩 Auto Load Commands
// ================================
(function loadCommands() {
  const commandPath = path.join(__dirname, "src/commands");
  const files = fs.readdirSync(commandPath).filter(f => f.endsWith(".js"));

  for (const file of files) {
    const cmd = require(path.join(commandPath, file));
    if (!cmd.config || !cmd.run) continue;

    global.client.commands.set(cmd.config.name, cmd);
  }
  console.log(`✔ Loaded ${global.client.commands.size} commands`);
})();

// ================================
// 🔔 Auto Load Events
// ================================
(function loadEvents() {
  const eventPath = path.join(__dirname, "src/events");
  const files = fs.readdirSync(eventPath).filter(f => f.endsWith(".js"));

  for (const file of files) {
    const evt = require(path.join(eventPath, file));
    if (!evt.config || !evt.run) continue;

    global.client.events.set(evt.config.name, evt);
  }
  console.log(`✔ Loaded ${global.client.events.size} events`);
})();

// ================================
// 🛡 Error Protection
// ================================
process.on("unhandledRejection", (err) => {
  console.log("⚠️ UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", (err) => {
  console.log("⚠️ UNCAUGHT EXCEPTION:", err);
});

console.log("🔥 BOT IS READY TO RUN!");
