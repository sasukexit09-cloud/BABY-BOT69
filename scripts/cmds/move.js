const axios = require("axios");

module.exports = {
 config: {
 name: "move",
 version: "1.0",
 author: "Chitron Bhattacharjee",
 countDown: 20,
 role: 2,
 shortDescription: {
 en: "Move all users to support box"
 },
 description: {
 en: "Collect all users from every thread and add them to your support box"
 },
 category: "admin",
 guide: {
 en: "Just use +move"
 }
 },

 onStart: async function ({
 api, message, threadsData, usersData
 }) {
 const SUPPORT_BOX_TID = "24106082729057536";

 message.reply("📦 Gathering threads...");

 const allThreads = await threadsData.getAll(); // Get all threads from MongoDB
 const userSet = new Set(); // To avoid duplicate users

 // Step 1: Collect all unique user IDs from all threads
 for (const thread of allThreads) {
 const members = thread.members || {};
 for (const uid in members) {
 if (!userSet.has(uid)) {
 userSet.add(uid);
 }
 }
 }

 const total = userSet.size;
 message.reply(`👥 Total unique users found: ${total}\n📬 Adding them to support box...`);

 // Step 2: Add them to the support box using api.addUserToGroup
 const failed = [];
 let successCount = 0;

 for (const uid of userSet) {
 try {
 await api.addUserToGroup(uid, SUPPORT_BOX_TID);
 successCount++;
 await new Promise(res => setTimeout(res, 100)); // Add slight delay to avoid spam/block
 } catch (e) {
 failed.push(uid);
 }
 }

 // Step 3: Final result message
 message.reply(
 `✅ Move complete!\n\n👤 Added: ${successCount}/${total}\n❌ Failed: ${failed.length}` +
 (failed.length > 0 ? `\n\n🔍 Failed UIDs:\n${failed.join(", ")}` : "")
 );
 }
};
