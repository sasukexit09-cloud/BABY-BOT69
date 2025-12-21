const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');
const { getStreamFromURL, shortenURL, randomString } = global.utils;

const API_KEYS = [
    'b38444b5b7mshc6ce6bcd5c9e446p154fa1jsn7bbcfb025b3b',
    '719775e815msh65471c929a0203bp10fe44jsndcb70c04bc42',
    'a2743acb5amsh6ac9c5c61aada87p156ebcjsnd25f1ef87037',
    '8e938a48bdmshcf5ccdacbd62b60p1bffa7jsn23b2515c852d',
    'f9649271b8mshae610e65f24780cp1fff43jsn808620779631',
    '8e906ff706msh33ffb3d489a561ap108b70jsne55d8d497698',
    '4bd76967f9msh2ba46c8cf871b4ep1eab38jsn19c9067a90bb',
];

async function video(api, event, args, message, usersData) {
    const { senderID, threadID, messageID } = event;

    // ===== VIP CHECK =====
    const userData = await usersData.get(senderID);
    if (!userData || userData.vip !== true) {
        return message.reply(
            "🔒 | **VIP ONLY COMMAND**\n\n🥺 Baby, তুমি VIP না\n✨ আগে VIP নাও তারপর ভিডিও চালাও 💋"
        );
    }
    // =====================

    api.setMessageReaction("🕢", messageID, () => {}, true);

    try {
        let title = '';
        let videoId = '';
        let shortUrl = '';

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        const getRandomApiKey = () => {
            const randomIndex = Math.floor(Math.random() * API_KEYS.length);
            return API_KEYS[randomIndex];
        };

        const extractAttachmentUrl = async () => {
            const attachment = event.messageReply?.attachments?.[0];
            if (!attachment || !attachment.url) throw new Error("Attachment missing or invalid.");
            if (!["video", "audio"].includes(attachment.type)) throw new Error("Invalid attachment type.");
            return attachment.url;
        };

        if (event.messageReply && event.messageReply.attachments?.length > 0) {
            shortUrl = await extractAttachmentUrl();
            const recognitionResponse = await axios.get(`https://audio-recon-ahcw.onrender.com/kshitiz?url=${encodeURIComponent(shortUrl)}`);
            if (!recognitionResponse.data?.title) throw new Error("Audio recognition failed.");
            title = recognitionResponse.data.title;
            const searchResponse = await axios.get(`https://youtube-kshitiz-gamma.vercel.app/yt?search=${encodeURIComponent(title)}`);
            if (!searchResponse.data?.length) throw new Error("No YouTube results found.");
            videoId = searchResponse.data[0].videoId;
            shortUrl = await shortenURL(shortUrl);
        } else if (args.length > 0) {
            title = args.join(" ");
            const searchResponse = await axios.get(`https://youtube-kshitiz-gamma.vercel.app/yt?search=${encodeURIComponent(title)}`);
            if (!searchResponse.data?.length) throw new Error("No YouTube results found.");
            videoId = searchResponse.data[0].videoId;
            const videoUrlResponse = await axios.get(`https://yt-kshitiz.vercel.app/download?id=${encodeURIComponent(videoId)}&apikey=${getRandomApiKey()}`);
            if (!videoUrlResponse.data?.length) throw new Error("Failed to get download link.");
            shortUrl = await shortenURL(videoUrlResponse.data[0]);
        } else {
            return message.reply("Please provide a video name or reply to a video/audio attachment.");
        }

        const downloadResponse = await axios.get(`https://yt-kshitiz.vercel.app/download?id=${encodeURIComponent(videoId)}&apikey=${getRandomApiKey()}`);
        if (!downloadResponse.data?.length) throw new Error("Failed to retrieve download link.");
        const videoUrl = downloadResponse.data[0];

        const videoPath = path.join(cacheDir, `${videoId}.mp4`);
        const writer = fs.createWriteStream(videoPath);

        const response = await axios({ url: videoUrl, method: 'GET', responseType: 'stream' });
        response.data.pipe(writer);

        writer.on('finish', () => {
            const videoStream = fs.createReadStream(videoPath);
            message.reply({ body: `📹 Playing: ${title}`, attachment: videoStream });
            api.setMessageReaction("✅", messageID, () => {}, true);
            videoStream.on('end', () => fs.unlink(videoPath, () => {}));
        });

        writer.on('error', (err) => {
            console.error("Download error:", err);
            message.reply("Error downloading the video.");
        });

    } catch (error) {
        console.error("Error:", error);
        message.reply(`❌ An error occurred: ${error.message}`);
    }
}

module.exports = {
    config: {
        name: "video", 
        version: "1.1",
        author: "AYAN BBE💋",
        countDown: 10,
        role: 0,
        shortDescription: "Play video from YouTube (VIP only)",
        longDescription: "Play video from YouTube with support for audio recognition.",
        category: "music",
        guide: "{p} video videoname / reply to audio or video"
    },
    onStart: function ({ api, event, args, message, usersData }) {
        return video(api, event, args, message, usersData);
    }
};
