/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 *
 * English:
 * ! Please do not change the below code, it is very important for the project.
 * It is my motivation to maintain and develop the project for free.
 * ! If you change it, you will be banned forever
 * Thank you for using
 *
 * Vietnamese:
 * ! Vui lòng không thay đổi mã bên dưới, nó rất quan trọng đối với dự án.
 * Nó là động lực để tôi duy trì và phát triển dự án miễn phí.
 * ! Nếu thay đổi nó, bạn sẽ bị cấm vĩnh viễn
 * Cảm ơn bạn đã sử dụng
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");

function startProject() {
        const child = spawn("node", ["Goat.js"], {
                cwd: __dirname,
                stdio: "inherit",
                shell: true
        });

        child.on("close", (code) => {
                if (code == 2) {
                        log.info("Restarting Project...");
                        startProject();
                }
        });
}

startProject();
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Goat Bot V2 - Status</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          padding: 40px;
          max-width: 600px;
          width: 100%;
          text-align: center;
        }
        .status {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 8px 20px;
          border-radius: 50px;
          font-weight: 600;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        h1 {
          color: #1f2937;
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        .version {
          color: #6b7280;
          font-size: 0.9em;
          margin-bottom: 30px;
        }
        .credits {
          background: #f3f4f6;
          border-radius: 15px;
          padding: 25px;
          margin: 20px 0;
        }
        .credits h2 {
          color: #374151;
          font-size: 1.2em;
          margin-bottom: 15px;
        }
        .credit-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 10px 0;
          color: #4b5563;
        }
        .badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85em;
          font-weight: 600;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.9em;
        }
        a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status">🟢 ONLINE</div>
        <h1>🐐 Goat Bot V2</h1>
        <p class="version">Version 1.5.35 • Node.js v20.19.3</p>
        
        <div class="credits">
          <h2>👨‍💻 Credits</h2>
          <div class="credit-item">
            <span class="badge">Created by</span>
            <strong>NTKhang</strong>
          </div>
          <div class="credit-item">
            <span class="badge">Modified by</span>
            <strong>NeoKEX</strong>
          </div>
        </div>
        
        <div class="footer">
          <p>Bot is running successfully!</p>
          <p style="margin-top: 10px;">
            <a href="https://github.com/ntkhang03/Goat-Bot-V2" target="_blank">Official Repository</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(5000, () => {
  console.log('Uptime server running on port 5000');
});