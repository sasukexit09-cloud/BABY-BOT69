const axios = require("axios");
const moment = require("moment-timezone");

module.exports.config = {
    name: "autosend",
    version: "2.0",
    role: 0,
    author: "MAHABUB RAHMAN", // ⚠️ Do not change
    description: "Automatically sends videos from API at specified times",
    category: "Media",
    usages: "No manual trigger needed",
    cooldowns: 5
};

const lastSent = {}; // Track last sent time per thread

/**
 * Send video to a thread
 * @param {object} api - FB Messenger API
 * @param {string} threadID - Thread ID
 * @param {string} timeSlot - Current time slot
 */
async function sendVideo(api, threadID, timeSlot) {
    try {
        const response = await axios.get("https://mahabub-apis.vercel.app/mahabub");
        const videoUrl = response.data?.data;
        const title = response.data?.title || "🔹 No Title Found";

        if (!videoUrl) {
            return api.sendMessage("❌ No videos found! (Invalid API Response)", threadID);
        }

        const res = await axios.get(videoUrl, { responseType: "stream" });

        await api.sendMessage({
            body: `\n━━━━━━━━━━━━━━━━\n➝ 𝗡𝗼𝘄 𝗜𝘀: ${timeSlot}\n\n💬: ${title}\n━━━━━━━━━━━━━━━━\n➝ 𝐄𝐧𝐣𝐨𝐲 𝐲𝐨𝐮𝐫 𝐥𝐢𝐟𝐞 !!`,
            attachment: res.data
        }, threadID);

        lastSent[threadID] = timeSlot;

    } catch (err) {
        console.error("🚨 API Error:", err.message);
        api.sendMessage("❌ Failed to fetch or send video.", threadID);
    }
}

/**
 * Schedule videos at specific time slots
 * @param {object} api - FB Messenger API
 */
function scheduleVideo(api) {
    const timeSlots = [
        "1:00AM", "2:00AM", "3:00AM", "4:00AM", "5:00AM", "6:00AM",
        "7:00AM", "8:00AM", "9:00AM", "10:00AM", "11:00AM", "12:00PM",
        "1:00PM", "2:00PM", "3:00PM", "4:00PM", "5:00PM", "6:00PM",
        "7:00PM", "8:00PM", "9:00PM", "10:00PM", "11:00PM", "12:00AM"
    ];

    setInterval(async () => {
        const currentTime = moment().tz("Asia/Dhaka").format("h:mmA");

        const threads = await api.getThreadList(100, null, ["INBOX"]);
        for (const thread of threads) {
            if (!thread.isGroup) continue; // Only send to groups
            const threadID = thread.threadID;

            if (timeSlots.includes(currentTime) && lastSent[threadID] !== currentTime) {
                await sendVideo(api, threadID, currentTime);
            }
        }
    }, 60000); // Check every 1 min
}

module.exports.onLoad = function({ api }) {
    if (global.autosendInitialized) return;
    global.autosendInitialized = true;

    scheduleVideo(api);
    console.log("✅ Autosend module initialized (MAHABUB RAHMAN)");
};

module.exports.onStart = async function({ api }) {
    // Optional: Trigger immediately when bot starts
    console.log("🚀 Autosend is running...");
};
