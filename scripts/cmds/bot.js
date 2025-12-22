// bot.js
const readline = require("readline");

/* ================= CONFIG ================= */

const BOT_PREFIX = "!";
const COST_PER_COMMAND = 50;

/* ========================================== */

// Demo user database (normally DB / JSON হবে)
let usersData = {
  owner123: { balance: 999999, role: "owner", vip: true },
  vip123: { balance: 200, role: "user", vip: true },
  user123: { balance: 150, role: "user", vip: false }
};

// টেস্টের জন্য current user
let CURRENT_USER_ID = "user123";

/* =============== COMMAND HANDLER =============== */

async function handleCommand(input) {
  if (!input.startsWith(BOT_PREFIX)) {
    console.log(`❌ Prefix ছাড়া কমান্ড চলবে না (${BOT_PREFIX})`);
    return;
  }

  const commandName = input.slice(BOT_PREFIX.length).trim();

  // নতুন user হলে auto create
  if (!usersData[CURRENT_USER_ID]) {
    usersData[CURRENT_USER_ID] = {
      balance: 100,
      role: "user",
      vip: false
    };
  }

  const user = usersData[CURRENT_USER_ID];

  /* ===== AUTO DETECT ===== */

  // OWNER → FREE
  if (user.role === "owner") {
    console.log(`👑 Owner command "${commandName}" executed (FREE)`);
    return runCommand(commandName);
  }

  // VIP → FREE
  if (user.vip === true) {
    console.log(`🌟 VIP command "${commandName}" executed (FREE)`);
    return runCommand(commandName);
  }

  // NON-VIP → PAID
  if (user.balance < COST_PER_COMMAND) {
    console.log(`❌ ব্যালেন্স কম! প্রয়োজন ${COST_PER_COMMAND} টাকা`);
    return;
  }

  user.balance -= COST_PER_COMMAND;

  console.log(
    `✅ "${commandName}" চালানো হলো | কাটা হয়েছে ${COST_PER_COMMAND} টাকা | বর্তমান ব্যালেন্স: ${user.balance}`
  );

  runCommand(commandName);
}

/* =============== COMMAND LOGIC =============== */

function runCommand(cmd) {
  if (cmd === "help") {
    console.log("📜 Commands: help, info, ping, balance");
  } else if (cmd === "info") {
    console.log("🤖 Auto VIP detection system enabled");
  } else if (cmd === "ping") {
    console.log("🏓 Pong!");
  } else if (cmd === "balance") {
    console.log(`💰 Balance: ${usersData[CURRENT_USER_ID].balance}`);
  } else {
    console.log("❌ Unknown command");
  }
}

/* ================= CLI ================= */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("🤖 Bot Started");
console.log(`Prefix: ${BOT_PREFIX}`);
console.log(`Current User: ${CURRENT_USER_ID}`);
console.log("----------------------------------");

rl.on("line", handleCommand);
