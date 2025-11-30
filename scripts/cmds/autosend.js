const schedule = require("node-schedule");
const chalk = require("chalk");

module.exports.config = {
  name: "autosent",
  version: "10.1.3",
  hasPermssion: 0,
  credits: "Shahadat Islam",
  description: "Automatically sends messages every hour (BD Time)",
  commandCategory: "group messenger",
  usages: "[]",
  cooldowns: 3
};

const messages = [
  // same messages array as yours
];

async function scheduleMessages(api) {
  console.log(chalk.bold.hex("#00c300")("\n============ AUTOSENT SYSTEM LOADED (BD TIME) ============\n"));

  if (!global.data) global.data = {};
  global.data.allThreadID = [];

  // fetch threads
  api.getThreadList(100, null, ["INBOX"], (err, list) => {
    if (err) return console.error(chalk.red("⚠️ Failed to fetch thread list:"), err);

    global.data.allThreadID = list.filter(t => t.isGroup).map(t => t.threadID);
    console.log(chalk.hex("#FFD700")(`✅ Collected ${global.data.allThreadID.length} group IDs.\n`));

    messages.forEach(({ time, message }) => {
      const [hour, minute, period] = time.split(/[: ]/);
      let hour24 = parseInt(hour, 10);
      if (period === "PM" && hour !== "12") hour24 += 12;
      if (period === "AM" && hour === "12") hour24 = 0;

      const rule = new schedule.RecurrenceRule();
      rule.tz = "Asia/Dhaka";
      rule.hour = hour24;
      rule.minute = parseInt(minute, 10);

      schedule.scheduleJob(rule, () => {
        global.data.allThreadID.forEach(threadID => {
          api.sendMessage(message, threadID, err => {
            if (err) console.error(chalk.red(`❌ Failed to send message to ${threadID}: ${err.message}`));
          });
        });
      });

      console.log(chalk.hex("#00FFFF")(`📅 Scheduled message for ${time} (BDT)`));
    });
  });
}

module.exports.onStart = async function ({ api, event }) {
  try {
    await scheduleMessages(api);
    if (event && event.threadID) {
      api.sendMessage("✅ Autosent system started successfully!", event.threadID);
    }
  } catch (err) {
    console.error(chalk.red("❌ Failed to start Autosent system:"), err);
  }
};
