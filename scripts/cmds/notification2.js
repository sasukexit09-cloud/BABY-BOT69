const { getStreamsFromAttachment } = global.utils;
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "notification2",
    aliases: ["notify2", "noti2"],
    version: "1.0",
    author: "T A N J I L",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Send stylish notification from admin to all groups"
    },
    longDescription: {
      en: "Send stylish notification from admin to all groups"
    },
    category: "owner",
    guide: { en: "{pn} <message>" },
    envConfig: { delayPerGroup: 250 }
  },

  onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, getLang, usersData }) {
    const { delayPerGroup } = envCommands[commandName];

    if (!args[0]) return message.reply("Please enter the message you want to send to all groups");

    const senderID = event.senderID;
    const senderName = await usersData.getName(senderID) || "Unknown User";

    const now = moment().tz("Asia/Dhaka");
    const timeString = now.format("hh:mm A");
    const dateString = now.format("DD/MM/YYYY");

    const formSend = {
      body: `
⚙️ 𝗦𝘆𝘀𝘁𝗲𝗺 𝗡𝗼𝘁𝗶𝗰𝗲 ⚙️

💻 𝗔𝗱𝗺𝗶𝗻: ${senderName}
 ⏰ 𝗧𝗶𝗺𝗲: ${timeString}- ${dateString} 

────────────────

${args.join(" ")}

────────────────

𝘚𝘵𝘢𝘺 𝗰𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱, 𝗲𝘃𝗲𝗿𝘆𝗼𝗻𝗲! 
      `,
      attachment: await getStreamsFromAttachment(
        [
          ...event.attachments,
          ...(event.messageReply?.attachments || [])
        ].filter(item => ["photo", "png", "animated_image", "video", "audio"].includes(item.type))
      )
    };

    const allThreadID = (await threadsData.getAll()).filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup);

    message.reply(`Starting to send stylish notification to ${allThreadID.length} groups...`);

    let sendSuccess = 0;
    const sendError = [];
    const waitingSend = [];

    for (const thread of allThreadID) {
      const tid = thread.threadID;
      try {
        waitingSend.push({
          threadID: tid,
          pending: api.sendMessage(formSend, tid)
        });
        await new Promise(resolve => setTimeout(resolve, delayPerGroup));
      }
      catch (e) {
        sendError.push(tid);
      }
    }

    for (const sent of waitingSend) {
      try {
        await sent.pending;
        sendSuccess++;
      }
      catch (e) {
        const { errorDescription } = e;
        if (!sendError.some(item => item.errorDescription == errorDescription))
          sendError.push({
            threadIDs: [sent.threadID],
            errorDescription
          });
        else
          sendError.find(item => item.errorDescription == errorDescription).threadIDs.push(sent.threadID);
      }
    }

    let msg = "";
    if (sendSuccess > 0)
      msg += `✅ Sent stylish notification to ${sendSuccess} groups successfully\n`;
    if (sendError.length > 0)
      msg += `❌ Errors occurred sending to ${sendError.reduce((a, b) => a + b.threadIDs.length, 0)} groups:\n` +
        sendError.reduce((a, b) => a + `\n - ${b.errorDescription}\n  + ${b.threadIDs.join("\n  + ")}`, "");

    message.reply(msg);
  }
};
