module.exports.config = {
    name: "bf",
    version: "7.3.1",
    hasPermssion: 0,
    credits: "AYAN✨", 
    description: "Get Pair From Mention",
    commandCategory: "img",
    usages: "[@mention]",
    cooldowns: 5, 
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "path": "",
        "jimp": ""
    }
};

const fs = global.nodemodule["fs-extra"];
const path = global.nodemodule["path"];
const axios = global.nodemodule["axios"];
const jimp = global.nodemodule["jimp"];

module.exports.onLoad = async () => {
    const { downloadFile } = global.utils;

    // Cache directory
    const dir = path.resolve(__dirname, 'cache', 'canvas');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Default background image
    const filePath = path.join(dir, 'arr2.png');
    if (!fs.existsSync(filePath)) {
        console.log("[bf] Downloading default background image...");
        await downloadFile("https://i.imgur.com/iaOiAXe.jpeg", filePath);
        console.log("[bf] Background image ready!");
    } else {
        console.log("[bf] Background image already exists.");
    }
};

async function circle(image) {
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
    const dir = path.resolve(__dirname, 'cache', 'canvas');
    const baseImg = await jimp.read(path.join(dir, 'arr2.png'));
    const pathImg = path.join(dir, `batman_${one}_${two}.png`);
    const avatarOne = path.join(dir, `avt_${one}.png`);
    const avatarTwo = path.join(dir, `avt_${two}.png`);

    // Load avatars from Facebook
    const getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne));

    const getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo));

    // Create circular avatars
    const circleOne = await jimp.read(await circle(avatarOne));
    const circleTwo = await jimp.read(await circle(avatarTwo));

    // Composite avatars on background
    baseImg.composite(circleOne.resize(200, 200), 70, 110)
           .composite(circleTwo.resize(200, 200), 465, 110);

    // Save final image
    const raw = await baseImg.getBufferAsync("image/png");
    fs.writeFileSync(pathImg, raw);

    // Remove temporary avatars
    fs.unlinkSync(avatarOne);
    fs.unlinkSync(avatarTwo);

    return pathImg;
}

module.exports.run = async function ({ event, api, args }) { 
    const { threadID, messageID, senderID } = event;
    const mention = Object.keys(event.mentions);
    if (!mention[0]) return api.sendMessage("Please mention 1 person.", threadID, messageID);

    const one = senderID, two = mention[0];
    try {
        const pathImg = await makeImage({ one, two });
        return api.sendMessage({
            body: "╔═════❖••° °••❖═════╗\n" +
                  " ভালোবাসার সেরা জুটি 💘\n" +
                  "╚═════❖••° °••❖═════╝\n\n" +
                  " ✶⊶⊷⊷⊷⊷❍⊶⊷⊷⊷⊷✶\n" +
                  " 👑 এই নে! এখন থেকে শুধু তোরই ❤️\n" +
                  " 💌 তোর একমাত্র বয়ফ্রেন্ড হাজির 🩷\n" +
                  " ✶⊶⊷⊷⊷⊷❍⊶⊷⊷⊷⊷✶",
            attachment: fs.createReadStream(pathImg)
        }, threadID, () => fs.unlinkSync(pathImg), messageID);
    } catch (e) {
        console.error(e);
        return api.sendMessage("Error generating image. 😢", threadID, messageID);
    }
};
