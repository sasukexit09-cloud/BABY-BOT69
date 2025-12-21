module.exports = {
	config: {
		name: "pussy",
		aliases: ["18+"],
		version: "1.1",
		author: "Doru fix by kivv | Maya",
		countDown: 5,
		role: 1,
		shortDescription: "send you pic of pussy",
		longDescription: "sends u pic of girls pussy (VIP only, paid)",
		category: "18+",
		guide: "{pn}"
	},

	onStart: async function ({ message, usersData, event }) {
		const senderID = event.senderID;

		// ===== GET USER DATA =====
		const userData = await usersData.get(senderID);

		// VIP CHECK
		if (!userData || userData.vip !== true) {
			return message.send(
				"🔒 | **VIP ONLY**\n\n🥺 Baby, তুমি VIP না। আগে VIP নাও তারপর এই 18+ command use করো 💋"
			);
		}

		// BALANCE CHECK (100M)
		const cost = 100_000_000;
		const balance = userData.money || 0;

		if (balance < cost) {
			return message.send(
				`💸 | **Insufficient Balance**\n\nএই command use করতে 100M balance লাগবে 🥺\nতোমার balance: ${balance.toLocaleString()}`
			);
		}

		// DEDUCT BALANCE
		await usersData.set(senderID, {
			money: balance - cost
		});

		// =========================

		const links = [ 
			"https://i.ibb.co/jfqMF07/image.jpg",
			"https://i.ibb.co/tBBCS4y/image.jpg",
			"https://i.ibb.co/3zpyMVY/image.jpg",
			"https://i.ibb.co/gWbWT8k/image.jpg",
			"https://i.ibb.co/mHtyD1P/image.jpg",
			"https://i.ibb.co/vPHNhdY/image.jpg",
			"https://i.ibb.co/rm6rPjb/image.jpg",
			"https://i.ibb.co/7GpN2GW/image.jpg",
			"https://i.ibb.co/CnfMVpg/image.jpg",
		];

		const img = links[Math.floor(Math.random() * links.length)];

		message.send({
			body: `「 Pussy💦🥵 」\n\n💰 100M balance deducted`,
			attachment: await global.utils.getStreamFromURL(img)
		});
	}
};
