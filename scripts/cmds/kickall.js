module.exports = {
	config: {
		name: "kickall",
		version: "4.2",
		author: "Cliff + GPT Fast",
		countDown: 5,
		role: 2,
		shortDescription: "Kick all non-admin members quickly",
		category: "Box Chat",
		guide: { en: "{p}kickall" }
	},

	onStart: async function ({ api, event, message }) {
		const threadID = event.threadID;
		const botID = api.getCurrentUserID();
		const info = await api.getThreadInfo(threadID);

		// Admins
		const adminIDs = info.adminIDs.map(admin => typeof admin === "object" ? admin.id : admin);

		// Check bot admin
		if (!adminIDs.includes(botID)) return message.reply("⚠️ Bot must be admin.");
		// Check sender admin
		if (!adminIDs.includes(event.senderID)) return message.reply("⚠️ Only group admin can use this command.");

		// Non-admin members
		const membersToKick = info.participantIDs.filter(uid => uid != botID && !adminIDs.includes(uid));
		if (!membersToKick.length) return message.reply("✅ No members to kick.");

		message.reply(`⚠️ Kicking ${membersToKick.length} members quickly...`);

		let success = 0;
		let failed = 0;

		// Kick in parallel with small batch size (5)
		const batchSize = 5;
		for (let i = 0; i < membersToKick.length; i += batchSize) {
			const batch = membersToKick.slice(i, i + batchSize);
			await Promise.all(batch.map(async uid => {
				try {
					await api.removeUserFromGroup(uid, threadID);
					success++;
				} catch {
					failed++;
				}
			}));
		}

		message.reply(`✅ Kick completed\n\nRemoved: ${success}\nFailed: ${failed}`);
	}
};