/*
Welcome module — send a welcome message + image only in a specific thread (TID).

How to use:
1. Edit the TARGET_TID constant below and set it to the thread id (string or number) of the group you want.
2. Place this file in your bot's modules folder and load like other modules.

This module watches for the "log:subscribe" event (when someone joins) and will send the welcome text
and the image (from the provided URL) only when the event's threadID matches TARGET_TID.

Notes:
- The code downloads the image once per send to a temp file and attaches it to the message so it works
  with bot frameworks that expect a file stream (like many Facebook chat bot frameworks).
- If your bot framework provides a different event signature for joins, adapt the condition accordingly.
*/

const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: 'wlc_tid',
  version: '1.0.0',
  hasPermssion: 0,
  credits: 'Maya',
  description: 'Send welcome message + image only for one thread ID (set TARGET_TID)'
};

// ---------- EDIT THIS ----------
// Put the thread id (TID) of the group that should receive the welcome message here.
// Example: const TARGET_TID = '1156513219946107';
const TARGET_TID = '1156513219946107';

// Welcome message body (you can customize)
const WELCOME_TEXT = 'স্বাগতম! 🎉\nআপনি আমাদের গ্রুপে যোগদানের জন্য ধন্যবাদ।';

// The image the user requested
const WELCOME_IMAGE_URL = 'https://files.catbox.moe/nj6fzr.png';
// -------------------------------

// helper: download image to a temporary file and return its path
async function downloadImageToTemp(url, tmpFilename = 'wlc_tmp_image.png') {
  const tmpPath = path.join(__dirname, tmpFilename);
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
    await fs.promises.writeFile(tmpPath, response.data);
    return tmpPath;
  } catch (err) {
    // if download fails, rethrow to let caller handle it
    throw new Error('Image download failed: ' + err.message);
  }
}

module.exports.handleEvent = async function({ api, event }) {
  try {
    // Some frameworks pass threadID, others use event.threadID; normalize
    const threadID = event.threadID || event.threadId || event.to || null;
    if (!threadID) return; // cannot proceed without thread id

    // Only act if this event belongs to the configured TARGET_TID
    if (String(threadID) !== String(TARGET_TID)) return;

    // We only care about join events
    if (event.logMessageType !== 'log:subscribe') return;

    // event.logMessageData.addedParticipants is usually an array of objects with userFbId / userId
    const added = (event.logMessageData && event.logMessageData.addedParticipants) || [];
    if (!added.length) return;

    // Download the welcome image to temp file
    let imagePath;
    try {
      imagePath = await downloadImageToTemp(WELCOME_IMAGE_URL, `wlc_image_${TARGET_TID}.png`);
    } catch (err) {
      // If image fail, send only text
      return api.sendMessage({ body: WELCOME_TEXT }, threadID);
    }

    // Compose message. Some frameworks accept attachment: fs.createReadStream(path)
    const message = {
      body: WELCOME_TEXT,
      attachment: fs.createReadStream(imagePath)
    };

    // Send the welcome message to the thread
    await api.sendMessage(message, threadID);

    // Cleanup: remove temp file (optional)
    try { fs.unlinkSync(imagePath); } catch (e) { /* ignore cleanup errors */ }
  } catch (err) {
    console.error('wlc_tid module error:', err);
  }
};

// Optional command to test the module manually if your framework calls module.exports.run
module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID || event.threadId || event.to || null;
  if (!threadID) return api.sendMessage('Cannot detect thread id.', threadID);
  if (String(threadID) !== String(TARGET_TID)) return api.sendMessage('This command only works in the configured thread.', threadID);

  // send test welcome (downloads image and sends)
  try {
    const tmpPath = await downloadImageToTemp(WELCOME_IMAGE_URL, `wlc_image_test_${TARGET_TID}.png`);
    await api.sendMessage({ body: WELCOME_TEXT, attachment: fs.createReadStream(tmpPath) }, threadID);
    try { fs.unlinkSync(tmpPath); } catch (e) {}
  } catch (err) {
    return api.sendMessage('Failed to send welcome image: ' + err.message, threadID);
  }
};
