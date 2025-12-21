const axios = require("axios");
const fs = require("fs");

const baseApiUrl = async () => {
    return "https://www.noobs-api.top/dipto";
};

module.exports.config = {
    name: "tiktok",
    version: "1.1",
    author: "AYAN BBE💋",
    countDown: 5,
    role: 0,
    description: {
        en: "Search for TikTok videos",
    },
    category: "MEDIA",
    guide: {
        en:
            "{pn} <search> - <optional: number of results | blank>" +
            "\nExample:" +
            "\n{pn} caredit - 50",
    },
};

module.exports.onStart = async function ({ api, args, event, Users }) {
    const userId = event.senderID;
    const user = await Users.getData(userId); // your user DB function

    // VIP & balance check
    if (!user.isVip) {
        if (!user.balance || user.balance < 1000) {
            return api.sendMessage(
                "🥺 You need 1k balance to use this command. Top-up or become VIP for free usage.",
                event.threadID
            );
        } else {
            user.balance -= 1000;
            await Users.setData(userId, { balance: user.balance });
            api.sendMessage(`💸 1k balance deducted. Remaining balance: ${user.balance}`, event.threadID);
        }
    } else {
        api.sendMessage("✨ VIP usage: free of charge!", event.threadID);
    }

    // Parse search arguments
    let search = args.join(" ");
    let searchLimit = 30;
    const match = search.match(/^(.+)\s*-\s*(\d+)$/);
    if (match) {
        search = match[1].trim();
        const parsedLimit = parseInt(match[2], 10);
        if (!isNaN(parsedLimit)) searchLimit = parsedLimit;
    }

    const apiUrl = `${await baseApiUrl()}/tiktoksearch?search=${encodeURIComponent(search)}&limit=${searchLimit}`;

    try {
        const response = await axios.get(apiUrl, { timeout: 10000 });
        const data = response.data.data;

        if (!data || data.length === 0)
            return api.sendMessage("❌ No videos found for your search.", event.threadID);

        const videoData = data[Math.floor(Math.random() * data.length)];

        // Download video
        const path = `/tmp/${Date.now()}.mp4`;
        const stream = await axios({ method: "get", url: videoData.video, responseType: "stream" });
        const writer = fs.createWriteStream(path);
        stream.data.pipe(writer);

        writer.on("finish", () => {
            let infoMessage = `📌 Title: ${videoData.title || "N/A"}\n👤 Author: ${videoData.author || "N/A"}`;
            api.sendMessage({ body: infoMessage, attachment: fs.createReadStream(path) }, event.threadID);
        });

        writer.on("error", (err) => {
            console.error(err);
            api.sendMessage("❌ Failed to download the TikTok video.", event.threadID);
        });
    } catch (error) {
        console.error(error);
        api.sendMessage("❌ An error occurred while fetching the TikTok video.", event.threadID);
    }
};
