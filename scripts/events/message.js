const fs = require("fs");
const path = require("path");

// ✅ Hardcoded group TID where messages will be forwarded
const groupTID = "31210887515176974";

// ✅ Path to store tracking information
const trackerPath = path.join(__dirname, "..", "commands", "forward-tracker.json");

// ✅ Create the tracker file if it doesn't exist
if (!fs.existsSync(trackerPath)) fs.writeFileSync(trackerPath, JSON.stringify({}));

module.exports = async function ({ api, event }) {
  if (!event || !event.senderID || !event.body) return;

  const tracker = JSON.parse(fs.readFileSync(trackerPath));

  const fromUID = event.senderID;
  const fromTID = event.threadID;
  const message = event.body;
  const isGroup = event.isGroup || false;

  // ✅ Step 1: Forward inbox message to group
  if (!isGroup && fromUID !== api.getCurrentUserID()) {
    const sent = await api.sendMessage(`📥 New message from UID ${fromUID}:\n\n${message}`, groupTID);

    // Save messageID to UID for reply tracking
    tracker[sent.messageID] = fromUID;
    fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
  }

  // ✅ Step 2: Handle replies from group and send back to inbox
  else if (isGroup && event.messageReply) {
    const originalMID = event.messageReply.messageID;
    const targetUID = tracker[originalMID];

    // ✅ Only allow admins to reply
    const threadInfo = await api.getThreadInfo(fromTID);
    const senderIsAdmin = threadInfo.adminIDs.some(admin => admin.id === fromUID);

    if (!senderIsAdmin) return;

    if (targetUID) {
      await api.sendMessage(`💬 Admin Reply:\n${message}`, targetUID);

      // Save new reply mapping
      tracker[event.messageID] = targetUID;
      fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
    }
  }
};
