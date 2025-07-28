/**
 * Goat Bot Render Deployment Fix + Memory Auto-Restart by Eren 💥
 */

const express = require("express");
const { spawn } = require("child_process");
const log = require("./logger/log.js");

const app = express();
const PORT = process.env.PORT || 3000;
let childProcess = null;

// === Express Server for Render Uptime ===
app.get("/", (req, res) => {
	res.send("🐐 EREN BOT RUNNING\nAuthor: Eren\nStatus: Smooth 🥵");
});

app.listen(PORT, () => {
	console.log(`✅ Server running at http://localhost:${PORT}`);
});

// === Start Goat Bot Function ===
function startProject() {
	childProcess = spawn("node", ["Goat.js"], {
		cwd: __dirname,
		stdio: "inherit",
		shell: true
	});

	childProcess.on("close", (code) => {
		console.log(`❌ Bot exited with code: ${code}`);
		if (code === 2 || code === 0 || code === null) {
			log.info("🔁 Restarting Project...");
			startProject();
		}
	});
}

// === Memory Monitor ===
const MAX_MEMORY_MB = 450; // 🔴 Memory limit set to 450MB

setInterval(() => {
	const memoryUsageMB = process.memoryUsage().rss / (1024 * 1024);

	if (memoryUsageMB > MAX_MEMORY_MB) {
		console.log(`🚨 Memory usage too high: ${memoryUsageMB.toFixed(2)} MB`);
		log.info("🔁 Restarting due to high memory usage...");
		
		if (childProcess) {
			childProcess.kill();
		}

		startProject();
	}
}, 15 * 1000); // ✅ Check every 15 seconds

// === Start Initial Project ===
startProject();
