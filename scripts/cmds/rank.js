const Canvas = require("canvas");
const { uploadZippyshare } = global.utils;

const defaultFontName = "BeVietnamPro-SemiBold";
const defaultPathFontName = `${__dirname}/assets/font/BeVietnamPro-SemiBold.ttf`;
const { randomString } = global.utils;
const percentage = total => total / 100;

Canvas.registerFont(`${__dirname}/assets/font/BeVietnamPro-Bold.ttf`, { family: "BeVietnamPro-Bold" });
Canvas.registerFont(defaultPathFontName, { family: defaultFontName });

let deltaNext;
const expToLevel = (exp, deltaNextLevel = deltaNext) => Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNextLevel)) / 2);
const levelToExp = (level, deltaNextLevel = deltaNext) => Math.floor(((Math.pow(level, 2) - level) * deltaNextLevel) / 2);
global.client.makeRankCard = makeRankCard;

module.exports = {
    config: {
        name: "rank",
        version: "1.8",
        author: "NTKhang",
        countDown: 5,
        role: 0,
        description: {
            vi: "Xem level của bạn hoặc người được tag. Có thể tag nhiều người",
            en: "View your level or the level of the tagged person. You can tag many people"
        },
        category: "rank",
        guide: {
            vi: "   {pn} [để trống | @tags]",
            en: "   {pn} [empty | @tags]"
        },
        envConfig: {
            deltaNext: 5
        }
    },

    onStart: async function ({ message, event, usersData, threadsData, commandName, envCommands, api }) {
        deltaNext = envCommands[commandName].deltaNext;
        let targetUsers;
        const arrayMentions = Object.keys(event.mentions);

        if (arrayMentions.length == 0)
            targetUsers = [event.senderID];
        else
            targetUsers = arrayMentions;

        const rankCards = await Promise.all(targetUsers.map(async userID => {
            const rankCard = await makeRankCard(userID, usersData, threadsData, event.threadID, deltaNext, api);
            rankCard.path = `${randomString(10)}.png`;
            return rankCard;
        }));

        return message.reply({ attachment: rankCards });
    },

    onChat: async function ({ usersData, event }) {
        let { exp } = await usersData.get(event.senderID);
        if (isNaN(exp) || typeof exp != "number") exp = 0;
        try { await usersData.set(event.senderID, { exp: exp + 1 }); }
        catch (e) { }
    }
};

const defaultDesignCard = {
    widthCard: 2000,
    heightCard: 500,
    main_color: "#474747",
    sub_color: "rgba(255, 255, 255, 0.5)",
    alpha_subcard: 0.9,
    exp_color: "#e1e1e1",
    expNextLevel_color: "#3f3f3f",
    text_color: "#000000"
};

async function makeRankCard(userID, usersData, threadsData, threadID, deltaNext, api = global.GoatBot.fcaApi) {
    const { exp } = await usersData.get(userID);
    const levelUser = expToLevel(exp, deltaNext);
    const expNextLevel = levelToExp(levelUser + 1, deltaNext) - levelToExp(levelUser, deltaNext);
    const currentExp = expNextLevel - (levelToExp(levelUser + 1, deltaNext) - exp);

    const allUser = await usersData.getAll();
    allUser.sort((a, b) => b.exp - a.exp);
    const rank = allUser.findIndex(user => user.userID == userID) + 1;

    const customRankCard = await threadsData.get(threadID, "data.customRankCard") || {};
    const dataLevel = {
        exp: currentExp,
        expNextLevel,
        name: allUser[rank - 1].name,
        rank: `#${rank}/${allUser.length}`,
        level: levelUser,
        avatar: await usersData.getAvatarUrl(userID)
    };

    const configRankCard = { ...defaultDesignCard, ...customRankCard };
    const checkImagKey = ["main_color", "sub_color", "line_color", "exp_color", "expNextLevel_color"];
    for (const key of checkImagKey) {
        if (!isNaN(configRankCard[key]))
            configRankCard[key] = await api.resolvePhotoUrl(configRankCard[key]);
    }

    const image = new RankCard({ ...configRankCard, ...dataLevel });

    // VIP detection
    const vipData = require("./vip.js"); // আপনার vip.js ফাইল থেকে data
    const isVIP = vipData.includes(userID); // vip.js থেকে array বা object অনুযায়ী চেক করুন
    image.isVIP = isVIP;

    return await image.buildCard();
}

class RankCard {
    constructor(options) {
        this.widthCard = 2000;
        this.heightCard = 500;
        this.main_color = "#474747";
        this.sub_color = "rgba(255, 255, 255, 0.5)";
        this.alpha_subcard = 0.9;
        this.exp_color = "#e1e1e1";
        this.expNextLevel_color = "#3f3f3f";
        this.text_color = "#000000";
        this.fontName = "BeVietnamPro-Bold";
        this.textSize = 0;

        for (const key in options)
            this[key] = options[key];
    }

