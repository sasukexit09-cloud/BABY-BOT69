const axios = require('axios');

const baseApiUrl = async () => {
    return "https://www.noobs-api.rf.gd/dipto/baby";
};

module.exports.config = {
    name: "bby",
    aliases: ["baby","babe","bbe"],
    version: "7.0 Final",
    author: "dipto + Maya",
    role: 0,
    countDown: 0,
    category: "chat",
    description: "Baby chat AI with teach system",
    guide: {
        en: "{pn} text\nteach [msg] - [reply]\nremove [msg]\nrm [msg] - [index]\nedit [msg] - [new]\nmsg [text]\nlist / list all"
    }
};

// ✅ Safe request helper
async function ask(url) {
    try {
        return (await axios.get(url)).data;
    } catch {
        return { reply: "⚠️ Server busy, try again!" };
    }
}

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const text = args.join(" ").toLowerCase();
    const uid = event.senderID;
    const link = await baseApiUrl();

    if (!args[0])
        return api.sendMessage("Bolo baby ❤️", event.threadID, event.messageID);

    // remove all
    if (args[0] === "remove") {
        const q = text.replace("remove ", "");
        const d = await ask(`${link}?remove=${q}&senderID=${uid}`);
        return api.sendMessage(d.message, event.threadID);
    }

    // remove index
    if (args[0] === "rm" && text.includes("-")) {
        const [a,b]= text.replace("rm ","").split(" - ");
        const d = await ask(`${link}?remove=${a}&index=${b}`);
        return api.sendMessage(d.message, event.threadID);
    }

    // list
    if (args[0] === "list") {
        const d = await ask(`${link}?list=all`);
        if (!args[1]) return api.sendMessage(`Total Teach = ${d.length}`, event.threadID);

        const list = await Promise.all(
            d.teacher.teacherList.map(async x=>{
                const id = Object.keys(x)[0];
                const count = x[id];
                const name = (await usersData.get(id))?.name || "Unknown";
                return {name,count};
            })
        );

        list.sort((a,b)=>b.count-a.count);
        const txt = list.map((x,i)=>`${i+1}. ${x.name}: ${x.count}`).join("\n");
        return api.sendMessage(`👑 Baby Teacher List\n${txt}`, event.threadID);
    }

    // msg read
    if (args[0]==="msg"){
        const q = text.replace("msg ","");
        const d = await ask(`${link}?list=${q}`);
        return api.sendMessage(`Message "${q}" = ${d.data}`, event.threadID);
    }

    // edit
    if (args[0]==="edit"){
        const [oldT,newT] = text.replace("edit ","").split(" - ");
        if (!newT) return api.sendMessage("Format: edit old - new", event.threadID);
        const d = await ask(`${link}?edit=${oldT}&replace=${newT}&senderID=${uid}`);
        return api.sendMessage(`✅ Updated: ${d.message}`, event.threadID);
    }

    // teach
    if (args[0]==="teach"){
        const [raw, rep] = text.split(" - ");
        const q = raw.replace("teach ","");
        if(!rep) return api.sendMessage("Format: teach msg - reply", event.threadID);
        const d = await ask(`${link}?teach=${q}&reply=${rep}&senderID=${uid}`);
        return api.sendMessage(`✅ Learned!\n${d.message}`, event.threadID);
    }

    // normal chat
    const d = await ask(`${link}?text=${encodeURIComponent(text)}&senderID=${uid}&font=1`);
    api.sendMessage(d.reply, event.threadID, (e,info)=>{
        global.GoatBot.onReply.set(info.messageID,{
            commandName: module.exports.config.name,
            type:"reply",
            author: uid
        });
    }, event.messageID);
};

// reply mode
module.exports.onReply = async ({ api, event }) => {
    const msg = event.body?.toLowerCase() || "";
    const link = await baseApiUrl();
    const d = await ask(`${link}?text=${encodeURIComponent(msg)}&senderID=${event.senderID}&font=1`);
    api.sendMessage(d.reply, event.threadID, null, event.messageID);
};

// onChat (Old Replies Restored)
module.exports.onChat = async ({ api, event }) => {
    const t = event.body?.toLowerCase() || "";
    if (!["baby","bby","jan","janu","babu","bot","বট","জান","জানু","বাবু"].some(s=>t.startsWith(s))) return;

    const msg = t.split(" ").slice(1).join(" ");

    const oldReplies = [
      "Amar boss ayan ghumaitase - কি বলবা আমাকে বলো 😪💫",
      "_আমার বস Ayan এর মন খারাপ 🥺",
      "_ বট বট করিস না আমার বস singel মেয়েদের সাথে বিজি 😶🥂",
      "তুই কি Wi-Fi? কাছে এলেই কানেকশন হারায়া ফেলি 😵",
      "Hmm bolo 🐹",
      "_বট বট না করে আমার বস Ayan রে মেসেজ দে 🐸",
      "এতো ডাকাডাকি করস কেন 😾",
      "Ayan ke i love u bolo taholey amake paba pio 😏❤️",
      "Yes 🐣",
      "তুই পড়তে না বসে যদি আরেকটা মেসেজ দিস... তাহলে তুই গরু 🐄🤓",
      "I am here 💅",
      "Amar boss ayan er pokho theke ummmmmmmmmmah😘",
      "hae bolo Jan pakhi 🎀✨",
      "হ্যাঁ টুনটুনি বলো 🤭",
      "আমি তোরে সাহায্য করতে পারবো না কারণ তুই অনেক পচা!!😬",
      "_আমাকে না ডেকে আমার বস Ayan কে ডাক দে😝",
      "আমাকে এত ডাকিস কেন!🐥",
      "hae bolo Jan pakhi",
      "হুম বলো না বাবু 🥺",
      "জানু হাঙ্গা করবা🙈",
      "কি বলবা আমার বসের কাছে বল🦆💨",
      "hussss😼"
    ];

    if (!msg)
        return api.sendMessage(oldReplies[Math.floor(Math.random()*oldReplies.length)], event.threadID, event.messageID);

    const link = await baseApiUrl();
    const d = await ask(`${link}?text=${encodeURIComponent(msg)}&senderID=${event.senderID}&font=1`);
    api.sendMessage(d.reply, event.threadID, null, event.messageID);
};
