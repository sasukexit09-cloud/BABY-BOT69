const express = require("express");
const os = require("os");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3000;

// ==== SETTINGS ====
const BOT_NAME = "mybot";

// Static files
app.use("/static", express.static(path.join(__dirname, "static")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==== DASHBOARD ====
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Owner Dashboard</title>
        <style>
          body { font-family:sans-serif; background:#111; color:#fff; text-align:center; padding:50px;}
          input, button { padding:10px; margin:5px; border-radius:5px; border:none; }
          button { cursor:pointer; background:#00aaff; color:white; }
          pre { background:#222; padding:20px; border-radius:10px; text-align:left;}
        </style>
      </head>
      <body>
        <h1>Owner Dashboard</h1>
        <p>Type <code>!cpanel</code> to check bot/system status</p>
        <form id="cmdForm">
          <input type="text" id="command" placeholder="Enter command" style="width:300px"/>
          <button type="submit">Run</button>
        </form>
        <pre id="output"></pre>

        <script>
          const form = document.getElementById('cmdForm');
          const output = document.getElementById('output');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cmd = document.getElementById('command').value;
            const res = await fetch('/command', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command: cmd })
            });
            const data = await res.json();
            output.innerText = data.output;
          });
        </script>
      </body>
    </html>
  `);
});

// ==== COMMAND ROUTE ====
app.post("/command", (req, res) => {
  const { command } = req.body;

  // Safety check: only allow !cpanel for now
  if(command.trim() === "!cpanel") {
    exec("pm2 list", (err, stdout, stderr) => {
      const cpu = Math.round(os.loadavg()[0] * 100 / os.cpus().length);
      const ram = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
      const online = stdout.includes(BOT_NAME) && stdout.includes("online");

      res.json({
        output: `
Bot Status: ${online ? "🟢 ONLINE" : "🔴 OFFLINE"}
CPU Usage: ${cpu}%
RAM Usage: ${ram}%
PM2 Output:
${stdout || stderr}
        `
      });
    });
  } else {
    res.json({ output: "❌ Command not allowed" });
  }
});

// ==== SERVER ====
app.listen(PORT, () => {
  console.log(`🌈 Dashboard running on http://localhost:${PORT}`);
});
