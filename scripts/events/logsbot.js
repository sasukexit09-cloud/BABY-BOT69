const { getTime } = global.utils;

module.exports = {
	config: {
		name: "logsbot",
		isBot: true,
		version: "1.6",
		author: "NTKhang (Modified by Tarek)",
		envConfig: {
			allow: true,
			logGroupID: "1879628072949507" // এখানে তোমার লগ গ্রুপের ID বসানো হলো
		},
		category: "events"
	},

	langs: {
		en: {
			addedTitle: "🛸───[ BOT EVENT LOG ]───🛸\n✨ EVENT: Bot has entered a new dimension!",
			kickedTitle: "⚡ BOT ALERT ⚡\n❌ KICKED from the group!",
			addedBy: "🙋 Added by: %1",
			kickedBy: "Responsible: %1",
			details: "\n📌 DETAILS:\n- User ID: %2\n- Group: %3\n- Group ID: %4\n- Timestamp: %5"
		}
	},

	onStart: async ({ usersData, threadsData, event, api, getLang }) => {
		// Only trigger on bot add or kick events
		if (
			!( (event.logMessageType === "log:subscribe" && event.logMessageData.addedParticipants.some(p => p.userFbId === api.getCurrentUserID())) ||
			   (event.logMessageType === "log:unsubscribe" && event.logMessageData.leftParticipantFbId === api.getCurrentUserID()) )
		) return;

		const { author, threadID } = event;
		if (author == api.getCurrentUserID()) return; // Skip if bot itself triggered

		let threadName;
		const { config } = global.GoatBot;
		const time = getTime("DD/MM/YYYY HH:mm:ss");

		let msg = "";

		if (event.logMessageType === "log:subscribe") {
			threadName = (await api.getThreadInfo(threadID)).threadName;
			const authorName = await usersData.getName(author);
			msg = `${getLang("addedTitle")}\n${getLang("addedBy", authorName)}${getLang("details", author, threadName, threadID, time)}`;
		} else if (event.logMessageType === "log:unsubscribe") {
			const threadData = await threadsData.get(threadID);
			threadName = threadData?.threadName || (await api.getThreadInfo(threadID)).threadName;
			const authorName = await usersData.getName(author);
			msg = `${getLang("kickedTitle")}\n${getLang("kickedBy", authorName)}${getLang("details", author, threadName, threadID, time)}`;
		}

		// Send log message to one specific log group
		if (config.logGroupID) {
			api.sendMessage(msg, config.logGroupID);
		}
	}
};
