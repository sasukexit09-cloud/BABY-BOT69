const axios = require('axios');

module.exports = {
	config: {
		name: "waifu",
		aliases: ["wife"],
		version: "1.2",
		author: "AYAN BBE💋",
		countDown: 6,
		role: 0,
		shortDescription: "Get a random waifu image (VIP only)",
		longDescription: "Get waifu images like: waifu, neko, shinobu, megumin, bully, cuddle, cry, kiss, lick, hug, awoo, pat, smug, bonk, yeet, blush, smile, wave, highfive, handhold, nom, bite, glomp, slap, kill, kick, happy, wink, poke, dance, cringe",
		category: "anime",
		guide: "{pn} <category>"
	},

	onStart: async function ({ message, args, userID }) {
		const user = global.Users[userID];

		// VIP চেক
		if (!user || !user.vip) {
			// Cute short message for non-VIP users
			return message.reply("🍼 ʙᴀʙʏ, ʙᴜʏ ᴠɪᴘ ғɪʀsᴛ ᴛʜᴇɴ ᴜsᴇ ᴄᴏᴍᴍᴀɴᴅ 🥺💋");
		}

		// Balance চেক
		if (user.balance < 1000) {
			return message.reply("⚠️ তোমার balance পর্যাপ্ত নয়। এই কমান্ড ব্যবহার করতে 1000 balance লাগবে।");
		}

		// 1000 balance কেটে দেওয়া
		user.balance -= 1000;

		const category = args.join(" ") || "waifu";
		const apiURL = `https://api.waifu.pics/sfw/${category}`;

		try {
			const res = await axios.get(apiURL);
			const imgURL = res.data.url;

			if (!imgURL) throw new Error("No image found");

			const form = {
				body: `「 𝔀𝓪𝓲𝓯𝓾 」\n💸 1000 balance কেটে দেওয়া হয়েছে। বর্তমান balance: ${user.balance}`,
				attachment: await global.utils.getStreamFromURL(imgURL)
			};

			message.reply(form);
		} catch (err) {
			message.reply(`No waifu found for category: "${category}".\nAvailable categories: waifu, neko, shinobu, megumin, bully, cuddle, cry, kiss, lick, hug, awoo, pat, smug, bonk, yeet, blush, smile, wave, highfive, handhold, nom, bite, glomp, slap, kill, kick, happy, wink, poke, dance, cringe`);
		}
	}
};
