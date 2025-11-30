const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: "fakechat",
        aliases: ["fc"],
        version: "1.0",
        author: "Vex_kshitiz",
        countDown: 5,
        role: 0,
        shortDescription: "Messenger style fake chat",
        longDescription: "Create Messenger style fake chat images",
        category: "fun",
        guide: "{p} fakechat uid | {text} or {p} fakechat @mention | {text} or reply to someone text by fakechat {text} -{theme}"
    },

    onStart: async function({ event, message, usersData, api, args }) {
        const { senderID, type, messageReply, mentions } = event;

        // Determine UID and text
        let uid, mentionName;
        let textSegments = args.slice(1).join(" ").split(" | ");
        let theme = null;

        const themeMatch = args.join(" ").match(/-\d+$/);
        if (themeMatch) {
            theme = themeMatch[0];
            textSegments = args.join(" ").replace(theme, '').split(" | ");
        }

        if (mentions && Object.keys(mentions).length > 0) {
            uid = Object.keys(mentions)[0];
            mentionName = mentions[uid].replace('@', '').split(' ')[0];
            textSegments = args.slice(2).join(" ").split(" | ");
        } else if (/^\d+$/.test(args[0])) {
            uid = args[0];
        } else if (type === "message_reply") {
            uid = messageReply.senderID;
            textSegments = args.join(" ").split(" | ");
        } else {
            return message.reply("Please mention or provide a UID.");
        }

        try {
            const userInfo = await getUserInfo(api, uid);
            const firstName = userInfo.name.split(' ')[0];
            const avatarUrl = await usersData.getAvatarUrl(uid);

            // Canvas setup
            const canvasWidth = 800;
            const lineHeight = 35;
            const sidePadding = 20;
            const bubblePadding = 15;
            let currentY = 50;
            const chatBubbles = [];

            // Load font (cached locally)
            const fontPath = path.join(__dirname, 'MessengerFont.ttf');
            if (!fs.existsSync(fontPath)) {
                const fontUrl = 'https://drive.google.com/uc?export=download&id=1MYZkDHgHtGgyVEf2bFrOc0A-tlFvzYqL';
                await downloadFile(fontUrl, fontPath);
            }
            registerFont(fontPath, { family: 'Messenger' });

            // Prepare bubbles
            const ctxTemp = createCanvas(1,1).getContext('2d');
            ctxTemp.font = `25px Messenger`;
            const maxTextWidth = canvasWidth - 200;

            for (let text of textSegments) {
                const lines = wrapText(ctxTemp, text, maxTextWidth - bubblePadding*2);
                const bubbleHeight = lines.length * lineHeight + bubblePadding*2;
                chatBubbles.push({ text, lines, height: bubbleHeight });
            }

            // Calculate canvas height dynamically
            let totalHeight = chatBubbles.reduce((sum, b) => sum + b.height + 15, 0) + 50;
            const canvas = createCanvas(canvasWidth, totalHeight);
            const ctx = canvas.getContext('2d');

            // Background (dark like Messenger)
            ctx.fillStyle = theme === '-1' ? '#2b2b2b' : '#f0f0f0';
            ctx.fillRect(0,0,canvas.width,canvas.height);

            // Draw bubbles
            for (let bubble of chatBubbles) {
                const bubbleWidth = Math.min(maxTextWidth, ctx.measureText(bubble.text).width + bubblePadding*2 + 20);

                // Left bubble = user
                const bubbleX = 100;
                ctx.fillStyle = '#0078ff';
                roundRect(ctx, bubbleX, currentY, bubbleWidth, bubble.height, 20, true, false);

                // Draw text
                ctx.fillStyle = '#fff';
                ctx.font = `25px Messenger`;
                ctx.textBaseline = 'top';
                let textY = currentY + bubblePadding;
                for (let line of bubble.lines) {
                    ctx.fillText(line, bubbleX + bubblePadding, textY);
                    textY += lineHeight;
                }

                currentY += bubble.height + 15;
            }

            // Draw avatar
            const avatarImg = await loadImage(avatarUrl);
            const avatarSize = 60;
            ctx.beginPath();
            ctx.arc(60 + avatarSize/2, 50 + avatarSize/2, avatarSize/2, 0, Math.PI*2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarImg, 60, 50, avatarSize, avatarSize);

            // Save output
            const outputPath = path.join(__dirname, `fakechat_${Date.now()}.png`);
            const out = fs.createWriteStream(outputPath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);
            out.on('finish', () => {
                message.reply({
                    body: '',
                    attachment: fs.createReadStream(outputPath)
                }, () => fs.unlinkSync(outputPath));
            });

        } catch (err) {
            console.error(err);
            message.reply('❌ Failed to create Messenger style fake chat.');
        }
    }
};

// Helper: Wrap text
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (let word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        if (ctx.measureText(testLine).width > maxWidth) {
            if (line) lines.push(line);
            line = word;
        } else {
            line = testLine;
        }
    }
    if (line) lines.push(line);
    return lines;
}

// Helper: Draw rounded rectangle
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'number') r = {tl:r,tr:r,br:r,bl:r};
    ctx.beginPath();
    ctx.moveTo(x+r.tl, y);
    ctx.lineTo(x+w-r.tr, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r.tr);
    ctx.lineTo(x+w, y+h-r.br);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r.br, y+h);
    ctx.lineTo(x+r.bl, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r.bl);
    ctx.lineTo(x, y+r.tl);
    ctx.quadraticCurveTo(x, y, x+r.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

// Helper: Download file
async function downloadFile(url, outputPath) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(outputPath, res.data);
}

// Helper: Get user info
async function getUserInfo(api, uid) {
    return new Promise((resolve, reject) => {
        api.getUserInfo(uid, (err, ret) => {
            if (err) return reject(err);
            resolve(ret[uid]);
        });
    });
}
