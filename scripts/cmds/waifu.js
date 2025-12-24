const axios = require('axios');

module.exports = {
	config: {
		name: "waifu",
		aliases: ["wife"],
		version: "1.3",
		author: "AYAN BBE💋",
		countDown: 6,
		role: 0, // কেউই restriction নেই
		shortDescription: "Get a random waifu image",
		longDescription: "Get waifu images like: waifu, neko, shinobu, megumin, bully, cuddle, cry, kiss, lick, hug, awoo, pat, smug, bonk, yeet, blush, smile, wave, highfive, handhold, nom, bite, glomp, slap, kill, kick, happy, wink, poke, dance, cringe (no VIP required)",
		category: "anime",
		guide: "{pn} <category>"
	},

	onStart: async function ({ message, args }) {
		const category = args.join(" ") || "waifu";
		const apiURL = `https://api.waifu.pics/sfw/${category}`;

		try {
			const res = await axios.get(apiURL);
			const imgURL = res.data.url;

			if (!imgURL) throw new Error("No image found");

			const form = {
				body: `「 𝔀𝓪𝓲𝓯𝓾 」\n💜 Enjoy your random waifu image!`,
				attachment: await global.utils.getStreamFromURL(imgURL)
			};

			message.reply(form);
		} catch (err) {
			message.reply(`No waifu found for category: "${category}".\nAvailable categories: waifu, neko, shinobu, megumin, bully, cuddle, cry, kiss, lick, hug, awoo, pat, smug, bonk, yeet, blush, smile, wave, highfive, handhold, nom, bite, glomp, slap, kill, kick, happy, wink, poke, dance, cringe`);
		}
	}
};
