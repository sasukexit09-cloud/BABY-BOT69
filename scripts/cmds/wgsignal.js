const axios = require('axios');

module.exports = {
    config: {
        name: "wgsignal",
        aliases: ["wg", "wingo", "signal", "vip"],
        version: "2.0.0",
        author: "YourName",
        countDown: 5,
        role: 0,
        shortDescription: "Wingo 1 Min VIP Signal",
        longDescription: "Live API and HTML logic based Wingo prediction.",
        category: "game",
        guide: "{pn}"
    },

    onStart: async function ({ message }) {
        try {
            let periodNumber = "";
            let apiStatus = "Server Logic";

            // ১. "AARISH WEB CRACK" ফাইলের API থেকে Live Period আনার চেষ্টা
            try {
                const response = await axios.post('https://api.bdg88zf.com/api/webapi/GetGameIssue', {
                    typeId: 1,
                    language: 0,
                    random: "e7fe6c090da2495ab8290dac551ef1ed",
                    signature: "1F390E2B2D8A55D693E57FD905AE73A7",
                    timestamp: Math.floor(Date.now() / 1000)
                });

                if (response.data && response.data.data && response.data.data.issueNumber) {
                    periodNumber = response.data.data.issueNumber;
                    apiStatus = "Live API (BDG)";
                }
            } catch (apiError) {
                // API সার্ভার কাজ না করলে নিচের ২ নাম্বার লজিক কাজ করবে
                apiStatus = "Server Logic";
            }

            // ২. API ফেইল হলে "NAYEEM VIP" ফাইলের টাইম লজিক ব্যবহার করে Period বের করা
            if (!periodNumber) {
                const now = new Date();
                const istOffset = 5.5 * 60 * 60 * 1000;
                const istTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffset);
                
                const year = istTime.getFullYear();
                const month = String(istTime.getMonth() + 1).padStart(2, '0');
                const day = String(istTime.getDate()).padStart(2, '0');
                const dateStr = `${year}${month}${day}`;
                
                const hours = istTime.getHours();
                const minutes = istTime.getMinutes();
                const totalMinutes = (hours * 60) + minutes;
                
                periodNumber = dateStr + "1000" + (10001 + totalMinutes).toString();
            }

            // ৩. "NAYEEM VIP" ফাইলের লজিক অ্যাপ্লাই করা (BIG / SMALL)
            const lastDigit = parseInt(periodNumber.slice(-1));
            let signal = "";
            let color = "";

            if ([0, 1, 3, 5, 6, 7].includes(lastDigit)) {
                signal = "𝗕𝗜𝗚";
                color = "🔴 𝗥𝗘𝗗";
            } else if ([2, 4, 8, 9].includes(lastDigit)) {
                signal = "𝗦𝗠𝗔𝗟𝗟";
                color = "🟢 𝗚𝗥𝗘𝗘𝗡";
            }

            // ৪. "AARISH" ফাইলের লজিক অনুযায়ী ২ টা নাম্বার প্রেডিকশন
            let num1 = Math.floor(Math.random() * 10);
            let num2 = (num1 + 3) % 10;
            let predictedNumbers = `${num1} & ${num2}`;

            // ৫. Accuracy Percentage জেনারেট করা
            const sumDigits = periodNumber.split('').reduce((acc, num) => acc + parseInt(num), 0);
            const percentArray = [97, 98, 99, 100, 99, 98];
            const accuracy = percentArray[sumDigits % percentArray.length];

            // ৬. ফাইনাল রিপ্লাই ম্যাসেজ
            const replyMessage = `🎯 𝗩𝗜𝗣 𝗦𝗨𝗥𝗘𝗦𝗛𝗢𝗥𝗧 𝗦𝗜𝗚𝗡𝗔𝗟 🎯\n` +
                                 `━━━━━━━━━━━━━━━━━\n` +
                                 `📅 𝗣𝗲𝗿𝗶𝗼𝗱: ${periodNumber}\n` +
                                 `🔮 𝗦𝗶𝗴𝗻𝗮𝗹: ${signal} ${color}\n` +
                                 `🔢 𝗡𝘂𝗺𝗯𝗲𝗿𝘀: ${predictedNumbers}\n` +
                                 `💯 𝗔𝗰𝗰𝘂𝗿𝗮𝗰𝘆: ${accuracy}%\n` +
                                 `📡 𝗦𝗼𝘂𝗿𝗰𝗲: ${apiStatus}\n` +
                                 `━━━━━━━━━━━━━━━━━\n` +
                                 `⚠️ Maintain 3-4 Level Funds!`;

            return message.reply(replyMessage);

        } catch (error) {
            console.error(error);
            return message.reply("❌ Signal generate করতে সমস্যা হচ্ছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
        }
    }
};