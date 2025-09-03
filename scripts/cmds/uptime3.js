const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "uptime3",
        aliases: ["up3"],
        version: "1.0",
        author: "TAREK",
        role: 0,
        shortDescription: {
            en: "Generate an Up Time card for a user"
        },
        longDescription: {
            en: "Creates a colorful PNG card showing user's name and their up time."
        },
        category: "fun"
    },

    onStart: async function ({ api, event }) {
        try {
            const senderName = event.senderName || "User";
            const uptimeSeconds = process.uptime();
            const hours = Math.floor(uptimeSeconds / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = Math.floor(uptimeSeconds % 60);
            const upTimeStr = `${hours}h ${minutes}m ${seconds}s`;

            // Canvas setup
            const width = 800;
            const height = 400;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#1E3C72');
            gradient.addColorStop(1, '#2A5298');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Username text
            ctx.font = 'bold 50px Sans';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(senderName, width / 2, height / 2 - 40);

            // Up Time text
            ctx.font = 'bold 40px Sans';
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`Up Time: ${upTimeStr}`, width / 2, height / 2 + 40);

            // Save card temporarily
            const buffer = canvas.toBuffer('image/png');
            const filePath = path.join(__dirname, 'uptime_card.png');
            fs.writeFileSync(filePath, buffer);

            // Send card to Messenger
            await api.sendMessage({ 
                body: `⏱️ ${senderName}'s Up Time`, 
                attachment: fs.createReadStream(filePath) 
            }, event.threadID);

            // Delete temp file
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error(err);
            return api.sendMessage("❌ Error generating Up Time card.", event.threadID);
        }
    }
};
