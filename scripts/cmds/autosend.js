const axios = require("axios");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "autosend",
    version: "3.0",
    role: 0,
    author: "MAHABUB RAHMAN",
    description: "Automatically sends videos to group chats at fixed times",
    category: "Media",
    usages: "Auto system",
    cooldowns: 5
};

// ================== STORAGE ==================
const DATA_FILE = path.join(__dirname, "autosend_data.json");
let lastSent = {};

if (fs.existsSync(DATA_FILE)) {
    lastSent = JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(lastSent, null, 2));
}

// ================== TIME SLOTS ==================
const timeSlots = [
    "00:00","01:00","02:00","03:00","04:00","05:00",
    "06:00","07:00","08:00","09:00","10:00","11:00",
    "12:00","13:00","14:00","15:00","16:00","17:00",
    "18:00","19:00","20:00","21:00","22:00","23:00"
];

// ================== SEND VIDEO ==================
async function sendVideo(api, threadID, time) {
    const tempFile = path.join(__dirname, `autosend_${Date.now()}.mp4`);

    try {
        const apiRes = await axios.get(
            "https://mahabub-apis.vercel.app/mahabub",
            { timeout: 20000 }
        );

        const videoUrl =
            apiRes.data?.data ||
            apiRes.data?.url ||
            apiRes.data?.video;

        const title = apiRes.data?.title || "Auto Video";

        if (!videoUrl) {
            console.log("❌ No video URL from API");
            return;
        }

        // Download video
        const videoStream = await axios({
            url: videoUrl,
            method: "GET",
            responseType: "stream",
            timeout: 30000
        });

        const writer = fs.createWriteStream(tempFile);
        videoStream.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        // Send video
        await api.sendMessage({
            body:
`━━━━━━━━━━━━━━━━
🕒 Time: ${time}
🎬 ${title}
━━━━━━━━━━━━━━━━
Enjoy 💙`,
            attachment: fs.createReadStream(tempFile)
        }, threadID);

        lastSent[threadID] = time;
        saveData();

        // Delay to avoid spam
        await new Promise(r => setTimeout(r, 3000));

    } catch (err) {
        console.log("🚨 AUTOSEND ERROR:", err.response?.data || err.message);
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
}

// ================== SCHEDULER ==================
async function scheduleVideo(api) {
    setInterval(async () => {
        const now = moment().tz("Asia/Dhaka").format("HH:mm");

        if (!timeSlots.includes(now)) return;

        let threads = [];
        let cursor = null;

        do {
            const list = await api.getThreadList(50, cursor, ["INBOX"]);
            threads.push(...list);
            cursor = list.length === 50 ? list[list.length - 1].threadID : null;
        } while (cursor);

        for (const t of threads) {
            if (!t.isGroup) continue;
            if (lastSent[t.threadID] === now) continue;

            await sendVideo(api, t.threadID, now);
        }

    }, 60 * 1000);
}

// ================== LOAD ==================
module.exports.onLoad = ({ api }) => {
    if (global.autosendLoaded) return;
    global.autosendLoaded = true;

    scheduleVideo(api);
    console.log("✅ Autosend system loaded successfully");
};

module.exports.onStart = () => {
    console.log("🚀 Autosend is running...");
};
