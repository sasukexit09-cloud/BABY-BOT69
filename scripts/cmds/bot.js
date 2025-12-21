// bot.js
const readline = require("readline");

// ইউজার ডেটা স্টোর
let usersData = {}; // key: userID, value: { balance: number }

// বটের prefix
const BOT_PREFIX = "!";

// প্রতি কমান্ডে deduct হবে
const COST_PER_COMMAND = 50;

// সিমুলেটেড ইউজার
const CURRENT_USER_ID = "user123";

// কমান্ড হ্যান্ডলার
async function handleCommand(input) {
  if (!input.startsWith(BOT_PREFIX)) {
    console.log("❌ ভুল! কমান্ডের আগে prefix দিন:", BOT_PREFIX);
    return;
  }

  const commandName = input.slice(BOT_PREFIX.length).trim();

  // ইউজার ডেটা আন
  if (!usersData[CURRENT_USER_ID]) {
    usersData[CURRENT_USER_ID] = { balance: 1000 }; // ডিফল্ট ব্যালেন্স
  }

  let user = usersData[CURRENT_USER_ID];

  // ব্যালেন্স চেক
  if (user.balance < COST_PER_COMMAND) {
    console.log(`❌ তোমার ব্যালেন্স কম! প্রতিটি কমান্ডের জন্য ${COST_PER_COMMAND} টাকা লাগে।`);
    return;
  }

  // ব্যালেন্স deduct
  user.balance -= COST_PER_COMMAND;

  console.log(`✅ কমান্ড "${commandName}" চালানো হলো। বর্তমান ব্যালেন্স: ${user.balance} টাকা।`);

  // এখানে মূল কমান্ডের লজিক আসতে পারে
  if (commandName === "help") {
    console.log("💡 কমান্ড লিস্ট: help, info, ping");
  } else if (commandName === "info") {
    console.log("🤖 আমি একটি বট যা প্রতিটি কমান্ডে ব্যালেন্স কেটে দেয়।");
  } else if (commandName === "ping") {
    console.log("🏓 Pong!");
  } else {
    console.log("❌ অজানা কমান্ড!");
  }
}

// CLI ইন্টারফেস
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`Bot চালু হলো! কমান্ড চালানোর জন্য prefix ব্যবহার করুন: ${BOT_PREFIX}`);
console.log("ডিফল্ট ব্যালেন্স: 1000 টাকা\n");

rl.on("line", async (input) => {
  await handleCommand(input);
});
