const express = require("express");
const os = require("os");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3000;

const BOT_FILE = path.join(__dirname, "bot.js");
const BOT_NAME = "mybot";

app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, "static")));

app.get("/", (req, res) => {
  exec(`pm2 list`, (err, stdout) => {
    const online = stdout.includes(BOT_NAME) && stdout.includes("online");

    res.send(`
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Owner Dashboard</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');
        * { margin:0; padding:0; box-sizing:border-box;}
        html, body { width:100%; height:100%; overflow:hidden; font-family: 'Roboto', sans-serif;}
        body {
          color:white;
          display:flex;
          flex-direction:column;
          justify-content:center;
          align-items:center;
          background: linear-gradient(270deg, #ff6ec4, #7873f5, #42e695, #ffcb6b);
          background-size: 800% 800%;
          animation: gradientBG 20s ease infinite;
        }
        @keyframes gradientBG {
          0%{background-position:0% 50%}
          25%{background-position:50% 50%}
          50%{background-position:100% 50%}
          75%{background-position:50% 50%}
          100%{background-position:0% 50%}
        }
        h1 { font-size:3em; margin-bottom:20px; text-align:center; text-shadow: 2px 2px 10px #000;}
        p { font-size:1.5em; margin-bottom:25px; text-align:center; }
        .gif-container { display:flex; gap:15px; flex-wrap:wrap; justify-content:center; margin-bottom:25px; }
        .gif-container img { width:120px; border-radius:15px; box-shadow: 0 0 20px rgba(0,0,0,0.5);}
        .bar-container { width:80%; max-width:600px; background: rgba(255,255,255,0.2); margin:15px auto; border-radius:15px; height:30px; overflow:hidden; }
        .bar { width:0%; height:100%; border-radius:15px; transition: width 0.5s; text-align:right; padding-right:10px; font-weight:bold; color:white; line-height:30px;
          background: linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet);
          background-size: 400% 100%;
          animation: rainbow 3s linear infinite;
        }
        @keyframes rainbow {
          0% { background-position:0% 0%; }
          100% { background-position:400% 0%; }
        }
      </style>
    </head>
    <body>
      <h1>🤖 OWNER DASHBOARD</h1>
      <p>Status: ${online ? "🟢 ONLINE" : "🔴 OFFLINE"}</p>

      <div class="gif-container">
        <img src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif"/>
        <img src="https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif"/>
        <img src="https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif"/>
      </div>

      <div class="bar-container">
        <div id="cpuBar" class="bar">CPU 0%</div>
      </div>
      <div class="bar-container">
        <div id="ramBar" class="bar">RAM 0%</div>
      </div>

      <script>
        async function updateStats() {
          const res = await fetch('/stats');
          const data = await res.json();
          document.getElementById('cpuBar').style.width = data.cpu + '%';
          document.getElementById('cpuBar').innerText = 'CPU ' + data.cpu + '%';
          document.getElementById('ramBar').style.width = data.ram + '%';
          document.getElementById('ramBar').innerText = 'RAM ' + data.ram + '%';
        }
        setInterval(updateStats, 1000);
        updateStats();
      </script>
    </body>
    </html>
    `);
  });
});

// ===== STATS API =====
app.get("/stats", (req, res) => {
  const cpus = os.cpus();
  const cpuLoad = Math.round(
    cpus.reduce((acc, cpu) => acc + cpu.times.user, 0) / cpus.length / 100
  );
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMemPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

  res.json({ cpu: cpuLoad, ram: usedMemPercent });
});

// ===== SERVER =====
app.listen(PORT, () => {
  console.log(`🌈 Owner Dashboard running on http://localhost:${PORT}`);
});
