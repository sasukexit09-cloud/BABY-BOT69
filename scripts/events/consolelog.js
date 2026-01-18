const chalk = require("chalk");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "consoleLog",
    version: "1.0.0",
    author: "AYAN & Gemini",
    countDown: 0,
    role: 0,
    shortDescription: { en: "Display group messages in console with colors" },
    category: "system"
  },

  handleEvent: async function ({ api, event, usersData, threadsData }) {
    const { threadID, senderID, body, type } = event;

    // ১. শুধুমাত্র মেসেজ এবং রিপ্লাই লগ করার জন্য
    if (type !== "message" && type !== "message_reply") return;

    try {
      // ২. তথ্য সংগ্রহ (ইউজার নেম, গ্রুফ নেম এবং সময়)
      const userData = await usersData.get(senderID);
      const nameUser = userData.name || "Unknown User";

      const threadData = await threadsData.get(threadID);
      const nameThread = threadData.threadName || "Private Chat/Unknown Group";

      const time = moment.tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY");

      // ৩. আপনার দেওয়া এক্সেস টোকেন ব্যবহার করে প্রোফাইল পিকচার লিঙ্ক (অপশনাল ব্যবহারের জন্য রাখা হয়েছে)
      const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
      const avatarURL = `https://graph.facebook.com/${senderID}/picture?height=1500&width=1500&access_token=${encodeURIComponent(FB_TOKEN)}`;

      // ৪. রঙিন কনসোল লগ আউটপুট
      console.log(chalk.bold.hex("#00CCFF")(`━━━━━━━◆ 𝗕𝗔𝗕𝗬 𝗕𝗢𝗧 ◆━━━━━━━`));
      console.log(chalk.hex("#FF3366")(`[📩] কন্টেন্ট: `) + chalk.white(body || "ছবি/ভিডিও বা অন্য অ্যাটাচমেন্ট"));
      console.log(chalk.hex("#FFFF33")(`[🔱] ইউজার: `) + chalk.hex("#93FFD8")(nameUser) + chalk.white(` (ID: ${senderID})`));
      console.log(chalk.hex("#66FF99")(`[🔎] গ্রুফ: `) + chalk.hex("#FF99FF")(nameThread) + chalk.white(` (ID: ${threadID})`));
      console.log(chalk.hex("#FF9900")(`[⏰] সময়: `) + chalk.hex("#B8FFF9")(time));
      console.log(chalk.bold.hex("#00CCFF")(`━━━━━━━━━━━━━━━━━━━━━━━━━━◆\n`));

    } catch (error) {
      // এরর হ্যান্ডেলিং (যদি ডাটাবেস থেকে তথ্য না পাওয়া যায়)
      console.log(chalk.red(`[Error in ConsoleLog]: ${error.message}`));
    }
  }
};