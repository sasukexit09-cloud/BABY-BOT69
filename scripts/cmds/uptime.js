const os = require("os");
const pidusage = require("pidusage");
const fs = require("fs");
const { createCanvas } = require('canvas'); // loadImage সরানো হয়েছে, কারণ এই কোডে ছবির দরকার নেই
const path = require('path');

// কাস্টম ফন্ট রেজিস্ট্রেশন সরানো হলো - এটি অনেক সময় ইনস্টলেশনের সমস্যা তৈরি করে

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up"],
    version: "2.3",
    author: "TAREK",
    countDown: 1,
    role: 0,
    shortDescription: "Show system and bot status as an image",
    longDescription: "Displays uptime, CPU, memory, disk, and bot stats as a visually appealing image card.",
    category: "info",
    guide: "{pn}",
    noPrefix: true
  },

  // Normal prefix handler
  onStart: async function (ctx) {
    await module.exports.sendUptime(ctx);
  },

  // noPrefix now public
  onChat: async function (ctx) {
    const input = ctx.event.body?.toLowerCase().trim();
    const { config } = module.exports;
    const triggers = [config.name, ...(config.aliases || [])];

    if (!triggers.includes(input)) return;

    await module.exports.sendUptime(ctx);
  },

  sendUptime: async function ({ message, usersData, threadsData }) {
    // --- ১. প্রয়োজনীয় ডেটা সংগ্রহ করা ---
    const now = new Date();
    const formatDate = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    const uptimeBot = process.uptime();
    const uptimeSys = os.uptime();
    const toTime = (sec) => {
      const d = Math.floor(sec / 86400);
      const h = Math.floor((sec % 86400) / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${d ? `${d}d ` : ""}${h}h ${m}m ${s}s`;
    };

    const usage = await pidusage(process.pid);
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(0);
    const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(0);
    const usedRam = (usage.memory / 1024 / 1024).toFixed(1);
    const cpuUsage = usage.cpu.toFixed(1);
    const cpuModel = os.cpus()[0].model;
    const cpuCores = os.cpus().length;
    // package.json ফাইলটির সঠিক পথ নিশ্চিত করা 
    const pkgPath = path.join(process.cwd(), 'package.json');
    let pkgCount = 0;
    try {
        pkgCount = Object.keys(JSON.parse(fs.readFileSync(pkgPath)).dependencies || {}).length;
    } catch (e) {
        // যদি package.json খুঁজে না পায় বা পড়তে না পারে
        console.error("Error reading package.json:", e.message);
        pkgCount = 'N/A';
    }

    const users = await usersData.getAll();
    const threads = await threadsData.getAll();
    
    const diskUsed = '325G / 387G';
    const diskAvailable = '264G';


    // --- ২. ক্যানভাস দিয়ে ইমেজ তৈরি করা ---
    const width = 800;
    const height = 900;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // ব্যাকগ্রাউন্ড ডিজাইন
    ctx.fillStyle = '#1e1e2f'; 
    ctx.fillRect(0, 0, width, height);
    
    // কার্ডের হেডার
    ctx.font = 'bold 55px sans-serif'; 
    ctx.fillStyle = '#ff79c6'; 
    ctx.textAlign = 'center';
    ctx.fillText('⚡️ SYSTEM STATUS', width / 2, 90);
    ctx.strokeStyle = '#6272a4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 110);
    ctx.lineTo(width - 50, 110);
    ctx.stroke();

    // ডেটা লাইনগুলির জন্য শুরু করার y-স্থানাঙ্ক
    let y_offset = 180;
    const line_height = 45;
    const label_color = '#f8f8f2';
    const value_color = '#50fa7b';
    const font_size = 28;
    ctx.textAlign = 'left';

    // সেকশন টাইটেল প্রিন্ট করার ফাংশন
    const drawSectionTitle = (title) => {
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = '#8be9fd';
        ctx.fillText(`— ${title} —`, 50, y_offset);
        y_offset += 40;
    }

    // ডেটা লাইন প্রিন্ট করার ফাংশন
    const drawLine = (label, value) => {
      ctx.font = `${font_size}px sans-serif`;
      ctx.fillStyle = label_color;
      ctx.fillText(label, 60, y_offset);
      
      if (value !== undefined) {
          ctx.font = `bold ${font_size}px sans-serif`;
          ctx.fillStyle = value_color;
          ctx.textAlign = 'right';
          ctx.fillText(value, width - 60, y_offset);
          ctx.textAlign = 'left';
      }
      y_offset += line_height;
    };
    
    // ডেটাগুলি ক্যানভাসে আঁকা
    drawLine('📅 Current Date & Time:', formatDate);
    y_offset += line_height * 0.5;

    drawSectionTitle('⏱️ Uptime & System');
    drawLine('Bot Uptime:', toTime(uptimeBot));
    drawLine('System Uptime:', toTime(uptimeSys));
    y_offset += line_height * 0.5;

    drawSectionTitle('💻 Hardware Status');
    drawLine('CPU Model:', cpuModel);
    drawLine('CPU Cores:', cpuCores.toString());
    drawLine('CPU Load:', `${cpuUsage}%`);
    drawLine('RAM Used:', `${usedRam} MB / ${totalRam} GB`);
    drawLine('Free Memory:', `${freeRam} GB`);
    y_offset += line_height * 0.5;

    drawSectionTitle('📊 Bot Stats');
    drawLine('Total Users:', users.length.toLocaleString());
    drawLine('Total Groups:', threads.length.toLocaleString());
    drawLine('Total Packages:', pkgCount.toLocaleString());
    y_offset += line_height * 0.5;

    drawSectionTitle('💾 Disk Space');
    drawLine('Disk Used:', diskUsed);
    drawLine('Available:', diskAvailable);

    // ফুটার
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#6272a4';
    ctx.textAlign = 'center';
    ctx.fillText('Developed by Tarek Shikdar', width / 2, height - 20);

    // --- ৩. ইমেজ বাফার তৈরি ও পাঠানো ---
    const buffer = canvas.toBuffer('image/png');
    
    const imagePath = path.join(__dirname, `uptime_status_${Date.now()}.png`);
    fs.writeFileSync(imagePath, buffer);

    try {
        await message.reply({
            body: "✨ Bot Uptime and System Status Card:",
            attachment: fs.createReadStream(imagePath)
        });
    } catch (e) {
        console.error("Failed to send image, sending as text.", e);
        // যদি ইমেজ পাঠাতে ব্যর্থ হয়, টেক্সট মেসেজ পাঠানো
        const msg = `Bot Status:
        Uptime: ${toTime(uptimeBot)}
        CPU Load: ${cpuUsage}%
        RAM: ${usedRam} MB / ${totalRam} GB
        Users: ${users.length} | Groups: ${threads.length}
        `;
        await message.reply(msg);
    }
    
    fs.unlinkSync(imagePath);
  }
};