    async buildCard() {
        const {
            widthCard, heightCard, main_color, sub_color, alpha_subcard, exp_color, expNextLevel_color,
            text_color, name_color, level_color, rank_color, line_color, exp_text_color,
            exp, expNextLevel, name, level, rank, avatar, isVIP
        } = this;

        const canvas = Canvas.createCanvas(widthCard, heightCard);
        const ctx = canvas.getContext("2d");

        // Draw sub card
        const alignRim = 3 * percentage(widthCard);
        ctx.globalAlpha = alpha_subcard;
        await checkColorOrImageAndDraw(alignRim, alignRim, widthCard - alignRim * 2, heightCard - alignRim * 2, ctx, sub_color, 20, alpha_subcard);
        ctx.globalAlpha = 1;

        // Draw avatar
        const xyAvatar = heightCard / 2;
        const resizeAvatar = 60 * percentage(heightCard);
        centerImage(ctx, await Canvas.loadImage(avatar), xyAvatar, xyAvatar, resizeAvatar, resizeAvatar);

        // Draw VIP badge if user is VIP
        if (isVIP) {
            const vipBadgeUrl = "https://files.catbox.moe/46spgx.jpeg";
            const badgeSize = 10 * (widthCard / 100);
            const xBadge = widthCard - badgeSize - 20;
            const yBadge = 20;
            const badgeImg = await Canvas.loadImage(vipBadgeUrl);
            ctx.drawImage(badgeImg, xBadge, yBadge, badgeSize, badgeSize);
        }

        // Draw exp bar
        const radius = 6 * percentage(heightCard);
        const xStartExp = (25 + 1.5) * percentage(widthCard);
        const yStartExp = 67 * percentage(heightCard);
        const widthExp = 40.5 * percentage(widthCard);
        const heightExp = radius * 2;

        // Exp next level
        if (!isUrl(expNextLevel_color)) {
            ctx.fillStyle = checkGradientColor(ctx, expNextLevel_color, xStartExp, yStartExp, xStartExp + widthExp, yStartExp);
            ctx.beginPath();
            ctx.arc(xStartExp, yStartExp + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI, true);
            ctx.fill();
            ctx.fillRect(xStartExp, yStartExp, widthExp, heightExp);
            ctx.arc(xStartExp + widthExp, yStartExp + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI, false);
            ctx.fill();
        }

        // Current exp
        const widthExpCurrent = (100 / expNextLevel * exp) * percentage(widthExp);
        if (!isUrl(exp_color)) {
            ctx.fillStyle = checkGradientColor(ctx, exp_color, xStartExp, yStartExp, xStartExp + widthExp, yStartExp);
            ctx.beginPath();
            ctx.arc(xStartExp, yStartExp + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI, true);
            ctx.fill();
            ctx.fillRect(xStartExp, yStartExp, widthExpCurrent, heightExp);
            ctx.beginPath();
            ctx.arc(xStartExp + widthExpCurrent - 1, yStartExp + radius, radius, 1.5 * Math.PI, 0.5 * Math.PI);
            ctx.fill();
        }

        // Draw text (name, rank, level, exp)
        ctx.textAlign = "center";
        ctx.font = autoSizeFont(52.1 * percentage(widthCard), 4 * percentage(widthCard) + this.textSize, name, ctx, this.fontName);
        ctx.fillStyle = checkGradientColor(ctx, name_color || text_color, 47.5 * percentage(widthCard) - ctx.measureText(name).width / 2, 40 * percentage(heightCard), 47.5 * percentage(widthCard) + ctx.measureText(name).width / 2, 40 * percentage(heightCard));
        ctx.fillText(name, 47.5 * percentage(widthCard), 40 * percentage(heightCard));

        ctx.font = autoSizeFont(18.4 * percentage(widthCard), 4 * percentage(widthCard) + this.textSize, rank, ctx, this.fontName);
        ctx.fillStyle = checkGradientColor(ctx, rank_color || text_color, 94 * percentage(widthCard) - ctx.measureText(rank).width, 76 * percentage(heightCard), 94 * percentage(widthCard), 76 * percentage(heightCard));
        ctx.fillText(rank, 94 * percentage(widthCard), 76 * percentage(heightCard));

        ctx.font = autoSizeFont(9.8 * percentage(widthCard), 3.25 * percentage(widthCard) + this.textSize, `Lv ${level}`, ctx, this.fontName);
        ctx.fillStyle = checkGradientColor(ctx, level_color || text_color, 94 * percentage(widthCard) - ctx.measureText(`Lv ${level}`).width, 32 * percentage(heightCard), 94 * percentage(widthCard), 32 * percentage(heightCard));
        ctx.fillText(`Lv ${level}`, 94 * percentage(widthCard), 32 * percentage(heightCard));

        ctx.font = autoSizeFont(49 * percentage(widthCard), 2 * percentage(widthCard) + this.textSize, `Exp ${exp}/${expNextLevel}`, ctx, this.fontName);
        ctx.fillStyle = checkGradientColor(ctx, exp_text_color || text_color, 47.5 * percentage(widthCard) - ctx.measureText(`Exp ${exp}/${expNextLevel}`).width / 2, 61.4 * percentage(heightCard), 47.5 * percentage(widthCard) + ctx.measureText(`Exp ${exp}/${expNextLevel}`).width / 2, 61.4 * percentage(heightCard));
        ctx.fillText(`Exp ${exp}/${expNextLevel}`, 47.5 * percentage(widthCard), 61.4 * percentage(heightCard));

        return canvas.createPNGStream();
    }
}

// Helper functions (checkColorOrImageAndDraw, drawSquareRounded, roundedImage, centerImage, autoSizeFont, checkGradientColor, isUrl, percentage) 
// একইভাবে আগে লেখা অনুযায়ী থাকবে। তুমি চাইলে আমি পুরো helper ফাংশনগুলিও final ফাইলে যোগ করে ready-to-run করে দিতে পারি।

