module.exports.config = {
    name: "boom",
    version: "1.0.2",
    hasPermssion: 2,
    credits: "AYAN ✨",
    description: "War In Chatbox",
    commandCategory: "wargroup",
    usages: "[fyt]",
    cooldowns: 7,
    dependencies: {
        "fs-extra": "",
        "axios": ""
    }
};

module.exports.run = async function({ api, args, event }) {
    try {
        if (!event.mentions || Object.keys(event.mentions).length === 0) {
            return api.sendMessage("⚠️ Please mention a user to boom!", event.threadID);
        }

        const mentionId = Object.keys(event.mentions)[0];
        const mentionName = event.mentions[mentionId];

        const messages = [
            "73R! 83H4N K4 9HUD4 M4RO9 ! G4NDU K4 BACHA 😝😝😝❤️😂😂TERI AMA KI KALI GAND MAROU 😂😂 CONDOMS LGA KY 😂😂😂❤️",
            "777333RRR111 BAAHN KKK111 LLLLAAALLL GGGGAAANNNDDD VVVIICHHH M3RRR444 LLLLOOORRRAAAA 😂😂😂😂",
            "RRRRRRAAAAANNNNNDDDIIIIIII KKKKKKKKKAAAAAAAA BBBBBAAACCCCHHHAAAAA❤️❤️❤️ 😂😂😂",
            "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMAAAAAAADDDDDDEEEEERRRRRRRRRRRRRR CCCCCCHHHHHHOOOOOOOOODDDDDDDD KI OLAD😝😝❤️❤️😂😂😂😂",
            "TTTTTTTTTEEEEERRRRRRIIIIIIIIIIIII BBBBBBBBBBBAAAAAAHHHHHHHAAAAAAAAANNNNNNNNNNNNNNNNNNN KKKKKKKKKAAAAAAAA PPPPPPPPUUUUUUUDDDDAAAAAA MNMMAAAAAARRRRROOOOOUUUUUUUUU 😂😂😂😂🤔🤔😝😝😝😝❤️😂😂😂❤️",
            "BBBBBBBBBBBAAAAAAHHHHHHHAAAAAAAAANNNNNNNNNNNNNNNNNNN 😂😂😂😂CCCCCCHHHHHHOOOOOOOOODDDDDDDD GGGGGGGGGGGGGGGGGAAAAAAAAAAAAAAAAAAAAAAAAAANNNNNNNNNNNNNNNNNNNNNNDDDDDDDDDDDDDDDUUUUUUUUUUUUUU❤️❤️❤️❤️😂😂😂 ❤️",
            "GANG BANG 🫡🫡🫡 TERI AMA KI CHUTHI MAROOOUUUUUU ❤️❤️❤️😂😂😂",
            "TERI AMA KO 100 BAR 🫣🫣🫣 MARU ❤️😂😂😂❤️",
            "MERE BACCHO KI TARAH TERA BACCHA BHI CHUTH MARAEGA 😂😂❤️❤️",
            "HAHAHAHA TERI AMA KI CHUTH MARU ❤️😂😂",
            "GAAND KI CHUTH KO 🔥🔥🔥❤️❤️ MAROOOUU 😂😂",
            "TERI AMA KI CHUTH MARO ❤️❤️😂😂",
            "GANGSTER MOOD ON 😎😎 TERI AMA KI GAND MAROO 😂😂",
            "TERI AMA KI CHUTH MARKE 😂😂❤️❤️",
            "TERI AMA KI CHUTH MAROOOUUU ❤️❤️😂😂",
            "BACCHA BACCHA KO TERI AMA KI CHUTH MAROO ❤️❤️😂😂",
            "TERI AMA KI CHUTH MAROO ❤️😂😂😂❤️",
            "TERI AMA KO 10 BAR MAROO ❤️😂😂",
            "GAAND MAROO TERI AMA KI ❤️❤️😂😂",
            "TERI AMA KI CHUTH MAROO ❤️❤️😂😂",
            "TERI AMA KI CHUTH KI MAA ❤️😂😂",
            "GAND MAROO TERI AMA KI ❤️😂😂",
            "TERI AMA KI CHUTH ❤️❤️😂😂",
            "TERI AMA KI CHUTH KI MAZAAAA ❤️😂😂",
            "GAAND MAROO TERI AMA KI ❤️😂😂",
            "TERI AMA KI CHUTH KI MAA ❤️❤️😂😂",
            "TERI AMA KI CHUTH ❤️😂😂❤️",
            "TERI AMA KI CHUTH MAROO ❤️❤️😂😂",
            "GAND MAROO TERI AMA KI ❤️❤️😂😂",
            "TERI AMA KI CHUTH MAROO ❤️❤️😂😂",
            "TERI AMA KI CHUTH ❤️❤️😂😂",
            "TERI AMA KI CHUTH KI MAZAAAA ❤️❤️😂😂",
            "TERI AMA KI CHUTH KI MAA ❤️❤️😂😂",
            "TERI AMA KI CHUTH ❤️😂😂",
            "GAAND MAROO TERI AMA KI ❤️😂😂",
            "TERI AMA KI CHUTH KI MAA ❤️❤️😂😂",
            "TERI AMA KI CHUTH ❤️❤️😂😂",
            "TERI AMA KI CHUTH MAROO ❤️❤️😂😂",
            "GAND MAROO TERI AMA KI ❤️❤️😂😂",
            "TERI AMA KI CHUTH KI MAZAAAA ❤️❤️😂😂",
            "TERI AMA KI CHUTH ❤️❤️😂😂",
            "TERI AMA KI CHUTH KI MAA ❤️❤️😂😂",
            "TERI AMA KI CHUTH MAROO ❤️❤️😂😂",
            "GAAND MAROO TERI AMA KI ❤️❤️😂😂",
            "TERI AMA KI CHUTH ❤️❤️😂😂",
            "TERI AMA KI CHUTH KI MAA ❤️❤️😂😂",
            "TERI AMA KI CHUTH MAROO ❤️❤️😂😂",
            "GAAND MAROO TERI AMA KI ❤️❤️😂😂",
            "TERI AMA KI CHUTH KI MAZAAAA ❤️❤️😂😂",
            "TERI AMA KI CHUTH ❤️❤️😂😂"
            // Continue adding more messages if needed
        ];

        const delay = 3000; // 3 seconds between messages
        messages.forEach((msg, i) => {
            setTimeout(() => {
                api.sendMessage(msg, event.threadID);
            }, delay * i);
        });

    } catch (err) {
        console.error(err);
        api.sendMessage("❌ An error occurred while executing the boom command!", event.threadID);
    }
};
