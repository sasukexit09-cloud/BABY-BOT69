const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: "fakechat",
        aliases: ["fc"],
        version: "1.6",
        author: "🥵AYAN BBE🥵💋",
        shortDescription: "Messenger dark chat with dynamic bubble",
        longDescription: "Fully dynamic bubble size based on text length and lines",
        category: "fun",
        guide: "{p} fakechat uid | {text} or {p} fakechat @mention | {text} or reply to someone text by fakechat {text}"
    },

    onStart: async function({ event, message, usersData, api, args }) {
        const { senderID, type, messageReply, mentions } = event;

        let uid;
        let textSegments = args.slice(1).join(" ").split(" | ");

        if (mentions && Object.keys(mentions).length > 0) {
            uid = Object.keys(mentions)[0];
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
            const senderInfo = await getUserInfo(api, senderID);
            const avatarUrl = await usersData.getAvatarUrl(uid);
            const senderAvatar = await usersData.getAvatarUrl(senderID);

            const canvasWidth = 800;
            const lineHeight = 30;
            const bubblePaddingX = 20;
            const bubblePaddingY = 15;
            let currentY = 80;
            const chatBubbles = [];

            // Load font
            const fontPath = path.join(__dirname, 'MessengerFont.ttf');
            if (!fs.existsSync(fontPath)) {
                const fontUrl = 'https://drive.google.com/uc?export=download&id=1MYZkDHgHtGgyVEf2bFrOc0A-tlFvzYqL';
                await downloadFile(fontUrl, fontPath);
            }
            registerFont(fontPath, { family: 'Messenger' });

            const ctxTemp = createCanvas(1,1).getContext('2d');
            ctxTemp.font = `25px Messenger`;
            const maxTextWidth = canvasWidth - 200;

            // Prepare chat bubbles
            for (let text of textSegments) {
                const lines = wrapText(ctxTemp, text, maxTextWidth - bubblePaddingX*2);
                let textWidth = Math.max(...lines.map(line => ctxTemp.measureText(line).width));
                const bubbleWidth = Math.min(maxTextWidth, Math.max(textWidth + bubblePaddingX*2, 60)); // dynamic width
                const bubbleHeight = lines.length * lineHeight + bubblePaddingY*2; // dynamic height
                chatBubbles.push({ text, lines, width: bubbleWidth, height: bubbleHeight });
            }

            // calculate canvas height
            let totalHeight = chatBubbles.reduce((sum, b) => sum + b.height + 50, 0) + 50;
            const canvas = createCanvas(canvasWidth, totalHeight);
            const ctx = canvas.getContext('2d');

            // Dark theme
            const backgroundColor = '#2b2b2b';
            const leftBubbleColor = '#3a3a3a';
            const rightBubbleColor = '#056fff';
            const leftTextColor = '#fff';
            const rightTextColor = '#fff';

            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0,0,canvas.width,canvas.height);

            let isLeft = true;
            for (let bubble of chatBubbles) {
                const bubbleX = isLeft ? 100 : canvasWidth - bubble.width - 100;
                const avatarImg = isLeft ? await loadImage(avatarUrl) : await loadImage(senderAvatar);
                const avatarSize = 50;

                // Draw sender name
                const name = isLeft ? userInfo.name.split(' ')[0] : senderInfo.name.split(' ')[0];
                ctx.fillStyle = isLeft ? leftTextColor : rightTextColor;
                ctx.font = `20px Messenger`;
                ctx.textBaseline = 'bottom';
                ctx.fillText(name, isLeft ? 40 : canvasWidth - 40 - ctx.measureText(name).width, currentY - 10);

                // Bubble with shadow
                ctx.fillStyle = isLeft ? leftBubbleColor : rightBubbleColor;
                ctx.shadowColor = "rgba(0,0,0,0.2)";
                ctx.shadowBlur = 4;
                roundRect(ctx, bubbleX, currentY, bubble.width, bubble.height, 20, true, false);

                // Vertical center text
                ctx.fillStyle = isLeft ? leftTextColor : rightTextColor;
                ctx.font = `25px Messenger`;
                ctx.textBaseline = 'middle';
                let totalTextHeight = bubble.lines.length * lineHeight;
                let textY = currentY + (bubble.height - totalTextHeight)/2 + lineHeight/2;
                for (let line of bubble.lines) {
                    ctx.fillText(line, bubbleX + bubblePaddingX, textY);
                    textY += lineHeight;
                }

                // Avatar
                const avatarX = isLeft ? 40 : canvasWidth - 40 - avatarSize;
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX + avatarSize/2, currentY + bubble.height/2, avatarSize/2, 0, Math.PI*2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatarImg, avatarX, currentY + (bubble.height - avatarSize)/2, avatarSize, avatarSize);
                ctx.restore();

                // Seen tick for right messages
                if(!isLeft){
                    ctx.fillStyle = '#00a2ff';
                    ctx.font = '20px Messenger';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText('✔', bubbleX + bubble.width + 5, currentY + bubble.height - 5);
                }

                currentY += bubble.height + 50;
                isLeft = !isLeft;
            }

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

// Helpers
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (let word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        if (ctx.measureText(testLine).width > maxWidth) {
            if(line) lines.push(line);
            line = word;
        } else line = testLine;
    }
    if(line) lines.push(line);
    return lines;
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if(typeof r === 'number') r={tl:r,tr:r,br:r,bl:r};
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
    if(fill) ctx.fill();
    if(stroke) ctx.stroke();
}

async function downloadFile(url, outputPath) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(outputPath, res.data);
}

async function getUserInfo(api, uid) {
    return new Promise((resolve, reject) => {
        api.getUserInfo(uid, (err, ret) => {
            if(err) return reject(err);
            resolve(ret[uid]);
        });
    });
}
