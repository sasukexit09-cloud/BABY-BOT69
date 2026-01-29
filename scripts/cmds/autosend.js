const axios = require("axios");
const moment = require("moment-timezone");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "autosend",
    version: "4.1",
    role: 2,
    author: "MAHABUB RAHMAN & Gemini (Fixed by ChatGPT)",
    description: "8 AM to 12 AM hourly auto video sender",
    category: "Media",
    countDown: 5
};

const CACHE_DIR = path.join(__dirname, "cache");
const DATA_FILE = path.join(CACHE_DIR, "autosend_data.json");

fs.ensureDirSync(CACHE_DIR);

// ================= DATA =================
function loadData() {
    if (!fs.existsSync(DATA_FILE)) return { lastHour: null };
    return fs.readJsonSync(DATA_FILE);
}

function saveData(data) {
    fs.writeJsonSync(DATA_FILE, data);
}

// ================= AUTOSEND =================
async function handleAutosend(api) {
    setInterval(async () => {
        const now = moment().tz("Asia/Dhaka");

        const hour = now.hour(); // 0–23
        if (hour < 8 || hour >= 24) return; // 8AM–12AM only

        const currentHour = now.format("YYYY-MM-DD-HH");
        const data = loadData();

        // এই hour এ আগেই পাঠানো হলে skip
        if (data.lastHour === currentHour) return;

        try {
            console.log(`[AUTOSEND] Triggered at ${now.format("hh:mm A")}`);

            const inbox = await api.getThreadList(100, null, ["INBOX"]);
            const groupThreads = inbox.filter(t => t.isGroup && t.isSubscribed);
            if (!groupThreads.length) return;

            const videoData = await downloadVideo();
            if (!videoData) return;

            for (const thread of groupThreads) {
                try {
                    await api.sendMessage(
                        {
                            body: `━━━━━━━━━━━━━━━━
🕒 সময়: ${now.format("hh:mm A")}
🎬 ${videoData.title}
━━━━━━━━━━━━━━━━
Enjoy your video ✨`,
                            attachment: fs.createReadStream(videoData.path)
                        },
                        thread.threadID
                    );

                    // safe delay
                    await new Promise(r => setTimeout(r, 5000));
                } catch (e) {
                    console.log(`❌ Failed: ${thread.threadID}`);
                }
            }

            saveData({ lastHour: currentHour });

            if (fs.existsSync(videoData.path)) {
                fs.unlinkSync(videoData.path);
            }

            console.log("✅ Autosend completed");

        } catch (err) {
            console.error("❌ Autosend Error:", err);
        }
    }, 30 * 1000); // প্রতি ৩০ সেকেন্ডে চেক
}

// ================= VIDEO DOWNLOAD =================
async function downloadVideo() {
    const tempFile = path.join(CACHE_DIR, `auto_${Date.now()}.mp4`);

    try {
        const res = await axios.get("https://mahabub-apis.vercel.app/mahabub");
        const videoUrl = res.data?.data || res.data?.url || res.data?.video;
        const title = res.data?.title || "Auto Video";

        if (!videoUrl) return null;

        const video = await axios.get(videoUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(tempFile, Buffer.from(video.data));

        return { path: tempFile, title };
    } catch {
        console.log("❌ Video download error");
        return null;
    }
}

// ================= LOAD =================
module.exports.onLoad = ({ api }) => {
    if (global.autosendLoaded) return;
    global.autosendLoaded = true;
    handleAutosend(api);
    console.log("✅ Autosend system loaded (08 AM – 12 AM)");
};

module.exports.onStart = ({ api, event }) => {
    api.sendMessage(
        "🚀 Autosend Active\n⏰ Time: 8:00 AM – 12:00 AM\n📹 Every hour auto video",
        event.threadID
    );
};
