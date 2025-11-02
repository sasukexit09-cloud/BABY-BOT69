const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const googleTTS = require('google-tts-api');
const ffmpeg = require('fluent-ffmpeg');

const baseApiUrl = async () => "https://www.noobs-api.rf.gd/dipto/baby";

// In-memory set for auto-voice threads
if (!global.GoatVoiceThreads) global.GoatVoiceThreads = new Set();

module.exports.config = {
  name: "bby2",
  aliases: ["baby", "bbe", "babe"],
  version: "7.2.0",
  author: "dipto + Maya Optimized 😎",
  countDown: 0,
  role: 0,
  description: "better than all sim simi 😌",
  category: "chat",
  guide: {
    en: `{pn} hi
teach question - reply1, reply2
teach react question - 😆, 😡
remove question
rm question - index
msg question
list / list all
edit question - newReply
voice on/off    // enable/disable auto voice per thread
voice [text]    // send cute girl voice for specific text`
  }
};

// helper: send message
const send = (api, text, thread, mid) => api.sendMessage(text, thread, mid);

// helper: generate cute girl voice
async function generateCuteGirlVoice(api, threadID, text, eventMessageID, lang = 'bn') {
  try {
    // Step 1: Google TTS MP3
    const url = googleTTS.getAudioUrl(text, { lang, slow: false, host: 'https://translate.google.com' });
    const tempFile = `/tmp/tts_${Date.now()}.mp3`;
    const finalFile = `/tmp/cute_${Date.now()}.mp3`;

    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.outputFile(tempFile, resp.data);

    // Step 2: Pitch + speed tweak for cute girl voice
    await new Promise((resolve, reject) => {
      ffmpeg(tempFile)
        .audioFilters([
          'asetrate=44100*1.25', // higher pitch
          'atempo=1.15'          // slightly faster
        ])
        .save(finalFile)
        .on('end', resolve)
        .on('error', reject);
    });

    // Step 3: send mp3 as attachment
    await api.sendMessage({ attachment: fs.createReadStream(finalFile) }, threadID, (err) => {
      try { fs.removeSync(tempFile); fs.removeSync(finalFile); } catch(e) {}
    }, eventMessageID);

  } catch (e) {
    console.error("Cute girl TTS error:", e);
    await api.sendMessage("Voice error 😢 fallback to text.", threadID);
  }
}

// --- onStart ---
module.exports.onStart = async ({ api, event, args }) => {
  try {
    const q = args.join(" ").trim();
    const uid = event.senderID;

    if (!q) return send(api, "Bolo baby 🐹", event.threadID, event.messageID);

    // Voice commands
    if (args[0] === 'voice') {
      if (!args[1]) return send(api, "Usage: voice on | voice off | voice [text]", event.threadID, event.messageID);

      if (args[1] === 'on') {
        global.GoatVoiceThreads.add(event.threadID);
        return send(api, "✅ Auto cute girl voice ENABLED for this thread.", event.threadID, event.messageID);
      }
      if (args[1] === 'off') {
        global.GoatVoiceThreads.delete(event.threadID);
        return send(api, "✅ Auto voice DISABLED.", event.threadID, event.messageID);
      }

      // voice [text]
      const textToVoice = q.replace(/^voice\s+/, '');
      if (!textToVoice) return send(api, "Provide text for voice.", event.threadID, event.messageID);

      await send(api, `(Voice) ${textToVoice}`, event.threadID, event.messageID);
      return generateCuteGirlVoice(api, event.threadID, textToVoice, event.messageID, 'bn');
    }

    // --- keep your previous commands (teach, remove, list, edit, chat) ---
    // For demo: simple text reply + auto cute girl voice
    const link = await baseApiUrl();
    const reply = (await axios.get(`${link}?text=${encodeURIComponent(q)}&senderID=${uid}&font=1`)).data.reply;

    api.sendMessage(reply, event.threadID, (err, info) => {
      if (global.GoatVoiceThreads.has(event.threadID)) generateCuteGirlVoice(api, event.threadID, reply, event.messageID, 'bn');
    }, event.messageID);

  } catch (e) {
    console.error(e);
    send(api, "Check console for error 😢", event.threadID, event.messageID);
  }
};

// --- onChat ---
module.exports.onChat = async ({ api, event }) => {
  try {
    const body = (event.body || "").toLowerCase();
    const uid = event.senderID;
    const trigger = ["baby","bby","bot","jan","babu","janu","বট","জান","জানু","বাবু"];
    const firstWord = body.split(" ")[0];
    if (!trigger.includes(firstWord)) return;

    const text = body.replace(firstWord, "").trim();
    const link = await baseApiUrl();

    // default text response
    const reply = text
      ? (await axios.get(`${link}?text=${encodeURIComponent(text)}&senderID=${uid}&font=1`)).data.reply
      : ["Hmm bolo 🐹","Amar boss ghumaitase 😪","হ্যাঁ টুনটুনি বলো 🤭"][Math.floor(Math.random()*3)];

    api.sendMessage(reply, event.threadID, (err, info) => {
      if (global.GoatVoiceThreads.has(event.threadID)) generateCuteGirlVoice(api, event.threadID, reply, event.messageID, 'bn');
    }, event.messageID);

  } catch(e){
    console.error(e);
    api.sendMessage("Chat error 😢", event.threadID, event.messageID);
  }
};

// --- onReply ---
module.exports.onReply = async ({ api, event }) => {
  try {
    const text = event.body.toLowerCase();
    const replyText = (await axios.get(`${await baseApiUrl()}?text=${encodeURIComponent(text)}&senderID=${event.senderID}&font=1`)).data.reply;

    api.sendMessage(replyText, event.threadID, (err, info) => {
      if (global.GoatVoiceThreads.has(event.threadID)) generateCuteGirlVoice(api, event.threadID, replyText, event.messageID, 'bn');
    }, event.messageID);

  } catch (e) {
    return api.sendMessage(`Error: ${e.message}`, event.threadID, event.messageID);
  }
};
